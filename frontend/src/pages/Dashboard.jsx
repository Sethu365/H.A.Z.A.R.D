import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import RiskGauge from "../components/RiskGauge";
import TimelineChart from "../components/TimelineChart";
import AlertsTable from "../components/AlertsTable";
import { Shield, AlertTriangle, Activity } from "lucide-react";
import { getSystemStats, getAnomalies, getRecentAlerts, getPrediction } from "../api";
import axios from "axios";

const Dashboard = () => {
  const [stats, setStats] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    networkTraffic: 0,
    riskScore: 0,
    prediction: 0,
    xgbProba: 0,
    reconstructionError: 0,
    totalAlerts: 0,
  });

  const [metricsHistory, setMetricsHistory] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [metricsRes, anomaliesRes, alertsRes, historyRes, predictionRes] = await Promise.all([
          getSystemStats(),
          getAnomalies(),
          getRecentAlerts(),
          axios.get("http://localhost:4000/api/metrics/history").catch(() => ({ data: [] })), // safe fallback
          getPrediction(),
        ]);

        setStats({
          cpuUsage: Number(metricsRes.cpuUsage) || 0,
          memoryUsage: Number(metricsRes.memoryUsage) || 0,
          networkTraffic: Number(metricsRes.networkTraffic) || 0,
          riskScore: predictionRes?.risk_score || 0,
          prediction: predictionRes?.prediction || 0,
          xgbProba: predictionRes?.xgb_proba || 0,
          reconstructionError: predictionRes?.reconstruction_error || 0,
          totalAlerts: alertsRes?.length || 0,
        });

        setMetricsHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
        setAnomalies(Array.isArray(anomaliesRes) ? anomaliesRes : []);
        setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
      } catch (err) {
        console.error("❌ Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div
          className={`p-3 rounded-xl ${color.replace("text-", "bg-").replace("400", "500/20")}`}
        >
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );

  if (loading)
    return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="space-y-6">
      <motion.h1 className="text-3xl font-bold text-white">Dashboard Overview</motion.h1>
      <p className="text-gray-400">Real-time system monitoring with ML anomaly detection</p>

      {/* Stats */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard icon={Activity} title="CPU Usage" value={`${stats.cpuUsage.toFixed(2)}%`} color="text-yellow-400" />
        <StatCard icon={Shield} title="Memory Usage" value={`${stats.memoryUsage.toFixed(2)}%`} color="text-green-400" />
        <StatCard icon={Shield} title="Network Traffic" value={`${stats.networkTraffic.toFixed(2)} MB`} color="text-purple-400" />
        <StatCard icon={AlertTriangle} title="Total Alerts" value={stats.totalAlerts} color="text-red-400" />
        <StatCard icon={Shield} title="Risk Score" value={stats.riskScore.toFixed(2)} color="text-pink-400" />
      </motion.div>

      {/* ML Results */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">ML Prediction</h3>
        <p className="text-gray-300">
          Status:{" "}
          {stats.prediction === 0 ? (
            <span className="text-green-400 font-semibold">✅ Normal</span>
          ) : (
            <span className="text-red-400 font-semibold">⚠️ Anomaly</span>
          )}
        </p>
        <p className="text-gray-300">XGB Probability: {(stats.xgbProba * 100).toFixed(2)}%</p>
        <p className="text-gray-300">Reconstruction Error: {stats.reconstructionError.toFixed(2)}</p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RiskGauge score={stats.riskScore} />
        </div>
        <div className="lg:col-span-2">
          <TimelineChart data={metricsHistory} />
        </div>
      </div>

      <AlertsTable alerts={alerts} />
    </div>
  );
};

export default Dashboard;
