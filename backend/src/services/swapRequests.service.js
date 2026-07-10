const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { checkOverlap } = require("./shifts.service");
const notificationsService = require("./notifications.service");

const TRANSITIONS = {
  PENDING_EMPLOYEE: {
    accept: "PENDING_MANAGER",
    decline: "DENIED",
    cancel: "CANCELLED",
  },
  PENDING_MANAGER: {
    approve: "APPROVED",
    deny: "DENIED",
  },
};

const assertTransition = (swap, action) => {
  const nextStatus = TRANSITIONS[swap.status]?.[action];

  if (!nextStatus) {
    throw new AppError(
      `Cannot ${action} a request in ${swap.status} state`,
      409,
      "INVALID_TRANSITION"
    );
  }

  return nextStatus;
};

// Fire-and-forget notification helper: a notification failure must never
// break the swap operation that already succeeded, and must never make the
// caller wait. We log failures instead of throwing them.
const notifySafe = (payload) => {
  notificationsService
    .notify(payload)
    .catch((err) => console.error("Notification failed:", err));
};

const create = async ({ initiatorUserId, shiftId, targetUserId, counterShiftId }) => {
  if (targetUserId === initiatorUserId) {
    throw new AppError("Cannot target yourself in a swap", 400, "VALIDATION_ERROR");
  }

  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });

  if (!shift) {
    throw new AppError("Shift not found", 404, "SHIFT_NOT_FOUND");
  }

  if (shift.assignedUserId !== initiatorUserId) {
    throw new AppError("You can only offer shifts assigned to you", 403, "NOT_SHIFT_OWNER");
  }

  const targetMembership = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: targetUserId, teamId: shift.teamId } },
  });

  if (!targetMembership) {
    throw new AppError("Target user is not on this team", 404, "USER_NOT_FOUND");
  }

  if (counterShiftId) {
    const counterShift = await prisma.shift.findUnique({ where: { id: counterShiftId } });

    if (!counterShift) {
      throw new AppError("Counter shift not found", 404, "SHIFT_NOT_FOUND");
    }

    if (counterShift.teamId !== shift.teamId) {
      throw new AppError("Both shifts must belong to the same team", 400, "VALIDATION_ERROR");
    }

    if (counterShift.assignedUserId !== targetUserId) {
      throw new AppError(
        "Counter shift must be assigned to the target user",
        400,
        "VALIDATION_ERROR"
      );
    }
  }

  const swapRequest = await prisma.swapRequest.create({
    data: {
      initiatorUserId,
      shiftId,
      targetUserId,
      counterShiftId: counterShiftId || null,
    },
  });

  // Target learns they have a swap to respond to.
  notifySafe({
    userId: targetUserId,
    type: "SWAP_REQUESTED",
    payload: { swapRequestId: swapRequest.id, shiftId, fromUserId: initiatorUserId },
  });

  return swapRequest;
};

