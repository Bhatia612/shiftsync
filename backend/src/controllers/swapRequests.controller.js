const asyncHandler = require("../utils/asyncHandler");
const swapRequestsService = require("../services/swapRequests.service");

const create = asyncHandler(async (req, res) => {
    const swapRequest = await swapRequestsService.create({
        initiatorUserId: req.user.id,
        shiftId: req.body.shiftId,
        targetUserId: req.body.targetUserId,
        counterShiftId: req.body.counterShiftId,
    });
    res.status(201).json({ swapRequest });
});

const list = asyncHandler(async (req, res) => {
    const swapRequests = await swapRequestsService.list({
        userId: req.user.id,
        role: req.query.role,
        status: req.query.status,
    });
    res.status(200).json({ swapRequests });
});

const getOne = asyncHandler(async (req, res) => {
    const swapRequest = await swapRequestsService.getOne({
        id: req.params.id,
        userId: req.user.id,
    });
    res.status(200).json({ swapRequest });
});

const respond = asyncHandler(async (req, res) => {
    const swapRequest = await swapRequestsService.respond({
        id: req.params.id,
        userId: req.user.id,
        decision: req.body.decision,
    });
    res.status(200).json({ swapRequest });
});

const approve = asyncHandler(async (req, res) => {
    const swapRequest = await swapRequestsService.approve({
        id: req.params.id,
        userId: req.user.id,
    });
    res.status(200).json({ swapRequest });
});

const deny = asyncHandler(async (req, res) => {
    const swapRequest = await swapRequestsService.deny({
        id: req.params.id,
        userId: req.user.id,
    });
    res.status(200).json({ swapRequest });
});

const cancel = asyncHandler(async (req, res) => {
    const swapRequest = await swapRequestsService.cancel({
        id: req.params.id,
        userId: req.user.id,
    });
    res.status(200).json({ swapRequest });
});

module.exports = { create, list, getOne, respond, approve, deny, cancel };