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

const login = asyncHandler(async (req, res) => {
    const { token, user } = await authService.login(req.body)

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.status(200).json({ user })
})

module.exports = {
    signup,
    login,
    logout: notImplemented,
    me: notImplemented,
};