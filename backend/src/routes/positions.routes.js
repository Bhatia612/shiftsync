const express = require("express")
const positionsRoutes = express.Router()
const positionsController = require("../controllers/positions.controller")
const { requireAuth } = require("../middleware/auth.middleware")
const { requireTeamMember, requireTeamManager } = require("../middleware/team.middleware")

positionsRoutes.post("/:teamId/positions", requireAuth, requireTeamManager, positionsController.createPosition)
positionsRoutes.get("/:teamId/positions", requireAuth, requireTeamMember, positionsController.listPositions)
positionsRoutes.delete("/:teamId/positions/:positionId", requireAuth, requireTeamManager, positionsController.deletePosition)

module.exports = positionsRoutes