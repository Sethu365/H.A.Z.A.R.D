import React, { useEffect, useState, useRef, useMemo, memo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Server, Activity, Terminal, XCircle, ChevronRight, BarChart2, 
  RefreshCw, ChevronLeft, Power, FileText, Cpu, Database
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Gauge from "../components/Gauge";
import TimelineChart from "../components/TimelineChart";
import MiniAreaChart from "../components/MiniAreaChart";

const API_BASE = "http://172.24.16.81:8001";
const POLL_INTERVAL = 3000;

const MemoizedTimeline = memo(TimelineChart);
const MemoizedMiniChart = memo(MiniAreaChart);

const DockerSettings = () => {
  const navigate = useNavigate();
  const [aggregate, setAggregate] = useState({ cpu_percent: 0, memory_percent: 0 });
  const [containers, setContainers] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [containerTimeline, setContainerTimeline] = useState({});
  const [containerMemTimeline, setContainerMemTimeline] = useState({});
  const [logs, setLogs] = useState("");
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadData = async () => {
    setIsSyncing(true);
    try {
      const [aggRes, contRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/docker/stats/aggregate`),
        axios.get(`${API_BASE}/docker/containers`),
        axios.get(`${API_BASE}/docker/stats`)
      ]);

      setAggregate(aggRes.data);
      setContainers(contRes.data);

      setContainerTimeline((prev) => {
        const updated = { ...prev };
        statsRes.data.forEach((s) => {
          if (!updated[s.name]) updated[s.name] = [];
          updated[s.name] = [...updated[s.name], s.cpu_percent || 0].slice(-20);
        });
        return updated;
      });

      setContainerMemTimeline((prev) => {
        const updated = { ...prev };
        statsRes.data.forEach((s) => {
          const memPercent = s.memory_limit_mb ? (s.memory_usage_mb / s.memory_limit_mb) * 100 : 0;
          if (!updated[s.name]) updated[s.name] = [];
          updated[s.name] = [...updated[s.name], memPercent].slice(-20);
        });
        return updated;
      });

      setTimeline((prev) => {
        const next = [...prev, {
          time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: aggRes.data.cpu_percent,
          memory: aggRes.data.memory_percent,
        }];
        return next.slice(-30);
      });
    } catch (err) {
      console.error("❌ Docker fetch failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const toggleContainer = async (c) => {
    try {
      if (c.status === "running") { await axios.post(`${API_BASE}/docker/stop/${c.name}`); }
      else { await axios.post(`${API_BASE}/docker/start/${c.name}`); }
      loadData();
    } catch (err) { console.error("Action failed", err); }
  };

  const viewLogs = async (name) => {
    try {
      const res = await axios.get(`${API_BASE}/docker/logs/${name}`);
      setSelectedContainer(name);
      setLogs(res.data.logs || "");
    } catch { setLogs("Failed to load logs"); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-inter selection:bg-cyan-500/30 overflow-x-hidden">
      
      <main className="pt-4 pb-24 px-0 md:px-12 w-full space-y-4 md:space-y-8 transition-all duration-500">
        
        {/* REFINED HEADER SECTION - Hidden back button on mobile */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 px-6 md:px-0 relative">
          <div className="flex items-center gap-4 flex-1">
            {/* Desktop-only Back Button */}
            <button 
              onClick={() => navigate(-1)} 
              className="hidden md:flex p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-cyan-500/10 transition-all active:scale-90 backdrop-blur-md"
            >
              <ChevronLeft size={20} className="text-cyan-400" />
            </button>
            
            <div className="w-full text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase font-inter leading-none">Docker Hub</h1>
              <p className="hidden md:block font-roboto-condensed text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em] mt-1">Virtual_Environment_Management</p>
            </div>
          </div>
        </div>

        {/* PERFORMANCE HUD */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 px-4 md:px-0 items-start">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="xl:col-span-7 w-full bg-white/[0.02] border border-white/10 rounded-[1.5rem] md:rounded-[2.2rem] p-4 md:p-6 backdrop-blur-xl shadow-2xl flex flex-col relative overflow-hidden"
          >
             <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <h3 className="font-roboto-condensed text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/80">Cluster_Dynamics</h3>
              </div>
              <div className="hidden sm:flex gap-4 font-jetbrains text-[8px] font-black uppercase text-gray-500">
                 <span className="flex items-center gap-2 text-cyan-400"><Cpu size={10} /> CPU</span>
                 <span className="flex items-center gap-2 text-purple-400"><Database size={10} /> MEM</span>
              </div>
            </div>
            <div className="h-[200px] md:h-[260px] w-full max-w-2xl mx-auto bg-black/40 rounded-xl p-1 md:p-2 border border-white/5 overflow-hidden">
              <MemoizedTimeline data={timeline} />
            </div>
          </motion.div>

          <div className="xl:col-span-5 grid grid-cols-2 gap-4 self-stretch">
            <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] md:rounded-[2.2rem] p-3 md:p-4 flex flex-col items-center justify-center backdrop-blur-xl shadow-lg">
               <Gauge label="CPU" value={aggregate.cpu_percent} />
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] md:rounded-[2.2rem] p-3 md:p-4 flex flex-col items-center justify-center backdrop-blur-xl shadow-lg">
               <Gauge label="MEM" value={aggregate.memory_percent} />
            </div>
          </div>
        </div>

        {/* CONTAINER REGISTRY */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-4 md:mx-0 space-y-4">
          <div className="flex items-center gap-3 px-4 mb-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="font-roboto-condensed text-[11px] font-black uppercase tracking-[0.3em] text-cyan-400/80">Node_Inventory</h3>
          </div>

          <div className="space-y-4">
            {containers.map((c) => (
              <div key={c.id} className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-5 md:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 hover:bg-white/[0.05] transition-all relative overflow-hidden group backdrop-blur-sm">
                <div className="absolute inset-y-0 left-0 w-[2px] bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                    <Server className={`w-5 h-5 ${c.status === "running" ? "text-cyan-400" : "text-gray-600"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-jetbrains text-sm md:text-lg font-black text-white uppercase tracking-tight truncate">{c.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`font-roboto-condensed text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border ${c.status === "running" ? "text-green-400 border-green-500/30 bg-green-500/5" : "text-red-400 border-red-500/30 bg-red-500/5"}`}>
                        {c.status}
                      </span>
                      <span className="font-jetbrains text-[8px] text-gray-600 uppercase tabular-nums">ID: {c.id.substring(0, 8)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-10 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                  {c.status === "running" && (
                    <div className="flex items-center gap-8 w-full sm:w-auto justify-center">
                      <div className="flex flex-col items-center">
                        <p className="font-roboto-condensed text-[7px] font-black text-gray-600 uppercase mb-2 tracking-widest">CPU</p>
                        <MemoizedMiniChart data={containerTimeline[c.name] || []} color="#22d3ee" />
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="font-roboto-condensed text-[7px] font-black text-gray-600 uppercase mb-2 tracking-widest">MEM</p>
                        <MemoizedMiniChart data={containerMemTimeline[c.name] || []} color="#a855f7" />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => toggleContainer(c)} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${c.status === "running" ? "bg-red-500/10 border border-red-500/20 text-red-500 active:bg-red-500/30" : "bg-green-500/10 border border-green-500/20 text-green-400 active:bg-green-500/30"}`}>
                      <Power size={12} /> {c.status === "running" ? "Kill" : "Wake"}
                    </button>
                    <button onClick={() => viewLogs(c.name)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all active:scale-95 shadow-lg">
                      <FileText size={12} /> Logs
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* LOG OVERLAY */}
      <AnimatePresence>
        {selectedContainer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-[1000] flex items-end md:items-center justify-center">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="bg-[#03050a] border-t md:border border-white/10 md:rounded-[2.5rem] w-full max-w-6xl h-[85vh] md:h-[80vh] flex flex-col overflow-hidden shadow-[0_-20px_60px_rgba(0,0,0,0.8)]">
              <div className="bg-white/[0.03] px-6 py-5 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-jetbrains text-sm font-black text-white uppercase">{selectedContainer}</h4>
                </div>
                <button onClick={() => { setSelectedContainer(null); setLogs(""); }} className="p-2 bg-white/5 rounded-full text-gray-500 active:text-red-500"><XCircle size={24} /></button>
              </div>
              <div className="flex-1 overflow-auto p-6 md:p-10 cyber-scroll bg-black">
                <pre className="font-jetbrains text-[10px] md:text-[13px] text-cyan-400/70 whitespace-pre-wrap leading-relaxed">{logs || "// BUFFER_EMPTY"}</pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DockerSettings;