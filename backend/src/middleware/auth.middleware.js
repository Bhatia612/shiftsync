const jwt = require("jsonwebtoken")
const prisma = require("../config/prisma")
const AppError = require("../utils/AppError")

const requireAuth = async (req, res, next) => {
    const token = req.cookies.token

    if (!token) {
        return next(new AppError("Authentication required", 401, "UNAUTHENTICATED"))

    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await prisma.user.findUnique(
            {
                where: { id: decoded.userId },
                select: { id: true, name: true, email: true }
            }
        )

        if (!user) {
            return next(new AppError("Authentication required", 401, "UNAUTHENTICATED"));
        }

        req.user = user
        next()
    } catch (err) {
        return next(new AppError("Invalid or expired session", 401, "UNAUTHENTICATED"));
    }
}

module.exports = { requireAuth };