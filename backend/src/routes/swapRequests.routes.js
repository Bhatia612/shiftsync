const express = require("express");
const swapRequestsRoutes = express.Router();
const swapRequestsController = require("../controllers/swapRequests.controller");
const { requireAuth } = require("../middleware/auth.middleware");

router.post("/", requireAuth, swapRequestsController.create);
router.get("/", requireAuth, swapRequestsController.list);
router.get("/:id", requireAuth, swapRequestsController.getOne);
router.patch("/:id/respond", requireAuth, swapRequestsController.respond);
router.patch("/:id/approve", requireAuth, swapRequestsController.approve);
router.patch("/:id/deny", requireAuth, swapRequestsController.deny);
router.patch("/:id/cancel", requireAuth, swapRequestsController.cancel);

module.exports = swapRequestsRoutes;