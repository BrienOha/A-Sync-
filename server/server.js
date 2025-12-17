require("dotenv").config({ path: "../.env" });
const express = require("express");
const session = require("express-session");
const path = require("path");
const passport = require("./middleware/passportConfig"); // Import configured passport
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "secret-key", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get("/", (req, res) => res.redirect("/login.html"));
app.use("/auth", authRoutes); // All auth routes will start with /auth

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));