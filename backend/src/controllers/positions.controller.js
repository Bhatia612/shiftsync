const asyncHandler = require("../utils/asyncHandler")
const positionServices = require("../services/positions.service")

const createPosition = asyncHandler(async (req, res) => {
    const position = await positionServices.createPosition({
        teamId: req.params.teamId,
        name: req.body.name
    })

    res.status(201).json({ position })
})

const listPositions = asyncHandler(async (req, res) => {
    const positions = await positionServices.listPositions(req.params.teamId)
    
    res.status(200).json({ positions })

})


const deletePosition = asyncHandler(async (req, res) => {
    await positionServices.deletePosition({
        teamId: req.params.teamId,
        positionId: req.params.positionId,
    })

    res.status(204).send()
})

module.exports = { createPosition, listPositions, deletePosition }