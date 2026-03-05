import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Activity,
  Server,
  Database,
  Clock
} from "lucide-react";
import TimelineChart from "../components/TimelineChart";
import Gauge from "../components/Gauge";
import { useNavigate } from "react-router-dom";
import TimelineAreaChart from "../components/TimelineAreaChart";

const API_BASE = "http://172.24.16.81:8001";
const POLL_INTERVAL_MS = 1000;

const safeGet = (url, fallback) =>
  axios.get(url).then(r => r.data).catch(() => fallback);

const Dashboard = () => {
  const navigate = useNavigate();

  const [cpuHistory, setCpuHistory] = useState([]);
  const [memHistory, setMemHistory] = useState([]);
  const [kafkaTopics, setKafkaTopics] = useState({});
  const [kafkaRates, setKafkaRates] = useState({});
  const [mongoStats, setMongoStats] = useState({ count: 0, size_mb: 0 });
  const [timescaleStats, setTimescaleStats] = useState({
    total_table_size: "0 MB",
    total_rows_logs: 0
  });
  const [dockerHealth, setDockerHealth] = useState({
    docker_daemon: "unknown",
    containers_running: 0
  });
  const [uptime, setUptime] = useState("0m");
  const [loading, setLoading] = useState(true);

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    const loadData = async () => {
      const [
        cpuData,
        memData,
        topicsData,
        ratesData,
        mongoData,
        timescaleData,
        dockerData,
        uptimeData
      ] = await Promise.all([
        safeGet(`${API_BASE}/system/cpu/timeseries`, []),
        safeGet(`${API_BASE}/system/memory/timeseries`, []),
        safeGet(`${API_BASE}/kafka/topics`, {}),
        safeGet(`${API_BASE}/kafka/topic-rates`, {}),
        safeGet(
          `${API_BASE}/mongo/collection-stats?db=security_events_test&coll=events`,
          { count: 0, size_mb: 0 }
        ),
        safeGet(`${API_BASE}/timescale/health`, {
          total_table_size: "0 MB",
          total_rows_logs: 0
        }),
        safeGet(`${API_BASE}/docker/health`, {
          docker_daemon: "down",
          containers_running: 0
        }),
        safeGet(`${API_BASE}/system/uptime`, {
          uptime_seconds: 0,
          formatted: "0m"
        })
      ]);

      setCpuHistory(cpuData);
      setMemHistory(memData);
      setKafkaTopics(topicsData);
      setKafkaRates(ratesData);
      setMongoStats(mongoData);
      setTimescaleStats(timescaleData);
      setDockerHealth(dockerData);
      setUptime(uptimeData.formatted ?? "0m");
      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading SOC dashboard…
      </div>
    );
  }

  /* ---------------- DERIVED DATA ---------------- */
  const latestCpu = cpuHistory.at(-1)?.cpu ?? 0;
  const latestMem = memHistory.at(-1)?.memory ?? 0;

  const timelineData = cpuHistory.map((c, i) => ({
    time: new Date(c.ts * 1000).toLocaleTimeString(),
    cpu: Number(c.cpu.toFixed(2)),
    memory: Number((memHistory[i]?.memory ?? 0).toFixed(2))
  }));

  const kafkaTableData = Object.entries(kafkaTopics).map(
    ([topic, meta]) => ({
      topic,
      partitions: meta.partitions,
      rate: kafkaRates[topic]?.messages_per_sec ?? 0
    })
  );

  // const formatUptime = seconds => {
  //   const d = Math.floor(seconds / 86400);
  //   const h = Math.floor((seconds % 86400) / 3600);
  //   const m = Math.floor((seconds % 3600) / 60);
  //   if (d) return `${d}d ${h}h`;
  //   if (h) return `${h}h ${m}m`;
  //   if (m) return `${m}m`;
  //   return `${seconds}s`;
  // };

  /* ---------------- UI COMPONENTS ---------------- */
  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">{title}</p>
          <p className={`text-xl font-semibold ${color}`}>{value}</p>
        </div>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  );

  const Section = ({ title, action, children }) => (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );

  /* ---------------- RENDER ---------------- */
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Infrastructure Overview
        </h1>
        <p className="text-sm text-gray-400">
          Live observability across compute, storage & messaging
        </p>
      </div>

      {/* SYSTEM TIMELINE */}
      <Section
        title="System Metrics"
        action={
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            Uptime:{" "}
            <span className="text-white font-medium">
              {uptime}
            </span>
          </div>
        }
      >
        <TimelineAreaChart data={timelineData} />
      </Section>

      {/* CPU / MEMORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Gauge label="CPU Utilization" value={latestCpu} />
        <Gauge label="Memory Utilization" value={latestMem} />
      </div>

      {/* DATABASES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section
          title="MongoDB"
          action={
            <i className="bi bi-gear"  onClick={() => navigate("/mongo-logs")}></i>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={Database}
              title="Documents"
              value={mongoStats.count}
              color="text-cyan-400"
            />
            <StatCard
              icon={Database}
              title="Collection Size"
              value={`${mongoStats.size_mb} MB`}
              color="text-indigo-400"
            />
          </div>
        </Section>

        <Section
          title="TimescaleDB"
          action={
            <i className="bi bi-gear"  onClick={() => navigate("/timescale-logs")}></i>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={Database}
              title="Total Rows"
              value={timescaleStats.total_rows_logs}
              color="text-emerald-400"
            />
            <StatCard
              icon={Database}
              title="Total Size"
              value={timescaleStats.total_table_size}
              color="text-emerald-300"
            />
          </div>
        </Section> 
      </div>

      {/* DOCKER */}
      <Section
        title="Docker Runtime"
        action={
          <i className="bi bi-gear"  onClick={() => navigate("/docker-settings")}></i>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Server}
            title="Daemon"
            value={dockerHealth.docker_daemon}
            color={
              dockerHealth.docker_daemon === "running"
                ? "text-green-400"
                : "text-red-400"
            }
          />
          <StatCard
            icon={Activity}
            title="Running Containers"
            value={dockerHealth.containers_running}
            color="text-cyan-400"
          />
        </div>
      </Section>

      {/* KAFKA */}
      <Section title="Kafka Topics">
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-2">Topic</th>
              <th className="text-right py-2">Partitions</th>
              <th className="text-right py-2">Ingest Rate (msg/s)</th>
            </tr>
          </thead>
          <tbody>
            {kafkaTableData.map(row => (
              <tr key={row.topic} className="border-b border-gray-800/50">
                <td className="py-2">{row.topic}</td>
                <td className="py-2 text-right">{row.partitions}</td>
                <td className="py-2 text-right">
                  {row.rate.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
};

export default Dashboard;
