const prisma = require("../config/prisma")
const AppError = require("../utils/AppError")


const checkOverlap = async ({ userId, startTime, endTime, excludeShiftId }) => {
    const overlapping = await prisma.shift.findFirst({
        where: {
            assignedUserId: userId,
            startTime: { lt: endTime },
            endTime: { gt: startTime },
            ...(excludeShiftId && { id: { not: excludeShiftId } }),
        },
    })

    return overlapping
}



const createShift = async ({ teamId, positionId, startTime, endTime, assignedUserId }) => {
    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new AppError("startTime and endTime must be valid dates", 400, "VALIDATION_ERROR")
    }

    if (start >= end) {
        throw new AppError("startTime must be before endTime", 400, "VALIDATION_ERROR")
    }

    // Position must exist and belong to this team.
    const position = await prisma.position.findUnique({ where: { id: positionId } })

    if (!position || position.teamId !== teamId) {
        throw new AppError("Position not found on this team", 400, "POSITION_NOT_FOUND")
    }

    if (assignedUserId) {
        const membership = await prisma.membership.findUnique({
            where: { userId_teamId: { userId: assignedUserId, teamId } },
        })

        if (!membership) {
            throw new AppError("Assigned user is not a member of this team", 400, "NOT_TEAM_MEMBER")
        }

        const overlap = await checkOverlap({ userId: assignedUserId, startTime: start, endTime: end })

        if (overlap) {
            throw new AppError("User already has a shift in this time range", 409, "SHIFT_OVERLAP")
        }
    }

    const shift = await prisma.shift.create({
        data: {
            teamId,
            positionId,
            startTime: start,
            endTime: end,
            assignedUserId: assignedUserId || null,
        },
    })

    return shift
}


const listShiftsForTeam = async ({ teamId, from, to }) => {
    const where = { teamId }

    if (from || to) {
        where.startTime = {}
        if (from) where.startTime.gte = new Date(from)
        if (to) where.startTime.lte = new Date(to)
    }

    const shifts = await prisma.shift.findMany({
        where,
        orderBy: { startTime: "asc" },
        include: {
            assignedUser: { select: { id: true, name: true } },
        },
    })

    return shifts
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
    const existing = await prisma.shift.findUnique({ where: { id: shiftId } })

    if (!existing) {
        throw new AppError("Shift not found", 404, "SHIFT_NOT_FOUND")
    }

    const startTime = data.startTime ? new Date(data.startTime) : existing.startTime
    const endTime = data.endTime ? new Date(data.endTime) : existing.endTime

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new AppError("startTime and endTime must be valid dates", 400, "VALIDATION_ERROR")
    }

    if (startTime >= endTime) {
        throw new AppError("startTime must be before endTime", 400, "VALIDATION_ERROR")
    }

    // If the position is being changed, validate the new one belongs to this team.
    if (data.positionId !== undefined) {
        const position = await prisma.position.findUnique({ where: { id: data.positionId } })

        if (!position || position.teamId !== existing.teamId) {
            throw new AppError("Position not found on this team", 400, "POSITION_NOT_FOUND")
        }
    }

    const assignedUserId =
        data.assignedUserId !== undefined ? data.assignedUserId : existing.assignedUserId

    if (assignedUserId) {
        const membership = await prisma.membership.findUnique({
            where: { userId_teamId: { userId: assignedUserId, teamId: existing.teamId } },
        })

        if (!membership) {
            throw new AppError("Assigned user is not a member of this team", 400, "NOT_TEAM_MEMBER")
        }

        const overlap = await checkOverlap({
            userId: assignedUserId,
            startTime,
            endTime,
            excludeShiftId: shiftId,
        })

        if (overlap) {
            throw new AppError("User already has a shift in this time range", 409, "SHIFT_OVERLAP")
        }
    }

    const updateData = {
        startTime,
        endTime,
        assignedUserId,
    }

    // Only include positionId in the update if it was provided.
    if (data.positionId !== undefined) {
        updateData.positionId = data.positionId
    }

    const shift = await prisma.shift.update({
        where: { id: shiftId },
        data: updateData,
    })

    return shift
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