const prisma = require("../config/prisma")
const AppError = require("../utils/AppError")

const requireTeamMember = async (req, res, next) => {
  const { teamId } = req.params

  const membership = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: req.user.id, teamId } },
  })

  if (!membership) {
    return next(new AppError("You are not a member of this team", 403, "NOT_TEAM_MEMBER"))
  }

  req.membership = membership
  next()
}

const requireTeamManager = async (req, res, next) => {
  const { teamId } = req.params

  const membership = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: req.user.id, teamId } },
  })

  if (!membership || membership.role !== "MANAGER") {
    return next(new AppError("Only a manager of this team can do that", 403, "NOT_TEAM_MANAGER"))
  }

  req.membership = membership
  next()
}

module.exports = { requireTeamMember, requireTeamManager }