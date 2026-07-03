const express = require("express")
const apiV1Router = express.Router()

const authRoutes = require("./auth.routes")
const teamsRoutes = require("./teams.routes")
const shiftsRoutes = require("./shifts.routes")
const swapRequestsRoutes = require("./swapRequests.routes")
const notificationsRoutes = require("./notifications.routes")


apiV1Router.use("/auth", authRoutes)
apiV1Router.use("/teams", teamsRoutes)
apiV1Router.use("/shifts", shiftsRoutes)
apiV1Router.use("/swapRequests", swapRequestsRoutes)
apiV1Router.use("/notifications", notificationsRoutes)

module.exports = apiV1Router