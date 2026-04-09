import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Server,
  Database,
  Clock,
  Settings,
  AlertCircle,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import TimelineAreaChart from "../components/TimelineAreaChart";
import Gauge from "../components/Gauge";
import SshTerminal from "../components/SshTerminal"; // <-- NEW

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false); // <-- NEW

  const timerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsSyncing(true);
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
        if (isMounted) setIsError(true);
      } finally {
        if (isMounted) {
          setIsSyncing(false);
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

  const kafkaTableData = useMemo(() => {
    return Object.entries(kafkaTopics).map(([topic, meta]) => ({
      topic,
      partitions: meta.partitions,
      rate: kafkaRates[topic]?.messages_per_sec ?? 0
    }));
  }, [kafkaTopics, kafkaRates]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-cyan-400 bg-[#020617]">
        <Activity className="w-12 h-12 mb-4 animate-pulse" />
        <span className="font-roboto-condensed text-[10px] font-bold uppercase tracking-[0.4em]">Establishing_Link</span>
      </div>
    );
  }

  const latestCpu = cpuHistory.at(-1)?.cpu ?? 0;
  const latestMem = memHistory.at(-1)?.memory ?? 0;

  const timelineData = cpuHistory.map((c, i) => ({
    time: new Date(c.ts * 1000).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }),
    cpu: Number(c.cpu.toFixed(2)),
    memory: Number((memHistory[i]?.memory ?? 0).toFixed(2))
  }));

  /* ---------------- UI SUB-COMPONENTS ---------------- */
  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between shadow-2xl hover:bg-white/[0.08] transition-all group">
      <div className="min-w-0">
        <p className="font-roboto-condensed text-[9px] font-bold uppercase text-gray-500 tracking-widest mb-1 truncate">{title}</p>
        <p className={`font-jetbrains text-2xl font-bold truncate ${color}`}>{value}</p>
      </div>
      <Icon className={`w-8 h-8 shrink-0 ml-4 ${color} opacity-40 group-hover:opacity-100 transition-opacity`} />
    </div>
  );

  const Section = ({ title, action, children }) => (
    <motion.div
      layout
      className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-6 md:p-10 space-y-6 shadow-2xl backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-2">
        <h3 className="font-roboto-condensed text-[11px] font-bold uppercase text-cyan-400 tracking-[0.3em]">{title}</h3>
        {action}
      </div>
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#020617] font-inter text-slate-200 selection:bg-cyan-500/30">
      <main className="pt-12 pb-20 px-6 md:px-12 w-full space-y-8 transition-all duration-500">

        {/* INTEGRATED HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="font-roboto-condensed text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em]">Infrastructure_Operational_Link</p>
          </div>
          <div className="flex items-center gap-4">
            {/* ── Secure Uplink button ── */}
            <button
              onClick={() => setIsTerminalOpen(true)}
              className="flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-5 py-2.5 rounded-xl font-roboto-condensed font-bold text-[11px] uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all group"
            >
              <Terminal size={16} className="group-hover:animate-pulse" />
              Secure_Uplink
            </button>

            <div className="flex items-center gap-6 bg-black/40 border border-white/5 py-3 px-6 rounded-2xl">
              <div className="flex flex-col items-end">
                <span className="font-roboto-condensed text-[8px] font-bold text-gray-500 uppercase tracking-widest">System_Uptime</span>
                <span className="font-jetbrains text-xs font-bold text-white">{uptime}</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <RefreshCw size={16} className={`${isSyncing ? 'animate-spin text-cyan-400' : 'text-gray-700'}`} />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isError && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 font-jetbrains text-xs uppercase"
            >
              <AlertCircle size={16} />
              <span>Link_Interrupted: Re-Establishing Connection...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SYSTEM METRICS */}
        <Section
          title="System Realtime Metrics"
          action={
            <div className="flex items-center gap-2 font-roboto-condensed text-[10px] font-bold text-gray-500 uppercase">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Telemetry_Stream</span>
            </div>
          }
        >
          <div className="h-[300px] md:h-[400px] w-full bg-black/20 rounded-3xl p-4">
            <TimelineAreaChart data={timelineData} />
          </div>
        </Section>

        {/* GAUGES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Gauge label="CPU UTILIZATION" value={latestCpu} />
          <Gauge label="MEMORY UTILIZATION" value={latestMem} />
        </div>

        {/* DATABASE & DOCKER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Section
            title="Database Layer"
            action={
              <button onClick={() => navigate("/timescale-logs")} className="p-2 bg-white/5 rounded-xl hover:bg-cyan-400/20 transition-colors">
                <Settings size={14} className="text-gray-600" />
              </button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StatCard icon={Database} title="TDB Total Rows" value={timescaleStats.total_rows_logs.toLocaleString()} color="text-emerald-400" />
              <StatCard icon={Database} title="TDB Total Size" value={timescaleStats.total_table_size} color="text-emerald-300" />
            </div>
          </Section>

          <Section
            title="Docker Runtime"
            action={
              <button onClick={() => navigate("/docker-settings")} className="p-2 bg-white/5 rounded-xl hover:bg-cyan-400/20 transition-colors">
                <Settings size={14} className="text-gray-600" />
              </button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StatCard
                icon={Server}
                title="Daemon Status"
                value={dockerHealth.docker_daemon}
                color={dockerHealth.docker_daemon === "running" ? "text-cyan-400" : "text-red-400"}
              />
              <StatCard icon={Activity} title="Running Nodes" value={dockerHealth.containers_running} color="text-white" />
            </div>
          </Section>
        </div>

        {/* KAFKA STREAM */}
        <Section title="Kafka Message Mesh">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="font-roboto-condensed text-[10px] font-bold uppercase text-gray-500 tracking-[0.3em]">
                  <th className="pb-4 px-6">Stream_Topic</th>
                  <th className="pb-4 px-6 text-right">Partitions</th>
                  <th className="pb-4 px-6 text-right">Ingest_Rate (ms/s)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {kafkaTableData.map(row => (
                  <tr key={row.topic} className="group hover:bg-white/[0.03] transition-all">
                    <td className="py-6 px-6 bg-white/[0.02] rounded-l-3xl border-l border-t border-b border-white/5">
                      <span className="font-jetbrains text-sm font-bold text-cyan-400 uppercase tracking-tight">{row.topic}</span>
                    </td>
                    <td className="py-6 px-6 text-right font-jetbrains text-xs text-gray-400 bg-white/[0.02] border-t border-b border-white/5">
                      {row.partitions}
                    </td>
                    <td className="py-6 px-6 text-right bg-white/[0.02] rounded-r-3xl border-r border-t border-b border-white/5">
                      <span className="font-jetbrains text-sm font-bold text-white tracking-tighter">
                        {row.rate.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </main>

      {/* ── SSH Terminal Modal ── */}
      <SshTerminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        apiBase={API_BASE}
      />
    </div>
  );
};

export default Dashboard;