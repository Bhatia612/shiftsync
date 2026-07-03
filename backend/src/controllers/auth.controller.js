const notImplemented = (req, res) => {
    res.status(501).json(
        {
            error: { message: "Not implemented yet", code: "NOT_IMPLEMENTED" }
        }
    )
}

module.exports = {
    signup: notImplemented,
    login: notImplemented,
    logout: notImplemented,
    me: notImplemented,
};