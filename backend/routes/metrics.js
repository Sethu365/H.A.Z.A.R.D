// backend/routes/metrics.js
const express = require("express");
const db = require("../utils/db");
const axios = require("axios");
const moment = require("moment-timezone");

const router = express.Router();

// ✅ Get latest metrics + total alerts + ML prediction
router.get("/", async (req, res) => {
  try {
    const metricsRow = await new Promise((resolve, reject) => {
      db.get(
        `SELECT cpu_usage AS cpuUsage, 
                memory_usage AS memoryUsage, 
                network_traffic AS networkTraffic, 
                risk_score AS riskScore, 
                created_at AS createdAt
         FROM metrics
         ORDER BY created_at DESC
         LIMIT 1`,
        [],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    const alertRow = await new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) AS totalAlerts FROM alerts`, [], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });

    let mlPrediction = null;
    if (metricsRow) {
      try {
        const features = [
          Number(metricsRow.cpuUsage) || 0,
          Number(metricsRow.memoryUsage) || 0,
          Number(metricsRow.networkTraffic) || 0,
          Number(metricsRow.riskScore) || 0,
        ];
        while (features.length < 78) features.push(0);

        const { data } = await axios.post("http://localhost:5001/predict", {
          features,
        });
        mlPrediction = data;
      } catch (err) {
        console.error("❌ ML prediction failed:", err.message);
      }
    }

    const response = {
      totalAlerts: alertRow?.totalAlerts || 0,
      cpuUsage: metricsRow?.cpuUsage ?? 0,
      memoryUsage: metricsRow?.memoryUsage ?? 0,
      networkTraffic: metricsRow?.networkTraffic ?? 0,
      riskScore: mlPrediction?.risk_score || metricsRow?.riskScore || 0,
      ml: mlPrediction,
      createdAt: metricsRow?.createdAt
        ? moment(metricsRow.createdAt).tz("Asia/Kolkata").format()
        : null,
    };

    res.json(response);
  } catch (err) {
    console.error("❌ Error fetching latest metrics:", err.message);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// ✅ Get last 50 metrics for charts (ML risk + IST time)
router.get("/history", async (req, res) => {
  try {
    const rows = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, cpu_usage, memory_usage, network_traffic, risk_score, 
                strftime('%Y-%m-%dT%H:%M:%S', created_at) as created_at
         FROM metrics
         ORDER BY created_at DESC
         LIMIT 50`,
        [],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    // For each row → call ML
    const processed = await Promise.all(
      rows.reverse().map(async (row) => {
        try {
          const features = [
            Number(row.cpu_usage) || 0,
            Number(row.memory_usage) || 0,
            Number(row.network_traffic) || 0,
            Number(row.risk_score) || 0,
          ];
          while (features.length < 78) features.push(0);

          const { data } = await axios.post("http://localhost:5001/predict", {
            features,
          });

          return {
            ...row,
            created_at: moment.tz(row.created_at, "UTC").tz("Asia/Kolkata").format(),
            risk_score: data.risk_score, // ✅ replace raw with ML score
            ml: data, // keep full ML output if frontend needs
          };
        } catch (err) {
          console.error("❌ ML prediction failed for row:", err.message);
          return {
            ...row,
            created_at: moment.tz(row.created_at, "UTC").tz("Asia/Kolkata").format(),
          };
        }
      })
    );

    res.json(processed);
  } catch (err) {
    console.error("❌ Error fetching metrics history:", err.message);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

module.exports = router;
