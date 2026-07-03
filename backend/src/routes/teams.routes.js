const express = require("express");
const teamsRoutes = express.Router();
const teamsController = require("../controllers/teams.controller");
const shiftsController = require("../controllers/shifts.controller");

teamsRoutes.post("/", teamsController.createTeam);
teamsRoutes.get("/:teamId", teamsController.getTeam);
teamsRoutes.get("/:teamId/members", teamsController.listMembers);
teamsRoutes.post("/:teamId/members", teamsController.addMember);
teamsRoutes.patch("/:teamId/members/:userId", teamsController.updateMemberRole);
teamsRoutes.delete("/:teamId/members/:userId", teamsController.removeMember);

teamsRoutes.post("/:teamId/shifts", shiftsController.createShift);
teamsRoutes.get("/:teamId/shifts", shiftsController.listShiftsForTeam);

module.exports = teamsRoutes;