const list = async ({ userId, role, status }) => {
  if (role === "manager") {
    const membership = await prisma.membership.findFirst({
      where: { userId, role: "MANAGER" },
    });

    if (!membership) {
      throw new AppError("You are not a manager of any team", 403, "NOT_TEAM_MANAGER");
    }

    return prisma.swapRequest.findMany({
      where: {
        shift: { teamId: membership.teamId },
        status: status || "PENDING_MANAGER",
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return prisma.swapRequest.findMany({
    where: {
      OR: [{ initiatorUserId: userId }, { targetUserId: userId }],
      ...(status && { status }),
    },
    orderBy: { createdAt: "desc" },
  });
};

const getOne = async ({ id, userId }) => {
  const swap = await prisma.swapRequest.findUnique({
    where: { id },
    include: { shift: true, counterShift: true },
  });

  if (!swap) {
    throw new AppError("Swap request not found", 404, "SWAP_NOT_FOUND");
  }

  const isInvolved = swap.initiatorUserId === userId || swap.targetUserId === userId;

  if (!isInvolved) {
    const membership = await prisma.membership.findUnique({
      where: { userId_teamId: { userId, teamId: swap.shift.teamId } },
    });

    if (!membership || membership.role !== "MANAGER") {
      throw new AppError("You are not involved in this swap request", 403, "FORBIDDEN");
    }
  }

  return swap;
};

const respond = async ({ id, userId, decision }) => {
  if (decision !== "accept" && decision !== "decline") {
    throw new AppError("Decision must be 'accept' or 'decline'", 400, "VALIDATION_ERROR");
  }

  const swap = await prisma.swapRequest.findUnique({ where: { id } });

  if (!swap) {
    throw new AppError("Swap request not found", 404, "SWAP_NOT_FOUND");
  }

  if (swap.targetUserId !== userId) {
    throw new AppError("Only the target of this request can respond", 403, "NOT_SWAP_TARGET");
  }

  const nextStatus = assertTransition(swap, decision === "accept" ? "accept" : "decline");

  const updated = await prisma.swapRequest.update({
    where: { id },
    data: {
      status: nextStatus,
      respondedAt: new Date(),
      ...(nextStatus === "DENIED" && { resolvedAt: new Date() }),
    },
  });

  // Initiator learns whether the target accepted (now pending manager) or declined.
  notifySafe({
    userId: swap.initiatorUserId,
    type: nextStatus === "PENDING_MANAGER" ? "SWAP_ACCEPTED" : "SWAP_DENIED",
    payload: { swapRequestId: id },
  });

  return updated;
};

const approve = async ({ id, userId }) => {
  const swap = await prisma.swapRequest.findUnique({
    where: { id },
    include: { shift: true, counterShift: true },
  });

  if (!swap) {
    throw new AppError("Swap request not found", 404, "SWAP_NOT_FOUND");
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_teamId: { userId, teamId: swap.shift.teamId } },
  });

  if (!membership || membership.role !== "MANAGER") {
    throw new AppError("Only a manager of this team can approve", 403, "NOT_TEAM_MANAGER");
  }

  const nextStatus = assertTransition(swap, "approve");

  const targetConflict = await checkOverlap({
    userId: swap.targetUserId,
    startTime: swap.shift.startTime,
    endTime: swap.shift.endTime,
    excludeShiftId: swap.counterShiftId,
  });

  if (targetConflict) {
    throw new AppError(
      "Approving would double-book the target user",
      409,
      "SHIFT_OVERLAP"
    );
  }

  if (swap.counterShift) {
    const initiatorConflict = await checkOverlap({
      userId: swap.initiatorUserId,
      startTime: swap.counterShift.startTime,
      endTime: swap.counterShift.endTime,
      excludeShiftId: swap.shiftId,
    });

    if (initiatorConflict) {
      throw new AppError(
        "Approving would double-book the initiator",
        409,
        "SHIFT_OVERLAP"
      );
    }
  }

  const operations = [
    prisma.shift.update({
      where: { id: swap.shiftId },
      data: { assignedUserId: swap.targetUserId },
    }),
  ];

  if (swap.counterShiftId) {
    operations.push(
      prisma.shift.update({
        where: { id: swap.counterShiftId },
        data: { assignedUserId: swap.initiatorUserId },
      })
    );
  }

  operations.push(
    prisma.swapRequest.update({
      where: { id },
      data: { status: nextStatus, resolvedAt: new Date() },
    })
  );

  const results = await prisma.$transaction(operations);

  // Both parties learn the swap went through.
  notifySafe({
    userId: swap.initiatorUserId,
    type: "SWAP_APPROVED",
    payload: { swapRequestId: id },
  });
  notifySafe({
    userId: swap.targetUserId,
    type: "SWAP_APPROVED",
    payload: { swapRequestId: id },
  });

  return results[results.length - 1];
};

const deny = async ({ id, userId }) => {
  const swap = await prisma.swapRequest.findUnique({
    where: { id },
    include: { shift: true },
  });

  if (!swap) {
    throw new AppError("Swap request not found", 404, "SWAP_NOT_FOUND");
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_teamId: { userId, teamId: swap.shift.teamId } },
  });

  if (!membership || membership.role !== "MANAGER") {
    throw new AppError("Only a manager of this team can deny", 403, "NOT_TEAM_MANAGER");
  }

  const nextStatus = assertTransition(swap, "deny");

  const updated = await prisma.swapRequest.update({
    where: { id },
    data: { status: nextStatus, resolvedAt: new Date() },
  });

  // Both parties learn the manager denied it.
  notifySafe({
    userId: swap.initiatorUserId,
    type: "SWAP_DENIED",
    payload: { swapRequestId: id },
  });
  notifySafe({
    userId: swap.targetUserId,
    type: "SWAP_DENIED",
    payload: { swapRequestId: id },
  });

  return updated;
};

const cancel = async ({ id, userId }) => {
  const swap = await prisma.swapRequest.findUnique({ where: { id } });

  if (!swap) {
    throw new AppError("Swap request not found", 404, "SWAP_NOT_FOUND");
  }

  if (swap.initiatorUserId !== userId) {
    throw new AppError("Only the initiator can cancel this request", 403, "NOT_SWAP_INITIATOR");
  }

  const nextStatus = assertTransition(swap, "cancel");

  const updated = await prisma.swapRequest.update({
    where: { id },
    data: { status: nextStatus, resolvedAt: new Date() },
  });

  // Target learns the initiator withdrew the request.
  notifySafe({
    userId: swap.targetUserId,
    type: "SWAP_CANCELLED",
    payload: { swapRequestId: id },
  });

  return updated;
};

module.exports = { create, list, getOne, respond, approve, deny, cancel };