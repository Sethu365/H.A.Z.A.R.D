// backend/routes/ml.js
const express = require("express");
const axios = require("axios");
const db = require("../utils/db");
const router = express.Router();

// Get latest metrics from SQLite
function getLatestMetrics() {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM metrics ORDER BY created_at DESC LIMIT 1", [], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Build feature vector for ML
async function buildFeatureVector() {
  const latestMetrics = await getLatestMetrics();
  if (!latestMetrics) throw new Error("No metrics found in DB");

  const features = [
    Number(latestMetrics.cpu_usage) || 0,
    Number(latestMetrics.memory_usage) || 0,
    Number(latestMetrics.network_traffic) || 0,
    Number(latestMetrics.risk_score) || 0,
  ];

  // Pad to 78 features
  while (features.length < 78) {
    features.push(0);
  }

  return features;
}

// ================== ML Prediction ==================
router.post("/predict", async (req, res) => {
  try {
    const features = await buildFeatureVector();
    const { data } = await axios.post("http://localhost:5001/predict", { features });
    res.json(data);
  } catch (err) {
    console.error("❌ Error building features for ML:", err.message);
    res.status(500).json({ error: "ML service failed", details: err.message });
  }
});

module.exports = router;
