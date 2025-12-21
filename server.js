require("dotenv").config();
const express = require("express");
const path = require("path");
const apiRoutes = require("./backend/routes/apiRoutes");

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", apiRoutes);

app.get(/(.*)/, (req, res) => {
    if (req.url.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));