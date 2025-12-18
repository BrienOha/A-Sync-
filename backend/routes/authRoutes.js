// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/authController");

// Manual Login
router.post("/manual-login", authController.manualLogin);

// Google Auth (Legacy Passport method)
// Note: Supabase has native Google Auth which is easier, 
// but this keeps your current backend flow working.
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        // Simple redirect for now. 
        // To fully integrate, you'd want to exchange this for a Supabase Session.
        res.redirect('/dashboard.html?name=' + encodeURIComponent(req.user.displayName));
    }
);

router.get("/logout", authController.logout);

module.exports = router;