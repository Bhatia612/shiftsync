jest.mock("../../../src/config/prisma", () => ({
  swapRequest: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  shift: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  membership: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
}));

jest.mock("../../../src/services/notifications.service", () => ({
  notify: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../../src/services/shifts.service", () => ({
  checkOverlap: jest.fn(),
}));

const prisma = require("../../../src/config/prisma");
const { checkOverlap } = require("../../../src/services/shifts.service");
const swapService = require("../../../src/services/swapRequests.service");

const USERS = {
  initiator: "user-a",
  target: "user-b",
  manager: "user-m",
  stranger: "user-x",
};

const TEAM_ID = "team-1";

const baseShift = {
  id: "shift-1",
  teamId: TEAM_ID,
  startTime: new Date("2026-07-10T09:00:00Z"),
  endTime: new Date("2026-07-10T17:00:00Z"),
  assignedUserId: USERS.initiator,
};

const counterShift = {
  id: "shift-2",
  teamId: TEAM_ID,
  startTime: new Date("2026-07-11T09:00:00Z"),
  endTime: new Date("2026-07-11T17:00:00Z"),
  assignedUserId: USERS.target,
};

const pendingEmployeeSwap = {
  id: "swap-1",
  initiatorUserId: USERS.initiator,
  shiftId: baseShift.id,
  targetUserId: USERS.target,
  counterShiftId: null,
  status: "PENDING_EMPLOYEE",
};

