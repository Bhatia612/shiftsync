const express = require("express");
const swapRequestsRoutes = express.Router();
const swapRequestsController = require("../controllers/swapRequests.controller");

swapRequestsRoutes.post("/", swapRequestsController.create);
swapRequestsRoutes.get("/", swapRequestsController.list);
swapRequestsRoutes.get("/:id", swapRequestsController.getOne);
swapRequestsRoutes.patch("/:id/respond", swapRequestsController.respond);
swapRequestsRoutes.patch("/:id/approve", swapRequestsController.approve);
swapRequestsRoutes.patch("/:id/deny", swapRequestsController.deny);
swapRequestsRoutes.patch("/:id/cancel", swapRequestsController.cancel);

module.exports = swapRequestsRoutes;