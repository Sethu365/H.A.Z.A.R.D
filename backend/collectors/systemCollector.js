const os = require("os");
const si = require("systeminformation");
const db = require("../utils/db");

let lastNetRx = 0;
let lastNetTx = 0;

async function collectMetrics() {
  try {
    const cpu = await si.currentLoad(); // CPU stats
    const mem = await si.mem(); // Memory stats
    const net = await si.networkStats(); // Network stats (array)

    // ✅ CPU usage (%)
    let cpuUsage = 0;
    if (cpu?.cpus?.length > 0) {
      const total = cpu.cpus.reduce((sum, core) => sum + core.load, 0);
      cpuUsage = (total / cpu.cpus.length).toFixed(2);
    } else if (cpu?.currentload) {
      cpuUsage = cpu.currentload.toFixed(2);
    } else {
      const load = os.loadavg()[0]; // fallback
      cpuUsage = ((load * 100) / os.cpus().length).toFixed(2);
    }

    // ✅ Memory usage (%)
    const memUsage =
      mem?.active && mem?.total
        ? ((mem.active / mem.total) * 100).toFixed(2)
        : 0;

    // ✅ Network traffic (delta MB since last check)
    let netTraffic = 0;
    if (net?.[0]) {
      if (lastNetRx === 0 && lastNetTx === 0) {
        lastNetRx = net[0].rx_bytes;
        lastNetTx = net[0].tx_bytes;
      }
      const deltaRx = net[0].rx_bytes - lastNetRx;
      const deltaTx = net[0].tx_bytes - lastNetTx;
      netTraffic = ((deltaRx + deltaTx) / (1024 * 1024)).toFixed(2);

      lastNetRx = net[0].rx_bytes;
      lastNetTx = net[0].tx_bytes;
    }

    // ✅ Risk score (placeholder until ML)
    const riskScore = (Math.random() * 100).toFixed(2);

    // ✅ Insert into DB
    db.run(
      `INSERT INTO metrics (cpu_usage, memory_usage, network_traffic, risk_score)
       VALUES (?, ?, ?, ?)`,
      [cpuUsage, memUsage, netTraffic, riskScore],
      (err) => {
        if (err) console.error("❌ Failed to insert metrics:", err.message);
        else
          console.log(
            `✅ Metrics → CPU:${cpuUsage}% MEM:${memUsage}% NET:${netTraffic} MB Risk:${riskScore}`
          );
      }
    );
  } catch (err) {
    console.error("❌ Error collecting metrics:", err.message);
  }
}

function startSystemCollector() {
  console.log("📡 System metrics collector started...");
  setInterval(collectMetrics, 10000); // every 10s
}

module.exports = startSystemCollector;


