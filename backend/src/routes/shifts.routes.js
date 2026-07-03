const express = require("express");
const shiftsRoutes = express.Router();
const shiftsController = require("../controllers/shifts.controller");

shiftsRoutes.get("/:shiftId", shiftsController.getShift);
shiftsRoutes.patch("/:shiftId", shiftsController.updateShift);
shiftsRoutes.delete("/:shiftId", shiftsController.deleteShift);

module.exports = shiftsRoutes;