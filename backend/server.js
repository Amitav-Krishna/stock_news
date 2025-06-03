// backend/server.js
const express = require("express");
const cors = require("cors");
const stockRoutes = require("./routes/stock");
const newsRoutes = require("./routes/news");
require("dotenv").config();

const app = express();

// Enhanced CORS configuration
app.use(
    cors({
        origin: ["http://localhost:3200", "https://amitavkrishna.com"],
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
    }),
);

app.use(express.json());
app.use("/api/stock", stockRoutes);
app.use("/api/news", newsRoutes);

app.listen(3300, () => console.log("Backend server running on port 3300"));
