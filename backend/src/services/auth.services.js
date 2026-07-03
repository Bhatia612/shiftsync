const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const prisma = require("../config/prisma")
const AppError = require("../utils/AppError")

const SALT_ROUNDS = 10


const signup = async ({ name, email, password }) => {
    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
        throw new AppError("An account with this email already exists", 409, "EMAIL_TAKEN")
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const user = await prisma.user.create({
        data: { name, email, passwordHash }
    })

    return {
        id: user.id,
        name: user.name,
        email: user.email
    }
}

const login = async ({ email, password }) => {
    const user = await prisma.user.findUnique({ where: { email } })
    const passwordMatches = await bcrypt.compare(password, user.passwordHash)

    if (!user || !passwordMatches) {
        throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN, }
    )

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    }


}

module.exports = { signup, login }