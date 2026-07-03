const notImplemented = (req, res) => {
    res.status(501).json({ error: { message: "Not implemented yet", code: "NOT_IMPLEMENTED" } });
};

module.exports = {
    createShift: notImplemented,
    listShiftsForTeam: notImplemented,
    getShift: notImplemented,
    updateShift: notImplemented,
    deleteShift: notImplemented,
};