import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Server,
  Database,
  Clock,
  Settings,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Assume these are custom components in your project
import TimelineAreaChart from "../components/TimelineAreaChart";
import Gauge from "../components/Gauge";
import Topbar from "../components/Topbar";

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
  const [isError, setIsError] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [cpuData, memData, topicsData, ratesData, timescaleData, dockerData, uptimeData] = await Promise.all([
          safeGet(`${API_BASE}/system/cpu/timeseries`, []),
          safeGet(`${API_BASE}/system/memory/timeseries`, []),
          safeGet(`${API_BASE}/kafka/topics`, {}),
          safeGet(`${API_BASE}/kafka/topic-rates`, {}),
          safeGet(`${API_BASE}/timescale/health`, { total_table_size: "0 MB", total_rows_logs: 0 }),
          safeGet(`${API_BASE}/docker/health`, { docker_daemon: "down", containers_running: 0 }),
          safeGet(`${API_BASE}/system/uptime`, { formatted: "0m" })
        ]);

        if (!isMounted) return;

        setCpuHistory(cpuData);
        setMemHistory(memData);
        setKafkaTopics(topicsData);
        setKafkaRates(ratesData);
        setTimescaleStats(timescaleData);
        setDockerHealth(dockerData);
        setUptime(uptimeData.formatted ?? "0m");
        setLoading(false);
        setIsError(false);
      } catch (err) {
        console.error("Polling Error:", err);
        if (isMounted) setIsError(true);
      } finally {
        if (isMounted) {
          timerRef.current = setTimeout(loadData, POLL_INTERVAL_MS);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      clearTimeout(timerRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-cyan-400 bg-[#020617] animate-pulse">
        <Activity className="w-12 h-12 mb-4" />
        {/* Labels: Roboto Condensed */}
        <span className="font-roboto-condensed text-[10px] font-black uppercase tracking-[0.4em]">Establishing_Link</span>
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

  /* ---------------- UI SUB-COMPONENTS ---------------- */
  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-xl transition-all hover:bg-white/[0.08]">
      <div className="min-w-0">
        {/* Labels: Roboto Condensed */}
        <p className="font-roboto-condensed text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1 truncate">{title}</p>
        {/* Values: JetBrains Mono */}
        <p className={`font-jetbrains text-xl font-bold truncate ${color}`}>{value}</p>
      </div>
      <Icon className={`w-6 h-6 shrink-0 ml-3 ${color} opacity-80`} />
    </div>
  );

  const Section = ({ title, action, children }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 md:p-6 space-y-4 backdrop-blur-sm shadow-2xl"
    >
      <div className="flex items-center justify-between">
        {/* Headers: Roboto Condensed (Removed italic) */}
        <h3 className="font-roboto-condensed text-xs md:text-sm font-black uppercase text-gray-300 tracking-[0.2em]">{title}</h3>
        {action}
      </div>
      {children}
    </motion.div>
  );

  return (
    // Main Container: Inter
    <div className="min-h-screen bg-[#020617] font-inter text-slate-200">
      <Topbar name="Dashboard" desc="Infrastructure_Operational_Link" />

      <main className="pt-24 pb-20 px-4 md:px-8 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
        
        {/* CONNECTION ALERT - JetBrains Mono for System Logs */}
        <AnimatePresence>
          {isError && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-3 font-jetbrains text-xs"
            >
              <AlertCircle size={16} />
              <span>LINK_INTERRUPTED: Retrying connection to API_BASE...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SYSTEM TIMELINE */}
        <Section
          title="System Realtime Metrics"
          action={
            // Timestamp/Stats: JetBrains Mono for values
            <div className="flex items-center gap-2 font-jetbrains text-[10px] text-gray-500 uppercase">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span className="font-roboto-condensed">Uptime:</span> <span className="text-white">{uptime}</span>
            </div>
          }
        >
          <div className="h-[200px] md:h-[300px] w-full">
            <TimelineAreaChart data={timelineData} />
          </div>
        </Section>

        {/* CPU / MEMORY GAUGES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
          <Gauge label="CPU Utilization" value={latestCpu} />
          <Gauge label="Memory Utilization" value={latestMem} />
        </div>

        {/* DATABASES & DOCKER */}
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
              <StatCard icon={Database} title="TDB Total Rows" value={timescaleStats.total_rows_logs.toLocaleString()} color="text-emerald-400" />
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

        {/* KAFKA TOPICS TABLE */}
        <Section title="Kafka Message Mesh">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
            <table className="w-full text-left">
              <thead>
                {/* Table Headers: Roboto Condensed */}
                <tr className="border-b border-white/10 font-roboto-condensed text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">
                  <th className="py-3 px-2">Stream_Topic</th>
                  <th className="py-3 px-2 text-right">Partitions</th>
                  <th className="py-3 px-2 text-right">Ingest_Rate (ms/s)</th>
                </tr>
              </thead>
              {/* Table Body: JetBrains Mono */}
              <tbody className="font-jetbrains text-[11px] divide-y divide-white/5">
                {kafkaTableData.map(row => (
                  <tr key={row.topic} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-2 text-cyan-400 font-bold truncate max-w-[120px] md:max-w-none">{row.topic}</td>
                    <td className="py-3 px-2 text-right text-gray-400">{row.partitions}</td>
                    <td className="py-3 px-2 text-right text-white tracking-tighter">
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