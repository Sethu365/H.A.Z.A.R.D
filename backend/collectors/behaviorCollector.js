const db = require("../utils/db");

// Simulated behavior collection (later you can integrate process logs, keystrokes, etc.)
function collectUserBehavior() {
  const hour = new Date().getHours();

  // Fake activity & risk for demo
  const activity = Math.floor(Math.random() * 100);
  const risk = Math.floor(Math.random() * 50);

  db.run(
    `INSERT INTO user_behavior (hour, activity_score, risk_level, processes)
     VALUES (?, ?, ?, ?)`,
    [hour, activity, risk, JSON.stringify({ apps: ["chrome", "vscode"] })],
    (err) => {
      if (err) console.error("❌ Failed to insert user behavior:", err.message);
      else console.log(`✅ Behavior → Hour:${hour} Activity:${activity} Risk:${risk}`);
    }
  );
}

function startUserBehaviorCollector() {
  console.log("📊 User Behavior collector started...");
  setInterval(collectUserBehavior, 60 * 1000); // every 1 min
}

module.exports = startUserBehaviorCollector;
