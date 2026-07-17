const asyncHandler = require("../utils/asyncHandler")
const authService = require("../services/auth.service")

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

const logout = asyncHandler(async (req, res) => {
    res.clearCookie("token")
    res.status(200).json({ message: "Logged out" })
})

const me = asyncHandler(async (req, res) => {
    const membership = await authService.getMe(req.user.id)
    res.status(200).json({ user: req.user, membership })
})

module.exports = {
    signup,
    login,
    logout,
    me,
};