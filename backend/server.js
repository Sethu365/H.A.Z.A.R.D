// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// ================= Import Routes =================
const anomaliesRoutes = require("./routes/anomalies");
const alertsRoutes = require("./routes/alerts");
const metricsRoutes = require("./routes/metrics");
const mlRoutes = require("./routes/ml");
const userBehaviorRoutes = require("./routes/userBehavior");

// ================= Init DB & Collectors =================
require("./utils/db");
const startSystemCollector = require("./collectors/systemCollector");
const startUserBehaviorCollector = require("./collectors/userBehaviorCollector");

const app = express();
app.use(cors());
app.use(express.json());

// ================= API Routes =================
app.use("/api/anomalies", anomaliesRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/user-behavior", userBehaviorRoutes);

// ================= Serve frontend =================
const frontendPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));

// Simple API test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "✅ API test works" });
});

// ✅ Catch-all (React Router fallback) — must be last
app.get( (req, res) => {
  res.sendFile(path.resolve(frontendPath, "index.html"));
});

// ================= Start Server =================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  startSystemCollector();
  startUserBehaviorCollector();
});
