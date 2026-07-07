const prisma = require("../config/prisma")
const AppError = require("../utils/AppError")


const checkOverlap = async ({ userId, startTime, endTime, excludeShitId }) => {
    const overlapping = await prisma.shift.findFirst({
        where: {
            assignedUser: userId,
            startTime: { lt: endTime },
            endTime: { gt: startTime },
            ...(excludeShitId && { id: { not: excludeShitId } })
        }
    })

    return overlapping
}



const createShift = async ({ teamId, startTime, endTime, assignedUserId }) => {
    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new AppError("startTime and endTime must be valid dates", 400), "VALIDATION_ERROR"
    }

    if (start >= end) {
        throw new AppError("startTime and endTime must be valid dates", 400, "VALIDATION_ERROR");
    }

    if (assignedUserId) {
        const membership = await prisma.membership.findUnique({
            where: { userId_teamId: { userId: assignedUserId, teamId } }
        })
    }

    if (!membership) {
        throw new AppError("Assigned user is not a member of this team", 400, "NOT_TEAM_MEMBER");
    }

    const overlap = await checkOverlap({ userId: assignedUserId, startTime: start, endTime: end })

    if (overlap) {
        throw new AppError("User already has a shift in this time range", 409, "SHIFT_OVERLAP");
    }

    const shift = await prisma.shift.create({
        data: { teamId, startTime: start, endTime: end, assignedUserId: assignedUserId || null }
    })

    return shift

}



const listShiftsForTeam = async (teamId, from, to) => {
    const where = { teamId }

    if (from || to) {
        where.startTime = {};
        if (from) where.startTime.gte = new Date(from);
        if (to) { where.startTime.lte = new Date(to) };
    }

    const shifts = await prisma.shift.findMany({
        where,
        orderBy: { startTime: "asc" },
        include: { assignedUser: { select: { id: true, name: true } } }
    })

    return shifts;
}


const getShift = async (shiftId) => {
    const shift = await prisma.shift.findUnique({
        where: { id: shiftId },
        include: { assignedUser: { select: { id: true, name: true } } }
    })

    if (!shift) {
        throw new AppError("Shift not found", 404, "SHIFT_NOT_FOUND")
    }

    return shift;

}


const updateShift = async ({ shiftId, data }) => {
    const existing = await prisma.shift.findUnique({
        where: { id: shiftId }
    })

    if (!existing) {
        throw new AppError("Shift not found", 404, "SHIFT_NOT_FOUND")
    }

    const startTime = data.startTime ? new Date(data.startTime) : existing.startTime;
    const endTime = data.endTime ? new Date(data.endTime) : existing.endTime;

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new AppError("startTime and endTime must be valid dates", 400, "VALIDATION_ERROR");
    }

    if (startTime >= endTime) {
        throw new AppError("startTime must be before endTime", 400, "VALIDATION_ERROR");
    }

    const assignedUserId = data.assignedUserId !== undefined ? data.assignedUserId : existing.assignedUserId

    if (assignedUserId) {
        const membership = await prisma.membership.findUnique({
            where: { userId_teamId: { userId: assignedUserId, teamId: existing.teamId } }
        })
    }

    if (!membership) {
        throw new AppError("Assigned use is not a member of this team", 400, "NOT_TEAM_MEMBER")
    }

    const overlap = await checkOverlap({
        userId: assignedUserId,
        startTime,
        endTime,
        excludeShitId: shiftId
    })

    if (overlap) {
        throw new AppError("User already has a shift in this time range", 409, "SHIFT_OVERLAP");
    }

    const shift = await prisma.shift.update({
        where: {
            id: shiftId,
            data: { startTime, endTime, assignedUserId }
        }
    })

    return shift;

}


const deleteShift = async (shiftId) => {
    const existing = await prisma.shift.findUnique({ where: { id: shiftId } })

    if (!existing) {
        throw new AppError("Shift not found", 404, "SHIFT_NOT_FOUND")
    }

    await prisma.shift.delete({ where: { id: shiftId } })
}



module.exports = {
    checkOverlap,
    createShift,
    listShiftsForTeam,
    getShift,
    updateShift,
    deleteShift,
};