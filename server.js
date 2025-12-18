// server.js (Root Directory)
require("dotenv").config();
const express = require("express");
const path = require("path");
const apiRoutes = require("./backend/routes/apiRoutes"); // Keep Admin API

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware (Parse JSON for Admin API)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Serve Frontend Static Files
app.use(express.static(path.join(__dirname, "public")));

// 3. Admin API Routes (Protected User Management)
app.use("/api", apiRoutes);

// 4. Default Route (Serve Login Page)
app.get(/(.*)/, (req, res) => {
    // If request starts with /api, don't serve html
    if (req.url.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    
    // Otherwise serve the frontend
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));