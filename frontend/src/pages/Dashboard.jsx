import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Server, Database, Clock, Settings, AlertCircle, RefreshCw, Terminal, Layers
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import TimelineAreaChart from "../components/TimelineAreaChart";
import Gauge from "../components/Gauge";
import SshTerminal from "../components/SshTerminal";

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
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsSyncing(true);
      try {
        const [cpuData, memData, topicsData, ratesData, timescaleData, dockerData] = await Promise.all([
          safeGet(`${API_BASE}/system/cpu/timeseries`, []),
          safeGet(`${API_BASE}/system/memory/timeseries`, []),
          safeGet(`${API_BASE}/kafka/topics`, {}),
          safeGet(`${API_BASE}/kafka/topic-rates`, {}),
          safeGet(`${API_BASE}/timescale/health`, { total_table_size: "0 MB", total_rows_logs: 0 }),
          safeGet(`${API_BASE}/docker/health`, { docker_daemon: "down", containers_running: 0 }),
        ]);

        if (!isMounted) return;
        setCpuHistory(cpuData);
        setMemHistory(memData);
        setKafkaTopics(topicsData);
        setKafkaRates(ratesData);
        setTimescaleStats(timescaleData);
        setDockerHealth(dockerData);
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
    return () => { isMounted = false; clearTimeout(timerRef.current); };
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
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 md:p-4 flex items-center justify-between backdrop-blur-xl transition-all group">
      <div className="min-w-0">
        <p className="font-roboto-condensed text-[7px] md:text-[9px] font-black uppercase text-gray-500 tracking-widest mb-0.5 truncate">{title}</p>
        <p className={`font-jetbrains text-xs md:text-base font-bold truncate ${color}`}>{value}</p>
      </div>
      <Icon className={`w-3 h-3 md:w-5 md:h-5 shrink-0 ml-2 ${color} opacity-20 group-hover:opacity-60`} />
    </div>
  );

  const Section = ({ title, action, children }) => (
    <motion.div 
      layout 
      className={`bg-white/[0.03] border border-white/10 rounded-[1.2rem] md:rounded-[2.2rem] p-3 md:p-6 space-y-3 md:space-y-5 backdrop-blur-2xl shadow-xl`}
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="font-roboto-condensed text-[8px] md:text-[11px] font-black uppercase text-cyan-400 tracking-[0.3em]">{title}</h3>
        {action}
      </div>
      <div className="w-full h-full">{children}</div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#020617] font-inter text-slate-200 selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* ── MOBILE SSH FAB ──
      <div className="md:hidden fixed bottom-32 right-4 z-[100]">
        <button onClick={() => setIsTerminalOpen(true)} className="p-4 bg-gradient-to-br from-cyan-400 to-cyan-600 text-black rounded-full shadow-lg active:scale-90 relative overflow-hidden">
          <Terminal size={20} className="relative z-10" />
        </button>
      </div> */}

      <main className="pt-2 md:pt-8 pb-24 px-2 md:px-12 w-full space-y-4 md:space-y-6 transition-all duration-500">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 px-2 md:px-0">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-white uppercase font-inter leading-none">Dashboard</h1>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setIsTerminalOpen(true)} className="hidden md:flex items-center gap-3 px-6 py-2 rounded-xl font-roboto-condensed font-black text-[10px] uppercase tracking-widest bg-white/[0.05] border border-white/20 hover:bg-white/[0.1] backdrop-blur-md">
              <Terminal size={14} className="text-cyan-400" />
              <span>Secure_Uplink</span>
            </button>
            {/* <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 py-2 px-4 rounded-xl backdrop-blur-md">
               <span className="font-roboto-condensed text-[8px] font-black text-gray-500 uppercase tracking-widest">{isSyncing ? "Syncing" : "Static"}</span>
               <RefreshCw size={14} className={`${isSyncing ? 'animate-spin text-cyan-400' : 'text-gray-700'}`} />
            </div> */}
          </div>
        </div>

        <AnimatePresence>
          {isError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-2 md:mx-0 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-3 font-jetbrains text-[9px] font-black uppercase">
              <AlertCircle size={14} /><span>Link_Interrupted</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOP ROW: REALTIME CHART - Fixed Mobile Overflow */}
        <Section title="Neural Telemetry Stream" action={<Clock size={12} className="text-cyan-400" />}>
          <div className="h-[220px] md:h-[350px] w-full bg-black/40 rounded-xl overflow-hidden p-0 md:p-4 border border-white/10 shadow-inner">
            <TimelineAreaChart data={timelineData} />
          </div>
        </Section>

        {/* MIDDLE ROW: GAUGES | DB | DOCKER (Laptop Density) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 px-0">
          {/* CPU Gauge */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 flex flex-col items-center justify-center backdrop-blur-xl shadow-lg">
            <Gauge label="CPU" value={latestCpu} />
          </div>
          
          {/* Memory Gauge */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 flex flex-col items-center justify-center backdrop-blur-xl shadow-lg">
            <Gauge label="MEM" value={latestMem} />
          </div>

          {/* Database Info - Scaled Up */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 space-y-3 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between px-1">
               <h3 className="font-roboto-condensed text-[11px] md:text-[11px] font-black uppercase text-cyan-400 tracking-[0.2em]">DB_LAYER</h3>
               <button onClick={() => navigate("/timescale-logs")}><Settings size={18} className="text-gray-600 hover:text-cyan-400"/></button>
            </div>
            <StatCard icon={Database} title="Total Rows" value={timescaleStats.total_rows_logs.toLocaleString()} color="text-emerald-400" />
            <StatCard icon={Layers} title="Table Size" value={timescaleStats.total_table_size} color="text-emerald-300" />
          </div>

          {/* Docker Info - Scaled Up */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 space-y-3 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between px-1">
               <h3 className="font-roboto-condensed text-[11px] md:text-[11px] font-black uppercase text-cyan-400 tracking-[0.2em]">RUNTIME</h3>
               <button onClick={() => navigate("/docker-settings")}><Settings size={18} className="text-gray-600 hover:text-cyan-400"/></button>
            </div>
            <StatCard icon={Server} title="Daemon" value={dockerHealth.docker_daemon} color={dockerHealth.docker_daemon === "running" ? "text-cyan-400" : "text-red-400"} />
            <StatCard icon={Activity} title="Containers" value={dockerHealth.containers_running} color="text-white" />
          </div>
        </div>

        {/* BOTTOM ROW: KAFKA SLIM GRID - 5 Column Laptop Density */}
        <Section title="Kafka Message Mesh" >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {kafkaTableData.map(row => (
              <div key={row.topic} className="bg-white/[0.04] border border-white/10 rounded-xl p-4 flex flex-col justify-between backdrop-blur-md hover:bg-white/[0.08] transition-all group overflow-hidden">
                <div className="flex items-start justify-between mb-2">
                   <h4 className="font-jetbrains text-[10px] md:text-[11px] font-black text-cyan-400 uppercase truncate w-full group-hover:text-white transition-colors">{row.topic}</h4>
                </div>
                <div className="flex items-end justify-between border-t border-white/5 pt-2">
                   <span className="font-roboto-condensed text-[8px] text-gray-600 uppercase">Partitions: {row.partitions}</span>
                   <span className="font-jetbrains text-[11px] md:text-[12px] font-black text-white">{row.rate.toFixed(1)} <span className="text-[7px] text-gray-500">ms/s</span></span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </main>

      <SshTerminal isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} apiBase={API_BASE} />
    </div>
  );
};

export default Dashboard;