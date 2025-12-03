require("dotenv").config(); // Load .env variables

const express = require("express");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const path = require("path");

const app = express();

// -------------------- MIDDLEWARE --------------------

// Serve static frontend files (public folder)
app.use(express.static(path.join(__dirname, "public")));

// Parse form data from manual login
app.use(express.urlencoded({ extended: true }));

// Sessions
app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: true,
    })
);

app.use(passport.initialize());
app.use(passport.session());

// -------------------- GOOGLE OAUTH SETUP --------------------

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,        // ← from .env
            clientSecret: process.env.GOOGLE_CLIENT_SECRET, // ← from .env
            callbackURL: "http://localhost:3000/auth/google/callback",
        },
        (accessToken, refreshToken, profile, done) => {
            // Save the Google profile
            return done(null, profile);
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// -------------------- ROUTES --------------------

// Redirect root to login page
app.get("/", (req, res) => {
    res.redirect("/login.html");
});

// Manual login example
app.post("/manual-login", (req, res) => {
    const { email } = req.body;
    res.send(`Logged in manually as ${email}`);
});

// Google Login Route
app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Callback Route
app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login.html" }),
    (req, res) => {
        const user = req.user;

        const name = user.displayName;
        const email = user.emails[0].value;
        const picture = user.photos?.[0]?.value || "";

        // Redirect to dashboard with user info
        res.redirect(
            `/dashboard.html?name=${encodeURIComponent(name)}&email=${encodeURIComponent(
                email
            )}&picture=${encodeURIComponent(picture)}`
        );
    }
);

// Logout route
app.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/login.html");
    });
});

// -------------------- START SERVER --------------------

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
