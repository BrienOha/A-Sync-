const express = require("express");
const passport = require("passport");
const router = express.Router();
const authController = require("../controllers/authController");

// Manual Login
router.post("/manual-login", authController.manualLogin);

// Google Auth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    authController.googleCallback
);

// Logout
router.get("/logout", authController.logout);

module.exports = router;