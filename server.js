require("dotenv").config();
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const path = require("path");

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "secret-key", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Google Strategy (Keep your existing env variables)
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,        
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
    callbackURL: "http://localhost:3000/auth/google/callback",
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// --- ROUTES ---

app.get("/", (req, res) => res.redirect("/login.html"));

// UPDATED: Manual Login for Test Accounts
app.post("/manual-login", (req, res) => {
    const { email, password } = req.body;

    // 1. ADMIN TEST ACCOUNT
    if (email === "admin@school.edu" && password === "admin123") {
        const redirectURL = `/dashboard.html?name=System Admin&email=admin@school.edu&role=Admin&picture=https://ui-avatars.com/api/?name=Admin&background=4F46E5&color=fff`;
        return res.redirect(redirectURL);
    } 
    // 2. DEPARTMENT HEAD TEST ACCOUNT
    else if (email === "head@school.edu" && password === "head123") {
        const redirectURL = `/dashboard.html?name=Dept. Head&email=head@school.edu&role=Head&picture=https://ui-avatars.com/api/?name=Head&background=DB2777&color=fff`;
        return res.redirect(redirectURL);
    }
    // 3. REGULAR TEACHER
    else {
        // Just for demo, treat any other login as a regular teacher
        const redirectURL = `/dashboard.html?name=Teacher User&email=${email}&role=Teacher&picture=https://ui-avatars.com/api/?name=Teacher&background=random`;
        return res.redirect(redirectURL);
    }
});

// Google Login
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        const user = req.user;
        // Logic to detect admin from google email could go here
        let role = "Teacher";
        if(user.emails[0].value.includes("admin")) role = "Admin";

        const redirectURL = `/dashboard.html?name=${encodeURIComponent(user.displayName)}&email=${encodeURIComponent(user.emails[0].value)}&picture=${encodeURIComponent(user.photos[0].value)}&role=${role}`;
        res.redirect(redirectURL);
    }
);

app.get("/logout", (req, res) => {
    req.logout(() => res.redirect("/login.html"));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));