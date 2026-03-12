import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Activity,
  Server,
  Database,
  Clock,
  Settings,
} from "lucide-react";
import TimelineAreaChart from "../components/TimelineAreaChart";
import Gauge from "../components/Gauge";
import Topbar from "../components/Topbar";
import { useNavigate } from "react-router-dom";

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
  const [timescaleStats, setTimescaleStats] = useState({ total_table_size: "0 MB", total_rows_logs: 0 });
  const [dockerHealth, setDockerHealth] = useState({ docker_daemon: "unknown", containers_running: 0 });
  const [uptime, setUptime] = useState("0m");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [cpuData, memData, topicsData, ratesData, timescaleData, dockerData, uptimeData] = await Promise.all([
        safeGet(`${API_BASE}/system/cpu/timeseries`, []),
        safeGet(`${API_BASE}/system/memory/timeseries`, []),
        safeGet(`${API_BASE}/kafka/topics`, {}),
        safeGet(`${API_BASE}/kafka/topic-rates`, {}),
        safeGet(`${API_BASE}/timescale/health`, { total_table_size: "0 MB", total_rows_logs: 0 }),
        safeGet(`${API_BASE}/docker/health`, { docker_daemon: "down", containers_running: 0 }),
        safeGet(`${API_BASE}/system/uptime`, { formatted: "0m" })
      ]);

      setCpuHistory(cpuData);
      setMemHistory(memData);
      setKafkaTopics(topicsData);
      setKafkaRates(ratesData);
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
      <div className="flex flex-col items-center justify-center min-h-screen text-cyan-400 bg-[#020617] animate-pulse">
        <Activity className="w-12 h-12 mb-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Establishing_Link</span>
      </div>
    );
  }

  const latestCpu = cpuHistory.at(-1)?.cpu ?? 0;
  const latestMem = memHistory.at(-1)?.memory ?? 0;

  const timelineData = cpuHistory.map((c, i) => ({
    time: new Date(c.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cpu: Number(c.cpu.toFixed(2)),
    memory: Number((memHistory[i]?.memory ?? 0).toFixed(2))
  }));

  const kafkaTableData = Object.entries(kafkaTopics).map(([topic, meta]) => ({
    topic,
    partitions: meta.partitions,
    rate: kafkaRates[topic]?.messages_per_sec ?? 0
  }));

  /* ---------------- UI COMPONENTS ---------------- */
  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-xl">
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1 truncate">{title}</p>
        <p className={`text-xl font-bold truncate ${color}`}>{value}</p>
      </div>
      <Icon className={`w-6 h-6 shrink-0 ml-3 ${color} opacity-80`} />
    </div>
  );

  const Section = ({ title, action, children }) => (
    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 md:p-6 space-y-4 backdrop-blur-sm shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xs md:text-sm font-black uppercase text-gray-300 tracking-[0.2em] italic">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Fixed Topbar */}
      <Topbar name="Dashboard" desc="Infrastructure_Operational_Link" />

      {/* LAYOUT CONTAINER:
          mt-24 accounts for the Topbar height.
          The Responsive padding handles mobile (px-4) vs Desktop (px-8).
      */}
      <main className="pt-24 pb-20 px-4 md:px-8 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
        
        {/* SYSTEM TIMELINE - Full width on all screens */}
        <Section
          title="System Realtime Metrics"
          action={
            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase">
              <Clock className="w-3 h-3 text-cyan-400" />
              Uptime: <span className="text-white">{uptime}</span>
            </div>
          }
        >
          {/* TimelineAreaChart will need to be internally responsive (use ResponsiveContainer) */}
          <div className="h-[200px] md:h-[300px] w-full">
            <TimelineAreaChart data={timelineData} />
          </div>
        </Section>

        {/* CPU / MEMORY GAUGES - Stacked on mobile, 2 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
          <Gauge label="CPU Utilization" value={latestCpu} />
          <Gauge label="Memory Utilization" value={latestMem} />
        </div>

        {/* DATABASES & DOCKER - 1 col on mobile, 2 cols on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section
            title="Database Layer"
            action={
              <button onClick={() => navigate("/timescale-logs")} className="hover:text-cyan-400 text-gray-600 transition-colors">
                <Settings size={14} />
              </button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard icon={Database} title="TDB Total Rows" value={timescaleStats.total_rows_logs} color="text-emerald-400" />
              <StatCard icon={Database} title="TDB Total Size" value={timescaleStats.total_table_size} color="text-emerald-300" />
            </div>
          </Section>

          <Section
            title="Docker Runtime"
            action={
              <button onClick={() => navigate("/docker-settings")} className="hover:text-cyan-400 text-gray-600 transition-colors">
                <Settings size={14} />
              </button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                icon={Server}
                title="Daemon Status"
                value={dockerHealth.docker_daemon}
                color={dockerHealth.docker_daemon === "running" ? "text-green-400" : "text-red-400"}
              />
              <StatCard icon={Activity} title="Running Nodes" value={dockerHealth.containers_running} color="text-cyan-400" />
            </div>
          </Section>
        </div>

        {/* KAFKA TOPICS - Responsive Table */}
        <Section title="Kafka Message Mesh">
          <div className="overflow-x-auto cyber-scroll">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">
                  <th className="py-3 px-2">Stream_Topic</th>
                  <th className="py-3 px-2 text-right">Partitions</th>
                  <th className="py-3 px-2 text-right">Ingest_Rate (ms/s)</th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-mono divide-y divide-white/5">
                {kafkaTableData.map(row => (
                  <tr key={row.topic} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-2 text-cyan-400 font-bold truncate max-w-[120px] md:max-w-none">{row.topic}</td>
                    <td className="py-3 px-2 text-right text-gray-400">{row.partitions}</td>
                    <td className="py-3 px-2 text-right text-white">
                      {row.rate.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </main>
    </div>
  );
};

export default Dashboard;