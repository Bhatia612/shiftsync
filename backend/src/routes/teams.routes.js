const express = require("express");
const teamsRoutes = express.Router();
const teamsController = require("../controllers/teams.controller");
const shiftsController = require("../controllers/shifts.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireTeamMember, requireTeamManager } = require("../middleware/team.middleware");



teamsRoutes.post("/", requireAuth, teamsController.createTeam);
teamsRoutes.get("/:teamId", requireAuth, requireTeamMember, teamsController.getTeam);
teamsRoutes.get("/:teamId/members", requireAuth, requireTeamMember, teamsController.listMembers);
teamsRoutes.post("/:teamId/members", requireAuth, requireTeamManager, teamsController.addMember);
teamsRoutes.patch("/:teamId/members/:userId", requireAuth, requireTeamManager, teamsController.updateMemberRole);
teamsRoutes.delete("/:teamId/members/:userId", requireAuth, requireTeamManager, teamsController.removeMember);

teamsRoutes.post("/:teamId/shifts", requireAuth, requireTeamManager, shiftsController.createShift);
teamsRoutes.get("/:teamId/shifts", requireAuth, requireTeamMember, shiftsController.listShiftsForTeam);

module.exports = teamsRoutes;