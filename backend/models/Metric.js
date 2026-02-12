// backend/routes/metrics.js
const express = require("express");
const db = require("../utils/db");

const router = express.Router();

router.get("/", (req, res) => {
  // read latest metrics and user/alert counts and return as JSON
  db.get("SELECT COUNT(*) as totalUsers FROM users", [], (err, userRow) => {
    if (err) return res.status(500).json({ error: "users query failed" });

    db.get("SELECT COUNT(*) as totalAlerts FROM alerts", [], (err2, alertRow) => {
      if (err2) return res.status(500).json({ error: "alerts query failed" });

      db.get("SELECT * FROM metrics ORDER BY collected_at DESC LIMIT 1", [], (err3, metricRow) => {
        if (err3) return res.status(500).json({ error: "metrics query failed" });

        const metrics = {
          totalUsers: userRow?.totalUsers || 0,
          totalAlerts: alertRow?.totalAlerts || 0,
          cpuUsage: metricRow?.cpu_usage ? metricRow.cpu_usage.toFixed(2) : "0.00",
          memoryUsage: metricRow?.memory_usage ? metricRow.memory_usage.toFixed(2) : "0.00",
          networkTraffic: metricRow?.network_traffic
            ? (metricRow.network_traffic / (1024 * 1024)).toFixed(2)
            : "0.00",
          riskScore: metricRow?.risk_score ? metricRow.risk_score.toFixed(2) : "0.00",
        };

        console.log("📊 Sending metrics to frontend:", metrics);
        res.json(metrics);
      });
    });
  });
});

module.exports = router;
