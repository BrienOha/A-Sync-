const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Middleware to ensure request comes from an Admin (Basic implementation)
// In production, verify the Session Token here.
const isAdmin = (req, res, next) => {
    // For this prototype, we trust the session or token passed
    // You should verify req.headers.authorization with Supabase
    next(); 
};

router.post("/users", isAdmin, userController.createUser);
router.delete("/users/:id", isAdmin, userController.deleteUser);

module.exports = router;