const si = require("systeminformation");
const db = require("../utils/db");

async function collectUserBehavior() {
  try {
    // Get active processes
    const processes = await si.processes();

    // ✅ Ignore "System Idle Process" and sort by CPU usage
    const topProcess = processes.list
      .filter(p => p.name !== "System Idle Process") // ignore idle placeholder
      .sort((a, b) => b.cpu - a.cpu)[0];

    if (!topProcess) {
      console.warn("⚠️ No valid process found");
      return;
    }

    // Activity score = CPU usage of top process
    const activityScore = Math.min(topProcess.cpu, 100);

    // ✅ Smarter risk logic
    let risk = activityScore;
    const pname = topProcess.name.toLowerCase();

    if (activityScore > 80) risk += 10; // very high usage = riskier
    if (pname.includes("cmd") || pname.includes("powershell")) {
      risk += 30; // suspicious usage
    }
    if (risk > 100) risk = 100; // cap at 100

    // Insert real values into DB
    db.run(
      `INSERT INTO user_behavior (hour, activity, risk)
       VALUES (?, ?, ?)`,
      [
        new Date().getHours(), // local hour (0–23)
        activityScore,
        risk,
      ],
      (err) => {
        if (err) {
          console.error("❌ Failed to insert user behavior:", err.message);
        } else {
          console.log(
            `✅ UserBehavior → Hour:${new Date().getHours()} App:${topProcess.name} Activity:${activityScore.toFixed(
              2
            )}% Risk:${risk.toFixed(2)}`
          );
        }
      }
    );
  } catch (err) {
    console.error("❌ Error collecting user behavior:", err.message);
  }
}

function startUserBehaviorCollector() {
  console.log("📊 User Behavior collector started...");
  setInterval(collectUserBehavior, 60 * 1000); // every 1 min
}

module.exports = startUserBehaviorCollector;
