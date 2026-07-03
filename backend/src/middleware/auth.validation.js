const AppError = require("../utils/AppError")

const validateSignup = (req, res, next) => {
    const { name, email, password } = req.body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
        return next(new AppError("Name is required", 400, "VALIDATION_ERROR"))
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return next(new AppError("A valid email is required", 400, "VALIDATION_ERROR"))
    }

    if (!password || typeof password !== "string" || password.length < 8) {
        return next(new AppError("Password must be at least 8 characters", 400, "VALIDATION_ERROR"))
    }

    next();
}

module.exports = { validateSignup }