const pendingManagerSwap = {
  ...pendingEmployeeSwap,
  status: "PENDING_MANAGER",
  shift: baseShift,
  counterShift: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("create", () => {
  test("rejects targeting yourself", async () => {
    await expect(
      swapService.create({
        initiatorUserId: USERS.initiator,
        shiftId: baseShift.id,
        targetUserId: USERS.initiator,
        counterShiftId: null,
      })
    ).rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
  });

  test("rejects offering a shift you don't own", async () => {
    prisma.shift.findUnique.mockResolvedValue({
      ...baseShift,
      assignedUserId: USERS.stranger,
    });

    await expect(
      swapService.create({
        initiatorUserId: USERS.initiator,
        shiftId: baseShift.id,
        targetUserId: USERS.target,
        counterShiftId: null,
      })
    ).rejects.toMatchObject({ statusCode: 403, code: "NOT_SHIFT_OWNER" });
  });

  test("rejects a counter-shift not owned by the target", async () => {
    prisma.shift.findUnique
      .mockResolvedValueOnce(baseShift)
      .mockResolvedValueOnce({ ...counterShift, assignedUserId: USERS.stranger });
    prisma.membership.findUnique.mockResolvedValue({
      userId: USERS.target,
      teamId: TEAM_ID,
      role: "EMPLOYEE",
    });

    await expect(
      swapService.create({
        initiatorUserId: USERS.initiator,
        shiftId: baseShift.id,
        targetUserId: USERS.target,
        counterShiftId: counterShift.id,
      })
    ).rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
  });

  test("creates a valid one-way request", async () => {
    prisma.shift.findUnique.mockResolvedValue(baseShift);
    prisma.membership.findUnique.mockResolvedValue({
      userId: USERS.target,
      teamId: TEAM_ID,
      role: "EMPLOYEE",
    });
    prisma.swapRequest.create.mockResolvedValue(pendingEmployeeSwap);

    const result = await swapService.create({
      initiatorUserId: USERS.initiator,
      shiftId: baseShift.id,
      targetUserId: USERS.target,
      counterShiftId: null,
    });

    expect(result.status).toBe("PENDING_EMPLOYEE");
    expect(prisma.swapRequest.create).toHaveBeenCalledWith({
      data: {
        initiatorUserId: USERS.initiator,
        shiftId: baseShift.id,
        targetUserId: USERS.target,
        counterShiftId: null,
      },
    });
  });
});

describe("respond", () => {
  test("only the target may respond", async () => {
    prisma.swapRequest.findUnique.mockResolvedValue(pendingEmployeeSwap);

    await expect(
      swapService.respond({ id: "swap-1", userId: USERS.initiator, decision: "accept" })
    ).rejects.toMatchObject({ statusCode: 403, code: "NOT_SWAP_TARGET" });
  });

  test("accept moves PENDING_EMPLOYEE -> PENDING_MANAGER", async () => {
    prisma.swapRequest.findUnique.mockResolvedValue(pendingEmployeeSwap);
    prisma.swapRequest.update.mockResolvedValue({
      ...pendingEmployeeSwap,
      status: "PENDING_MANAGER",
    });

    const result = await swapService.respond({
      id: "swap-1",
      userId: USERS.target,
      decision: "accept",
    });

    expect(result.status).toBe("PENDING_MANAGER");
  });

  test("decline moves PENDING_EMPLOYEE -> DENIED and sets resolvedAt", async () => {
    prisma.swapRequest.findUnique.mockResolvedValue(pendingEmployeeSwap);
    prisma.swapRequest.update.mockResolvedValue({
      ...pendingEmployeeSwap,
      status: "DENIED",
    });

    await swapService.respond({ id: "swap-1", userId: USERS.target, decision: "decline" });

    const updateArg = prisma.swapRequest.update.mock.calls[0][0];
    expect(updateArg.data.status).toBe("DENIED");
    expect(updateArg.data.resolvedAt).toBeInstanceOf(Date);
  });

  test("responding to an already-resolved request is an invalid transition", async () => {
    prisma.swapRequest.findUnique.mockResolvedValue({
      ...pendingEmployeeSwap,
      status: "APPROVED",
    });

    await expect(
      swapService.respond({ id: "swap-1", userId: USERS.target, decision: "accept" })
    ).rejects.toMatchObject({ statusCode: 409, code: "INVALID_TRANSITION" });
  });

  test("rejects a garbage decision value", async () => {
    await expect(
      swapService.respond({ id: "swap-1", userId: USERS.target, decision: "maybe" })
    ).rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
  });
});

describe("cancel", () => {
  test("only the initiator may cancel", async () => {
    prisma.swapRequest.findUnique.mockResolvedValue(pendingEmployeeSwap);

    await expect(
      swapService.cancel({ id: "swap-1", userId: USERS.target })
    ).rejects.toMatchObject({ statusCode: 403, code: "NOT_SWAP_INITIATOR" });
  });

  test("cannot cancel once the target has accepted", async () => {
    prisma.swapRequest.findUnique.mockResolvedValue({
      ...pendingEmployeeSwap,
      status: "PENDING_MANAGER",
    });

    await expect(
      swapService.cancel({ id: "swap-1", userId: USERS.initiator })
    ).rejects.toMatchObject({ statusCode: 409, code: "INVALID_TRANSITION" });
  });

  test("cancels from PENDING_EMPLOYEE", async () => {
    prisma.swapRequest.findUnique.mockResolvedValue(pendingEmployeeSwap);
    prisma.swapRequest.update.mockResolvedValue({
      ...pendingEmployeeSwap,
      status: "CANCELLED",
    });

    const result = await swapService.cancel({ id: "swap-1", userId: USERS.initiator });
    expect(result.status).toBe("CANCELLED");
  });
});

describe("approve", () => {
  const managerMembership = { userId: USERS.manager, teamId: TEAM_ID, role: "MANAGER" };

  test("only a manager of the team may approve", async () => {
    prisma.swapRequest.findUnique.mockResolvedValue(pendingManagerSwap);
    prisma.membership.findUnique.mockResolvedValue({
      userId: USERS.stranger,
      teamId: TEAM_ID,
      role: "EMPLOYEE",
    });

    await expect(
      swapService.approve({ id: "swap-1", userId: USERS.stranger })
    ).rejects.toMatchObject({ statusCode: 403, code: "NOT_TEAM_MANAGER" });
  });

  test("cannot approve a request still awaiting the employee", async () => {
    prisma.swapRequest.findUnique.mockResolvedValue({
      ...pendingManagerSwap,
      status: "PENDING_EMPLOYEE",
    });
    prisma.membership.findUnique.mockResolvedValue(managerMembership);

    await expect(
      swapService.approve({ id: "swap-1", userId: USERS.manager })
    ).rejects.toMatchObject({ statusCode: 409, code: "INVALID_TRANSITION" });
  });

  test("blocks approval if the target now has a conflicting shift", async () => {
    prisma.swapRequest.findUnique.mockResolvedValue(pendingManagerSwap);
    prisma.membership.findUnique.mockResolvedValue(managerMembership);
    checkOverlap.mockResolvedValue({ id: "some-other-shift" });

    await expect(
      swapService.approve({ id: "swap-1", userId: USERS.manager })
    ).rejects.toMatchObject({ statusCode: 409, code: "SHIFT_OVERLAP" });
  });

  test("approves a one-way swap: reassigns shift and resolves request in a transaction", async () => {
    prisma.swapRequest.findUnique.mockResolvedValue(pendingManagerSwap);
    prisma.membership.findUnique.mockResolvedValue(managerMembership);
    checkOverlap.mockResolvedValue(null);
    prisma.$transaction.mockResolvedValue([
      {},
      { ...pendingManagerSwap, status: "APPROVED" },
    ]);

    const result = await swapService.approve({ id: "swap-1", userId: USERS.manager });

    expect(result.status).toBe("APPROVED");
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction.mock.calls[0][0]).toHaveLength(2);
  });

  test("THE BIG ONE: same-time two-way trade must not false-conflict", async () => {
    const sameTimeCounter = {
      ...counterShift,
      startTime: baseShift.startTime,
      endTime: baseShift.endTime,
    };
    const twoWaySwap = {
      ...pendingManagerSwap,
      counterShiftId: sameTimeCounter.id,
      counterShift: sameTimeCounter,
    };

    prisma.swapRequest.findUnique.mockResolvedValue(twoWaySwap);
    prisma.membership.findUnique.mockResolvedValue(managerMembership);
    checkOverlap.mockResolvedValue(null);
    prisma.$transaction.mockResolvedValue([{}, {}, { ...twoWaySwap, status: "APPROVED" }]);

    await swapService.approve({ id: "swap-1", userId: USERS.manager });

    const overlapCalls = checkOverlap.mock.calls;
    expect(overlapCalls[0][0].excludeShiftId).toBe(sameTimeCounter.id);
    expect(overlapCalls[1][0].excludeShiftId).toBe(baseShift.id);
    expect(prisma.$transaction.mock.calls[0][0]).toHaveLength(3);
  });
});