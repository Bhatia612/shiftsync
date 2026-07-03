const bcrypt = require("bcrypt")
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

module.exports = { signup }