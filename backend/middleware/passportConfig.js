// backend/config/passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,         
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
    callbackURL: "http://localhost:3000/auth/google/callback",
}, (accessToken, refreshToken, profile, done) => {
    // In a full implementation, you would sync this Google Profile 
    // to your Supabase 'profiles' table here using the supabase client.
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

module.exports = passport;