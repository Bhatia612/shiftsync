const express = require("express");
const swapRequestsRoutes = express.Router();
const swapRequestsController = require("../controllers/swapRequests.controller");
const { requireAuth } = require("../middleware/auth.middleware");

swapRequestsRoutes.post("/", requireAuth, swapRequestsController.create);
swapRequestsRoutes.get("/", requireAuth, swapRequestsController.list);
swapRequestsRoutes.get("/:id", requireAuth, swapRequestsController.getOne);
swapRequestsRoutes.patch("/:id/respond", requireAuth, swapRequestsController.respond);
swapRequestsRoutes.patch("/:id/approve", requireAuth, swapRequestsController.approve);
swapRequestsRoutes.patch("/:id/deny", requireAuth, swapRequestsController.deny);
swapRequestsRoutes.patch("/:id/cancel", requireAuth, swapRequestsController.cancel);

module.exports = swapRequestsRoutes;