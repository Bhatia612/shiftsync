const asyncHandler = require("../utils/asyncHandler")
const shiftServices = require("../services/shifts.service")


const createShift = asyncHandler(async (req, res) => {
    const shift = await shiftServices.createShift({
        teamId: req.params.teamId,
        startTime: req.body.startTime,
        endTime: req.body.endTIme,
        assignedUserId: req.body.assignedUserId
    })

    res.status(201).json({ shift })
})


const listShiftsForTeam = asyncHandler(async (req, res) => {
    const shifts = await shiftServices.listShiftsForTeam({
        teamId: req.params.teamId,
        from: req.query.from,
        to: req.query.to,
    })

    res.status(200).json({ shifts })
})


const getShift = asyncHandler(async (req, res) => {
    const shift = await shiftServices.getShift(req.params.shiftId)
    res.status(200).json({ shift })
})


const updateShift = asyncHandler(async (req, res) => {
    const shift = await shiftServices.updateShift({
        shiftId: req.params.shiftId,
        data: req.body
    })

    res.status(200).json({ shift })
})


const deleteShift = asyncHandler(async (req, res) => {
    await shiftServices.deleteShift(req.params.shiftId)
    res.status(204).send()
})


module.exports = {
    createShift,
    listShiftsForTeam,
    getShift,
    updateShift,
    deleteShift
};