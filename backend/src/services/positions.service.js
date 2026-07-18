const prisma = require("../config/prisma")
const AppError = require("../utils/AppError")

const createPosition = async ({ teamId, name }) => {
    const trimmed = name?.trim()


    if (!trimmed) {
        throw new AppError("Position name is required", 400, "VALIDATION_ERROR")
    }

    const existing = await prisma.position.findUnique({
        where: { teamId_name: { teamId, name: trimmed } }
    })

    if (existing) {
        throw new AppError("This team already has a position with that name", 409, "POSITION_EXISTS")
    }

    const position = await prisma.position.create({
        data: { teamId, name: trimmed }
    })

    return position
}


const listPositions = async (teamId) => {
    return prisma.position.findMany({
        where: { teamId },
        orderBy: { name: "asc" },
    })
}

const deletePosition = async ({ teamId, positionId }) => {
    const position = await prisma.position.findUnique({
        where: { id: positionId }
    })

    if (!position || position.teamId !== teamId) {
        throw new AppError("Position not found", 404, "POSITION_NOT_FOUND")
    }

    const shiftUsingIt = await prisma.shift.findFirst({
        where: { positionId }
    })


    if (shiftUsingIt) {
        throw new AppError(
            "Cannot delete a position that still has shifts assigned to it",
            409,
            "POSITION_IN_USE"
        )
    }

    await prisma.position.delete({ where: { id: positionId } })
}

module.exports = { createPosition, listPositions, deletePosition }