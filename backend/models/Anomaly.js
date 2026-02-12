const express = require("express");
const db = require("../utils/db");

const router = express.Router();

// Get all anomalies (latest 50)
router.get("/", (req, res) => {
  db.all("SELECT * FROM anomalies ORDER BY created_at DESC LIMIT 50", [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching anomalies:", err.message);
      return res.status(500).json({ error: "Failed to fetch anomalies" });
    }
    res.json(rows);
  });
});

// Add new anomaly
router.post("/", (req, res) => {
  const { type, severity, description } = req.body;

  if (!type || !severity || !description) {
    return res.status(400).json({ error: "All fields are required" });
  }

  db.run(
    "INSERT INTO anomalies (type, severity, description) VALUES (?, ?, ?)",
    [type, severity, description],
    function (err) {
      if (err) {
        console.error("❌ Error inserting anomaly:", err.message);
        return res.status(500).json({ error: "Failed to add anomaly" });
      }
      res.json({
        id: this.lastID,
        type,
        severity,
        description,
        created_at: new Date().toISOString(),
      });
    }
  );
});

module.exports = router;
