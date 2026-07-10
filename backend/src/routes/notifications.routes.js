const express = require("express");
const notificationsRoutes = express.Router();
const notificationsController = require("../controllers/notifications.controller");
const { requireAuth } = require("../middleware/auth.middleware")

notificationsRoutes.get("/", requireAuth, notificationsController.list);
notificationsRoutes.get("/stream", requireAuth, notificationsController.stream);
notificationsRoutes.patch("/read-all", requireAuth, notificationsController.markAllRead);
notificationsRoutes.patch("/:id/read", requireAuth, notificationsController.markRead);

module.exports = notificationsRoutes;