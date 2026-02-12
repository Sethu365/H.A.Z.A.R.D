// const express = require("express");
// const db = require("../utils/db");
// const moment = require("moment-timezone");

// const router = express.Router();

// // ✅ Get last 24h user behavior
// router.get("/", (req, res) => {
//   db.all(
//     `SELECT hour, activity, risk, created_at 
//      FROM user_behavior 
//      WHERE created_at >= datetime('now', '-1 day')
//      ORDER BY created_at ASC`, 
//     [],
//     (err, rows) => {
//       if (err) {
//         console.error("❌ Error fetching user behavior:", err.message);
//         return res.status(500).json({ error: "Failed to fetch behavior" });
//       }

//       // ✅ Filter out Windows "System Idle Process"
//       const filteredRows = rows.filter(
//         (r) => !(r.process_name && r.process_name.toLowerCase().includes("idle"))
//       );

//       // Format timestamps to IST and round values
//       const formatted = filteredRows.map((r) => ({
//         hour: r.hour,
//         activity: Number(r.activity?.toFixed(2)) || 0,
//         risk: Number(r.risk?.toFixed(2)) || 0,
//         created_at: moment(r.created_at).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
//       }));

//       // Summary stats for dashboard cards
//       const peakHour =
//         formatted.length > 0
//           ? formatted.reduce((max, r) => (r.activity > max.activity ? r : max), formatted[0]).hour
//           : null;

//       const anomalousUsers = formatted.filter((r) => r.risk >= 70).length; // stricter threshold
//       const avgRisk =
//         formatted.length > 0
//           ? formatted.reduce((sum, r) => sum + r.risk, 0) / formatted.length
//           : 0;
//       const behavioralScore = Math.max(0, Math.round(100 - avgRisk)); // inverse risk
//       const underReview = formatted.filter((r) => r.risk >= 40 && r.risk < 70).length;

//       res.json({
//         rows: formatted,
//         peakHour,
//         anomalousUsers,
//         behavioralScore,
//         underReview,
//       });
//     }
//   );
// });

// module.exports = router;

// backend/routes/userBehavior.js
const express = require("express");
const db = require("../utils/db");
const moment = require("moment-timezone");

const router = express.Router();

router.get("/", (req, res) => {
  db.all(
    `SELECT id, hour, activity, risk, created_at 
     FROM user_behavior 
     WHERE created_at >= datetime('now', '-1 day')
     ORDER BY created_at ASC`,
    [],
    (err, rows) => {
      if (err) {
        console.error("❌ Error fetching user behavior:", err.message);
        return res.status(500).json({ error: "Failed to fetch behavior" });
      }

      if (!rows || rows.length === 0) {
        return res.json({
          rows: [],
          peakHour: null,
          anomalousUsers: 0,
          behavioralScore: 0,
          underReview: 0,
        });
      }

      // ✅ Always parse numbers safely
      const formatted = rows.map((r) => {
        const activity = parseFloat(r.activity) || 0;
        const risk = parseFloat(r.risk) || 0;
        return {
          id: r.id,
          hour: r.hour,
          activity: Number(activity.toFixed(2)),
          risk: Number(risk.toFixed(2)),
          created_at: moment(r.created_at)
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss"),
        };
      });

      const peakHour = formatted.reduce(
        (max, r) => (r.activity > max.activity ? r : max),
        formatted[0]
      ).hour;

      const anomalousUsers = formatted.filter((r) => r.risk >= 60).length;

      const avgRisk =
        formatted.reduce((sum, r) => sum + r.risk, 0) / formatted.length;
      const behavioralScore = Math.max(0, Math.round(100 - avgRisk));

      const underReview = formatted.filter(
        (r) => r.risk >= 40 && r.risk < 60
      ).length;

      res.json({
        rows: formatted,
        peakHour,
        anomalousUsers,
        behavioralScore,
        underReview,
      });
    }
  );
});

module.exports = router;
