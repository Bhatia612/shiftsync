const asyncHandler = require("../utils/asyncHandler")
const authService = require("../services/auth.services")

const notImplemented = (req, res) => {
    res.status(501).json({
        error: { message: "Not implemented yet", code: "NOT_IMPLEMENTED" }
    })
}

const signup = asyncHandler(async (req, res) => {
    const user = await authService.signup(req.body)
    res.status(201).json({
        user
    })
})

module.exports = {
    signup,
    login: notImplemented,
    logout: notImplemented,
    me: notImplemented,
};