const prisma = require("../config/prisma")
const AppError = require("../utils/AppError")

const loadShiftTeamContext = (requiredRole) => async (req, res, next) => {
    const { shiftId } = req.params

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } })

    if (!shift) {
        return next(new AppError("Shift not found", 404, "SHIFT_NOT_FOUND"))
    }

    const membership = await prisma.membership.findUnique({
        where: { userId_teamId: { userId: req.user.id, teamId: shift.teamId } }
    })

    if (!membership) {
        return next(new AppError("You are not a member of this team", 403, "NOT_TEAM_MEMBER"));
    }

    if (requiredRole === "MANAGER" && membership.role !== "MANAGER") {
        return next(new AppError("Only a manager of this team can do that", 403, "NOT_TEAM_MANAGER"));
    }

    req.shift = shift;
    req.membership = membership;
    next();
}

module.exports = { loadShiftTeamContext }