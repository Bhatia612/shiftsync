const express = require("express");
const authRoutes = express.Router();
const authController = require("../controllers/auth.controller");
const { validateSignup, validateLogin } = require("../middleware/auth.validation");
const { requireAuth } = require("../middleware/auth.middleware");

authRoutes.post("/signup", validateSignup, authController.signup);
authRoutes.post("/login", validateLogin, authController.login);
authRoutes.post("/logout", authController.logout);
authRoutes.get("/me", requireAuth, authController.me);

module.exports = authRoutes;