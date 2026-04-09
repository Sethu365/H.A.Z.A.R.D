import React, { useEffect, useState, useRef, useMemo, memo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Server, Activity, Terminal, XCircle, ChevronRight, BarChart2, 
  RefreshCw, ChevronLeft, Power, FileText 
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
    <div className="min-h-screen bg-[#020617] text-white font-inter selection:bg-cyan-500/30">
      
      <main className="pt-12 pb-20 px-6 md:px-12 w-full space-y-8 transition-all duration-500">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
            >
              <ChevronLeft size={20} className="text-cyan-400" />
            </button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-white">Docker Hub</h1>
              <p className="font-roboto-condensed text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em]">Virtual_Environment_Management</p>
            </div>
          </div>
          <div className="flex items-center gap-6 bg-black/40 border border-white/5 py-3 px-6 rounded-2xl">
            <div className="flex flex-col items-end">
              <span className="font-roboto-condensed text-[8px] font-bold text-gray-500 uppercase tracking-widest">Runtime_Status</span>
              <span className="font-jetbrains text-xs font-bold text-green-400 uppercase tracking-tighter">Daemon_Active</span>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <RefreshCw size={16} className={`${isSyncing ? 'animate-spin text-cyan-400' : 'text-gray-700'}`} />
          </div>
        </div>

{/* HUD GRID - Refined Alignment */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
          
          {/* PERFORMANCE HISTORY - Left side */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="xl:col-span-8 bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-sm flex flex-col"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
              <div className="flex items-center gap-3 px-2">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-roboto-condensed text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-400/80">Cluster_Dynamics</h3>
              </div>
              <div className="font-roboto-condensed flex gap-6 text-[9px] font-bold uppercase tracking-widest text-gray-500">
                 <span className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]"/> 
                   CPU_AGGREGATE
                 </span>
                 <span className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"/> 
                   MEM_RESERVATION
                 </span>
              </div>
            </div>
            
            {/* Using flex-1 here ensures the chart box fills the remaining vertical space of the card */}
            <div className="flex-1 min-h-[300px] md:min-h-[400px] w-full bg-black/20 rounded-3xl p-4">
              <MemoizedTimeline data={timeline} />
            </div>
          </motion.div>

          {/* GAUGES - Right side aligned to Chart height */}
          <div className="xl:col-span-4 flex flex-col gap-8">
            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 flex flex-col items-center justify-center shadow-2xl transition-all hover:border-white/10">
              <Gauge label="AGGREGATE_CPU" value={aggregate.cpu_percent} />
            </div>
            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 flex flex-col items-center justify-center shadow-2xl transition-all hover:border-white/10">
              <Gauge label="MEMORY_RESERVATION" value={aggregate.memory_percent} />
            </div>
          </div>
        </div>

        {/* INVENTORY REGISTRY */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-sm overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-10 px-4">
            <Server className="w-5 h-5 text-cyan-400" />
            <h3 className="font-roboto-condensed text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-400/80">Node_Inventory</h3>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto cyber-scroll pr-4">
            {containers.map((c) => (
              <div
                key={c.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-[2rem] border border-white/5 bg-black/40 hover:bg-white/[0.03] hover:border-white/10 transition-all group gap-8"
              >
                <div className="flex items-center gap-6 min-w-0 w-full md:w-auto">
                  <div className="hidden md:block">
                    <ChevronRight className="w-5 h-5 text-cyan-500 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-jetbrains text-lg font-bold text-white uppercase tracking-tight">{c.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${c.status === "running" ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500 shadow-[0_0_8px_#ef4444]"}`}/>
                      <span className={`font-roboto-condensed text-[10px] font-bold uppercase tracking-widest ${c.status === "running" ? "text-green-400/70" : "text-red-400/70"}`}>
                        {c.status}
                      </span>
                      <span className="text-gray-700 text-[10px]">|</span>
                      <span className="font-jetbrains text-[9px] text-gray-500 uppercase">HEX_ID: {c.id.substring(0, 12)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-10 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-6 md:pt-0">
                  {c.status === "running" && (
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="font-roboto-condensed text-[8px] font-bold text-gray-600 uppercase mb-2 tracking-widest">CPU_LIVE</p>
                        <MemoizedMiniChart data={containerTimeline[c.name] || []} color="#22d3ee" />
                      </div>
                      <div className="text-center">
                        <p className="font-roboto-condensed text-[8px] font-bold text-gray-600 uppercase mb-2 tracking-widest">MEM_LIVE</p>
                        <MemoizedMiniChart data={containerMemTimeline[c.name] || []} color="#a855f7" />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 font-roboto-condensed">
                    <button
                      onClick={() => toggleContainer(c)}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${c.status === "running" ? "border-red-500/20 text-red-500 hover:bg-red-500/10" : "border-green-500/20 text-green-400 hover:bg-green-500/10"}`}
                    >
                      <Power size={12} />
                      {c.status === "running" ? "Kill" : "Wake"}
                    </button>
                    <button
                      onClick={() => viewLogs(c.name)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
                    >
                      <FileText size={12} />
                      Logs
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* OVERLAY LOG VIEWER */}
      <AnimatePresence>
        {selectedContainer && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-6 md:p-12 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-[#05070a] border border-white/10 rounded-[3rem] w-full max-w-7xl h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-10 py-8 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Terminal className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-jetbrains text-lg font-bold text-white uppercase tracking-tight">{selectedContainer}</h4>
                    <p className="font-roboto-condensed text-[9px] font-bold text-gray-500 uppercase tracking-widest">Live_Container_Stream_Buffer</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedContainer(null); setLogs(""); }} 
                  className="p-2 hover:bg-red-500/10 rounded-full transition-colors group"
                >
                  <XCircle size={24} className="text-gray-600 group-hover:text-red-500 transition-colors" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-10 bg-[radial-gradient(circle_at_center,_#ffffff03_1px,_transparent_1px)] bg-[size:32px_32px] cyber-scroll">
                <pre className="font-jetbrains text-[12px] text-cyan-400/70 whitespace-pre-wrap leading-relaxed selection:bg-cyan-500/40">
                  {logs || "// BUFFER_EMPTY :: NO_LOG_DATA_DETECTED"}
                </pre>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DockerSettings;