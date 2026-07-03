const express = require("express");
const authRoutes = express.Router();
const authController = require("../controllers/auth.controller");

authRoutes.post("/signup", authController.signup);
authRoutes.post("/login", authController.login);
authRoutes.post("/logout", authController.logout);
authRoutes.get("/me", authController.me);

module.exports = authRoutes;