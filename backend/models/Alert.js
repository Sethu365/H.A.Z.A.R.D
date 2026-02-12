const express = require("express");
const db = require("../utils/db");

const router = express.Router();

// Get all alerts (latest 50)
router.get("/", (req, res) => {
  db.all("SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50", [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching alerts:", err.message);
      return res.status(500).json({ error: "Failed to fetch alerts" });
    }
    res.json(rows);
  });
});

// Add new alert
router.post("/", (req, res) => {
  const { message, severity } = req.body;

  if (!message || !severity) {
    return res.status(400).json({ error: "Message and severity are required" });
  }

  db.run(
    "INSERT INTO alerts (message, severity) VALUES (?, ?)",
    [message, severity],
    function (err) {
      if (err) {
        console.error("❌ Error inserting alert:", err.message);
        return res.status(500).json({ error: "Failed to add alert" });
      }
      res.json({
        id: this.lastID,
        message,
        severity,
        created_at: new Date().toISOString(),
      });
    }
  );
});

module.exports = router;
