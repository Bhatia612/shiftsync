const asyncHandler = require("../utils/asyncHandler");
const notificationsService = require("../services/notifications.service");
const sseService = require("../services/sse.service");



const list = asyncHandler(async (req, res) => {
    const notification = await notificationsService.list({
        userId: req.user.id,
        unread: req.query.unread
    })
    res.status(200).json({ notification })
})



const markRead = asyncHandler(async (req, res) => {
    const notification = await notificationsService.markRead({
        id: req.params.id,
        userId: req.user.id
    })

    res.status(200).json({ notification })
})


const markAllRead = asyncHandler(async (req, res) => {
    const updated = await notificationsService.markAllRead(req.user.id)

    res.status(200).json({ updated })
})



const stream = (req, res) => {
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache_Control", "no-cache")
    res.setHeader("Connection", "keep-alive")

    res.flushHeader()

    res.write(": connected\n\n")

    const heartbeat = setInterval(() => {
        res.write(": heartbeat\n\n")
    }, 30000)

    req.on("close", () => {
        clearInterval(heartbeat)
        sseService.removeConnection(req.user.id, res)
    })

}




module.exports = {
    list,
    markRead,
    markAllRead,
    stream,
};