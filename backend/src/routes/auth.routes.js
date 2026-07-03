const express = require("express");
const authRoutes = express.Router();
const authController = require("../controllers/auth.controller");
const { validateSignup, validateLogin } = require("../middleware/auth.validation")

authRoutes.post("/signup", validateSignup, authController.signup);
authRoutes.post("/login", validateLogin, authController.login);
authRoutes.post("/logout", authController.logout);
authRoutes.get("/me", authController.me);

module.exports = authRoutes;