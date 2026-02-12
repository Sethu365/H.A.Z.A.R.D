const db = require("./utils/db");

db.serialize(() => {
  // Alerts table
  db.run(`CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    severity TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Anomalies table
  db.run(`CREATE TABLE IF NOT EXISTS anomalies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Metrics table
  db.run(`CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cpu_usage REAL,
    memory_usage REAL,
    network_traffic REAL,
    risk_score REAL,
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log("✅ Tables created/verified successfully");

  // Insert sample alerts (only if table empty)
  db.get("SELECT COUNT(*) as count FROM alerts", (err, row) => {
    if (row && row.count === 0) {
      db.run("INSERT INTO alerts (message, severity) VALUES (?, ?)", [
        "Unauthorized login attempt detected",
        "High",
      ]);
      db.run("INSERT INTO alerts (message, severity) VALUES (?, ?)", [
        "Malware signature found",
        "Critical",
      ]);
      console.log("✅ Sample alerts inserted");
    }
  });

  // Insert sample anomalies (only if table empty)
  db.get("SELECT COUNT(*) as count FROM anomalies", (err, row) => {
    if (row && row.count === 0) {
      db.run(
        "INSERT INTO anomalies (type, severity, description) VALUES (?, ?, ?)",
        ["Behavioral", "Medium", "Unusual login time detected"]
      );
      db.run(
        "INSERT INTO anomalies (type, severity, description) VALUES (?, ?, ?)",
        ["System", "Low", "Unexpected CPU spike observed"]
      );
      console.log("✅ Sample anomalies inserted");
    }
  });

  // Insert a sample metric row (only if table empty)
  db.get("SELECT COUNT(*) as count FROM metrics", (err, row) => {
    if (row && row.count === 0) {
      db.run(
        "INSERT INTO metrics (cpu_usage, memory_usage, network_traffic, risk_score) VALUES (?, ?, ?, ?)",
        [25.5, 78.2, 0.01, 42.3]
      );
      console.log("✅ Sample metrics inserted");
    }
  });
});

console.log("🎉 Database initialization complete.");
