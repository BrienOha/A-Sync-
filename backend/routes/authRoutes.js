const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Manual Login
router.post("/manual-login", authController.manualLogin);

router.get("/logout", authController.logout);

module.exports = router;