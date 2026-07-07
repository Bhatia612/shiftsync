const express = require("express");
const shiftsRoutes = express.Router();
const shiftsController = require("../controllers/shifts.controller");
const requireAuth = require("../middleware/auth.middleware");
const { loadShiftTeamContext } = require("../middleware/shift.middleware");

shiftsRoutes.get("/:shiftId", requireAuth, loadShiftTeamContext, shiftsController.getShift);
shiftsRoutes.patch("/:shiftId", requireAuth, loadShiftTeamContext("MANAGER"), shiftsController.updateShift);
shiftsRoutes.delete("/:shiftId", requireAuth, loadShiftTeamContext("MANAGER"), shiftsController.deleteShift);

module.exports = shiftsRoutes;