const prisma = require("../config/prisma")
const AppError = require("../utils/AppError")
const sseService = require("./sse.service")

const notify = async ({ userId, type, payload }) => {
    const notification = await prisma.notification.create({
        data: { userId, type, payload }
    })

    sseService.sendToUser(userId, notification)

    return notification
}


const list = async ({ userId, unread }) => {
    return prisma.notification.findMany({
        where: {
            userId,
            ...(unread === "true" && { read: false })
        },
        orderBy: { createdAt: "desc" }
    })
}


const markRead = async ({ id, userId }) => {
    const notification = await prisma.notification.findUnique({ where: { id } })

    if (!notification) {
        throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND")
    }

    if (notification.userId !== userId) {
        throw new AppError("Not your notification", 403, "FORBIDDEN");
    }

    return prisma.notification.update({
        where: { id },
        data: { read: true }
    })
}

const markAllRead = async ({ userId }) => {
    const result = await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
    })

    return result.count;
}


module.exports = { notify, list, markRead, markAllRead }