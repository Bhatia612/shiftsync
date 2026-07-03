const express = require("express");
const notificationsRoutes = express.Router();
const notificationsController = require("../controllers/notifications.controller");

notificationsRoutes.get("/", notificationsController.list);
notificationsRoutes.get("/stream", notificationsController.stream);
notificationsRoutes.patch("/read-all", notificationsController.markAllRead);
notificationsRoutes.patch("/:id/read", notificationsController.markRead);

module.exports = notificationsRoutes;