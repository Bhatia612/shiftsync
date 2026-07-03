const notImplemented = (req, res) => {
    res.status(501).json({ error: { message: "Not implemented yet", code: "NOT_IMPLEMENTED" } });
};

module.exports = {
    create: notImplemented,
    list: notImplemented,
    getOne: notImplemented,
    respond: notImplemented,
    approve: notImplemented,
    deny: notImplemented,
    cancel: notImplemented,
};