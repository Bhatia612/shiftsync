const prisma = require("../config/prisma")
const AppError = require("../utils/AppError")

const createTeam = async ({ name, userId }) => {
    const existingMembership = await prisma.membership.findUnique({
        where: { userId }
    })

    if (existingMembership) {
        throw new AppError("You already belong to a team", 409, "ALREADY_ON_TEAM")
    }

    const team = await prisma.team.create({
        data: {
            name,
            membership: {
                create: { userId, role: "MANAGER" }
            }
        }
    })

    return { id: team.id, name: team.name }
}

const getTeam = async (teamId) => {
    const team = await prisma.team.findUnique({
        where: {
            id: teamId
        }
    })

    if (!team) {
        throw new AppError("Team not found", 404, "TEAM_NOT_FOUND")
    }


    return { id: team.id, name: team.name, createdAt: team.createAt }

}

const listMembers = async (teamId) => {
    const memberships = await prisma.membership.findMany({
        where: { teamId },
        include: { user: { select: { id: true, name: true, email: true } } }
    })

    return memberships.map(m => ({
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role

    }))
}


const addMember = async ({ teamId, email, role }) => {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
        throw new AppError("No user found with that email", 404, "USER_NOT_FOUND")
    }

    const membership = await prisma.membership.create({
        data: { userId: user.id, teamId, role }
    })

    return { userId: membership.userId, teamId: membership.teamId, role: membership.role }

}


const updateMemberRole = async ({ teamId, userId, role }) => {
    const membership = await prisma.membership.findUnique({
        where: { userId_teamId: { userId, teamId }, }
    })

    if (!membership) {
        throw new AppError("Membership not found", 404, "MEMBERSHIP_NOT_FOUND")
    }

    const updated = await prisma.membership.update({
        where: { userId_teamId: { userId, teamId } },
        data: { role },
    })

    return { userId: updated.userId, teamId: updated.teamId, role: updated.role }
}

const removeMember = async ({ teamId, userId }) => {
    const membership = await prisma.membership.findUnique({
        where: { userId_teamId: { userId, teamId } },
    })

    if (!membership) {
        throw new AppError("Membership not found", 404, "MEMBERSHIP_NOT_FOUND")
    }

    await prisma.membership.delete({
        where: { userId_teamId: { userId, teamId } }
    })
}

module.exports = {
    createTeam,
    getTeam,
    listMembers,
    addMember,
    updateMemberRole,
    removeMember
}