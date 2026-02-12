// backend/checkMetrics.js
const os = require("os");
const db = require("./utils/db");
const axios = require("axios");

async function collectAndStoreMetrics() {
  try {
    const cpuLoad = (os.loadavg()[0] / os.cpus().length) * 100;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = ((totalMem - freeMem) / totalMem) * 100;
    const netTraffic = 0; // placeholder, you can hook real network traffic later

    // Insert into DB with temporary risk_score=0
    db.run(
      `INSERT INTO metrics (cpu_usage, memory_usage, network_traffic, risk_score) VALUES (?, ?, ?, ?)`,
      [cpuLoad, memUsage, netTraffic, 0],
      async function (err) {
        if (err) {
          console.error("❌ Failed to insert metrics:", err.message);
        } else {
          console.log(`📊 Metrics inserted row id=${this.lastID}`);

          try {
            // Call ML service to compute risk score
            const { data } = await axios.post("http://localhost:4000/api/ml/predict");
            const riskScore = data?.risk_score || 0;

            // Update DB with risk score
            db.run(`UPDATE metrics SET risk_score = ? WHERE id = ?`, [riskScore, this.lastID], (err2) => {
              if (err2) console.error("❌ Failed to update risk_score:", err2.message);
              else console.log(`✅ Updated risk_score = ${riskScore} for row id=${this.lastID}`);
            });
          } catch (mlErr) {
            console.error("❌ ML service failed:", mlErr.message);
          }
        }
      }
    );
  } catch (err) {
    console.error("❌ Error collecting metrics:", err.message);
  }
}

// Run every 10s
setInterval(collectAndStoreMetrics, 10000);

// Run once immediately
collectAndStoreMetrics();
