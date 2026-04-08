import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Activity, Terminal, XCircle, ChevronRight, BarChart2 } from "lucide-react";

import Gauge from "../components/Gauge";
import TimelineChart from "../components/TimelineChart";
import MiniAreaChart from "../components/MiniAreaChart";
import Topbar from "../components/Topbar";

const API_BASE = "http://172.24.16.81:8001";
const POLL_INTERVAL = 3000;

const DockerSettings = () => {
  const [aggregate, setAggregate] = useState({ cpu_percent: 0, memory_percent: 0 });
  const [containers, setContainers] = useState([]);
  const [containerStats, setContainerStats] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [containerTimeline, setContainerTimeline] = useState({});
  const [containerMemTimeline, setContainerMemTimeline] = useState({});
  const [logs, setLogs] = useState("");
  const [selectedContainer, setSelectedContainer] = useState(null);
  const mounted = useRef(false);

  const loadData = async () => {
    try {
      const [aggRes, contRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/docker/stats/aggregate`),
        axios.get(`${API_BASE}/docker/containers`),
        axios.get(`${API_BASE}/docker/stats`)
      ]);

      setAggregate(aggRes.data);
      setContainers(contRes.data);
      setContainerStats(statsRes.data);

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
          time: new Date().toLocaleTimeString(),
          cpu: aggRes.data.cpu_percent,
          memory: aggRes.data.memory_percent,
        }];
        return next.slice(-30);
      });
    } catch (err) {
      console.error("❌ Docker fetch failed", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { mounted.current = true; }, []);

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
    <div className="min-h-screen bg-[#020617] text-white font-inter">
      <Topbar name="Docker Hub" desc="Virtual_Environment_Management" />

      <main className="pt-24 pb-20 px-4 md:px-8 space-y-8 max-w-7xl mx-auto overflow-x-hidden">
        
        {/* HUD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* PERFORMANCE HISTORY */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 backdrop-blur-md shadow-2xl"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-roboto-condensed text-sm font-black uppercase tracking-[0.2em] text-gray-100">Cluster_Dynamics</h3>
              </div>
              <div className="font-roboto-condensed flex gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                 <span className="flex items-center gap-2"><div className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_#06b6d4]"/> CPU</span>
                 <span className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_#a855f7]"/> MEM</span>
              </div>
            </div>
            
            <div className="h-[250px] md:h-[350px] w-full">
              <TimelineChart data={timeline} />
            </div>
          </motion.div>

          {/* GAUGES */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <Gauge label="Aggregate_CPU" value={aggregate.cpu_percent} />
            <Gauge label="Memory_Reservation" value={aggregate.memory_percent} />
          </div>
        </div>

        {/* CONTAINERS REGISTRY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-md shadow-2xl overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-8 px-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h3 className="font-roboto-condensed text-sm font-black uppercase tracking-[0.2em] text-gray-100">Node_Inventory</h3>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto cyber-scroll pr-2">
            {containers.map((c) => (
              <div
                key={c.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 rounded-2xl border border-white/5 bg-[#0a0c14]/60 hover:bg-[#0a0c14]/90 hover:border-cyan-500/20 transition-all group gap-6"
              >
                <div className="flex items-center gap-4 min-w-0 w-full md:w-auto">
                  <ChevronRight className="w-4 h-4 text-cyan-500 opacity-50 group-hover:translate-x-1 transition-transform" />
                  <div className="min-w-0">
                    <p className="font-inter text-base font-black text-white truncate uppercase tracking-tight">{c.name}</p>
                    <p className={`font-roboto-condensed text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 mt-1 ${c.status === "running" ? "text-green-400" : "text-red-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.status === "running" ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500 shadow-[0_0_8px_#ef4444]"}`}/>
                      {c.status}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                  {c.status === "running" && (
                    <div className="flex items-center gap-4">
                      <div className="text-center font-roboto-condensed">
                        <p className="text-[7px] font-black text-gray-500 uppercase mb-1">CPU_Live</p>
                        <MiniAreaChart data={containerTimeline[c.name] || []} color="#22d3ee" />
                      </div>
                      <div className="text-center font-roboto-condensed">
                        <p className="text-[7px] font-black text-gray-500 uppercase mb-1">MEM_Live</p>
                        <MiniAreaChart data={containerMemTimeline[c.name] || []} color="#a855f7" />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 font-roboto-condensed">
                    <button
                      onClick={() => toggleContainer(c)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${c.status === "running" ? "border-red-500/20 text-red-500 hover:bg-red-500/10" : "border-green-500/20 text-green-400 hover:bg-green-500/10"}`}
                    >
                      {c.status === "running" ? "Kill" : "Wake"}
                    </button>
                    <button
                      onClick={() => viewLogs(c.name)}
                      className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      Logs
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* LOG VIEWER */}
      <AnimatePresence>
        {selectedContainer && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 md:p-8 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#05070a] border border-white/10 rounded-[2.5rem] w-full max-w-6xl h-[85vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  <h4 className="font-roboto-condensed text-xs font-black uppercase tracking-[0.3em] text-white">Stream_Dump :: {selectedContainer}</h4>
                </div>
                <button onClick={() => { setSelectedContainer(null); setLogs(""); }} className="text-gray-500 hover:text-white transition-colors">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 bg-black/40 cyber-scroll">
                <pre className="font-jetbrains text-[11px] text-cyan-400/80 whitespace-pre-wrap leading-relaxed">
                  {logs || "// NO_LOG_DATA_IN_CURRENT_BUFFER"}
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