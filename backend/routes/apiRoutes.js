const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Middleware to ensure request comes from an Admin
const isAdmin = (req, res, next) => {
    next(); 
};

router.post("/users", isAdmin, userController.createUser);
router.delete("/users/:id", isAdmin, userController.deleteUser);

module.exports = router;