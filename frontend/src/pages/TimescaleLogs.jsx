import React, { useEffect, useState, memo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { 
  Database, Activity, Terminal, Copy, ChevronLeft, ListFilter, RefreshCw 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import TimescaleTerminal from "../components/TimescaleTerminal"; // <-- NEW

const API_BASE = "http://172.24.16.81:8001";

const TimescaleLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false); // <-- NEW

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchLogs = async () => {
    setIsSyncing(true);
    try {
      if (!hasLoaded) setLoading(true);
      const res = await axios.get(
        `${API_BASE}/timescale/logs?limit=${limit}&offset=${offset}`
      );
      setLogs(res.data.data || []);
      setHasLoaded(true);
    } catch (err) {
      console.error("Link Failure: Timescale Stream", err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [limit, offset]);

  const rateData = (logs) => {
    const buckets = {};
    logs.forEach((row) => {
      if (!row.event_time) return;
      const t = new Date(row.event_time);
      t.setSeconds(0, 0);
      const key = t.getTime();
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets)
      .map(([time, count]) => ({ time: Number(time), count }))
      .sort((a, b) => a.time - b.time);
  };

  const chartData = rateData(logs);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-inter selection:bg-cyan-500/30 overflow-x-hidden">
      
      <main className="pt-4 pb-24 px-2 md:px-12 w-full space-y-4 md:space-y-6 transition-all duration-500">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 px-4 md:px-0 relative">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => navigate(-1)} 
              className="hidden md:flex p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-cyan-500/10 active:scale-90 backdrop-blur-md z-10"
            >
              <ChevronLeft size={20} className="text-cyan-400" />
            </button>
            <div className="w-full text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase font-inter leading-none">Uplink Stream</h1>
              <p className="hidden md:block font-roboto-condensed text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em] mt-2">TimescaleDB_Forensic_Telemetry</p>
            </div>
          </div>

{/* LAPTOP VERSION: Static Sidebar Button */}
          {!isMobile && (
            <button
              onClick={() => setIsTerminalOpen(true)}
              className="flex items-center gap-3 px-6 py-3.5 rounded-2xl font-roboto-condensed text-[10px] font-black uppercase tracking-[0.25em] transition-all bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
            >
              <Database size={15} />
              DB_Console
            </button>
          )}
        </div>



{/* MONITORING VIEW */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-2 md:mx-0 bg-white/[0.02] border border-white/10 rounded-[1.5rem] md:rounded-[2.2rem] p-4 md:p-8 backdrop-blur-xl shadow-2xl relative">
          <div className="flex items-center justify-between gap-3 mb-6 px-2">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="font-roboto-condensed text-[10px] md:text-[11px] font-black uppercase text-cyan-400 tracking-[0.3em]">Velocity_Telemetry</h3>
            </div>
          </div>

          <div className="h-[220px] md:h-[350px] w-full bg-black/40 rounded-xl p-1 border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: isMobile ? -35 : 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} opacity={0.03} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#64748b", fontSize: 8, fontWeight: 900, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  axisLine={false} tickLine={false} minTickGap={40}
                />
                <YAxis hide={isMobile} tick={{ fill: "#64748b", fontSize: 8, fontWeight: 900, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(2, 6, 23, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "10px", fontFamily: 'JetBrains Mono', backdropFilter: "blur(12px)" }} />
                <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={isMobile ? 2 : 3} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* LOG CONTROLS */}
        <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4 mx-2 md:mx-0 p-4 bg-white/[0.03] rounded-[1.5rem] md:rounded-[2rem] border border-white/10 shadow-xl backdrop-blur-md">
          <div className="font-roboto-condensed flex items-center justify-between md:justify-start gap-6 text-[10px] font-black uppercase tracking-widest text-gray-500 px-2">
            <div className="flex items-center gap-2">
              <ListFilter size={14} className="text-cyan-500" />
              <span>Buffer:</span>
            </div>
            <select
              value={limit}
              onChange={(e) => { setOffset(0); setLimit(Number(e.target.value)); }}
              className="bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-cyan-400 outline-none font-jetbrains text-[11px]"
            >
              {[25, 50, 100].map((v) => <option key={v} value={v}>{v} Pkts</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 font-roboto-condensed w-full sm:w-auto">
            <button 
              disabled={offset === 0} 
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest disabled:opacity-20 hover:bg-white/10 text-white transition-all active:scale-95"
            >
              Prev
            </button>
            <button 
              onClick={() => setOffset(offset + limit)}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 text-white transition-all active:scale-95"
            >
              Next
            </button>
          </div>
        </div>

        {/* REGISTRY SECTION */}
        <div className="mx-2 md:mx-0">
          {!isMobile ? (
            <motion.div layout className="bg-white/[0.01] border border-white/5 rounded-[2.2rem] overflow-hidden backdrop-blur-sm shadow-2xl">
              <table className="w-full text-left border-separate border-spacing-y-0">
                <thead className="bg-white/[0.02] border-b border-white/5 font-roboto-condensed text-[10px] font-black uppercase text-gray-500 tracking-[0.3em]">
                  <tr>
                    <th className="px-8 py-6">Temporal_Stamp</th>
                    <th className="px-8 py-6 text-center">Node_Source</th>
                    <th className="px-8 py-6 text-right">Raw_Telemetry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-jetbrains text-[12px]">
                  {loading && !hasLoaded ? (
                    <tr><td colSpan={3} className="py-20 text-center animate-pulse">Establishing_Link...</td></tr>
                  ) : logs.map((row, idx) => (
                    <React.Fragment key={idx}>
                      <tr className={`hover:bg-white/[0.02] transition-colors group ${expandedRow === idx ? 'bg-white/[0.03]' : ''}`}>
                        <td className="px-8 py-5 text-gray-400 font-medium">{new Date(row.event_time).toLocaleString()}</td>
                        <td className="px-8 py-5 text-center">
                          <span className="px-4 py-1.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 font-bold uppercase tracking-tighter">
                            {row.hostname || "UNKNOWN_NODE"}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button onClick={() => setExpandedRow(expandedRow === idx ? null : idx)} className={`inline-flex items-center gap-3 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${expandedRow === idx ? 'bg-white text-black' : 'bg-white/5 text-gray-500 hover:text-white border border-white/5'}`}>
                            {expandedRow === idx ? "Collapse" : "Decode"} <Terminal size={14} />
                          </button>
                        </td>
                      </tr>
                      {expandedRow === idx && (
                        <tr>
                          <td colSpan={3} className="bg-black/60 p-0">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-10 py-8 border-y border-cyan-500/10">
                              <div className="flex items-center justify-between mb-6">
                                <p className="font-roboto-condensed text-[10px] font-black uppercase text-cyan-500 tracking-widest leading-none">Forensic_Data_Packet</p>
                                <button onClick={() => navigator.clipboard.writeText(JSON.stringify(row.original_payload, null, 2))} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/10 rounded-xl text-[10px] font-black text-cyan-400 uppercase tracking-widest active:scale-95"><Copy size={12} /> Copy_Hex</button>
                              </div>
                              <pre className="font-jetbrains text-[12px] text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-auto cyber-scroll p-6 bg-black/40 rounded-2xl border border-white/5">{JSON.stringify(row.original_payload, null, 3)}</pre>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </motion.div>
          ) : (
            <div className="space-y-3 pb-6">
              {loading && !hasLoaded ? (
                <div className="py-20 text-center uppercase font-roboto-condensed text-[10px] tracking-widest text-cyan-500 animate-pulse">Establishing_Link</div>
              ) : logs.map((row, idx) => (
                <div key={idx} className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] p-5 space-y-4 backdrop-blur-md relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-roboto-condensed text-[8px] font-black text-gray-600 uppercase tracking-widest leading-none">Timestamp</p>
                      <p className="font-jetbrains text-[11px] text-gray-400">{new Date(row.event_time).toLocaleTimeString()}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-roboto-condensed text-[8px] font-black text-gray-600 uppercase tracking-widest leading-none">Source</p>
                      <p className="font-jetbrains text-[11px] font-black text-cyan-400 uppercase">{row.hostname || "UNK"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                    className={`w-full flex items-center justify-center gap-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${expandedRow === idx ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-white/5 text-gray-400 border border-white/10'}`}
                  >
                    {expandedRow === idx ? "Hide_Buffer" : "Decode_Telemetry"}
                    <Terminal size={14} />
                  </button>
                  <AnimatePresence>
                    {expandedRow === idx && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-2">
                        <div className="bg-black/80 rounded-2xl border border-white/10 p-4 space-y-4 shadow-inner">
                          <div className="flex justify-between items-center pb-2 border-b border-white/5">
                            <span className="font-roboto-condensed text-[9px] font-black text-cyan-500 uppercase tracking-widest">HEX_DUMP</span>
                            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(row.original_payload, null, 2))} className="text-gray-600 active:text-white"><Copy size={12} /></button>
                          </div>
                          <pre className="font-jetbrains text-[10px] text-gray-400 leading-relaxed overflow-x-auto max-h-[300px] cyber-scroll">
                            {JSON.stringify(row.original_payload, null, 2)}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {/* MOBILE VERSION: Floating Bubble Button */}
            <AnimatePresence>
              {isMobile && !isTerminalOpen && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: 20 }}
                  className="fixed bottom-32 right-6 z-[1000]"
                >
                  <button
                    onClick={() => setIsTerminalOpen(true)}
                    className="relative w-16 h-16 rounded-full flex items-center justify-center bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-90 transition-all border-4 border-[#020617]"
                  >
                    <Database size={24} strokeWidth={2.5} />
                    {/* Pulsing Tactical Ring */}
                    <motion.div 
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 rounded-full border-2 border-emerald-500"
                    />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <TimescaleTerminal
              isOpen={isTerminalOpen}
              onClose={() => setIsTerminalOpen(false)}
              apiBase={API_BASE}
            />
    </div>
  );
};

export default TimescaleLogs;