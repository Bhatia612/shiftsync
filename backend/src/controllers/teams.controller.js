const asyncHandler = require("../utils/asyncHandler")
const teamService = require("../services/teams.service")

const createTeam = asyncHandler(async (req, res) => {
    const team = await teamService.createTeam({
        name: req.body.name,
        userId: req.user.id
    })

    res.status(201).json({ team })

})


const getTeam = asyncHandler(async (req, res) => {
    const team = await teamService.getTeam(req.params.teamId)
    res.status(200).json({ team })
})


const listMembers = asyncHandler(async (req, res) => {
    const members = await teamService.listMembers(req.params.teamId)
    res.status(200).json({ team })
})


const addMember = asyncHandler(async (req, res) => {
    const membership = await teamService.addMember({
        teamId: req.params.teamId,
        email: req.body.email,
        role: req.body.role
    })

    res.status(200).json({ membership })
})


const updateMemberRole = asyncHandler(async (req, res) => {
    const membership = await teamService.updateMemberRole({
        teamId: req.params.teamId,
        userId: req.params.userId,
        role: req.body.role
    })

    res.status(200).json({ membership })
})


const removeMember = asyncHandler(async (req, res) => {
    await teamService.removeMember({
        teamId: req.params.teamId,
        userId: req.params.userId
    })

    res.status(204).send()

})


module.exports = {
    createTeam,
    getTeam,
    listMembers,
    addMember,
    updateMemberRole,
    removeMember,
};