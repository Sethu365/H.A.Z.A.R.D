import React, { useEffect, useState, useRef, useMemo } from "react";
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
  Database, Activity, Terminal, ChevronLeft, ListFilter, Copy, RefreshCw 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://172.24.16.81:8001";
const DB_NAME = "client_logs";
const COLLECTION = "client_raw_events";

const MongoLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [rateData, setRateData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/mongo/collection-data`, {
        params: { db: DB_NAME, coll: COLLECTION, limit, offset }
      });
      setLogs(res.data.data || []);
    } catch (e) {
      console.error("Link Failure: MongoDB Stream", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRate = async () => {
    setIsSyncing(true);
    try {
      const res = await axios.get(`${API_BASE}/mongo/ingestion-rate`, {
        params: { db: DB_NAME, coll: COLLECTION, minutes: 8640 }
      });
      setRateData(res.data || []);
    } catch (e) {
      console.error("Ingestion rate fetch failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchRate();
  }, [limit, offset]);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-inter selection:bg-cyan-500/30 overflow-x-hidden">
      
      <main className="pt-6 pb-24 px-0 md:px-12 w-full space-y-6 md:space-y-8 transition-all duration-500">
        
        {/* INTEGRATED HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4 px-6 md:px-0">
          <div className="flex items-center gap-4 flex-1 justify-center md:justify-start">
            <button 
              onClick={() => navigate(-1)} 
              className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-cyan-500/10 transition-all"
            >
              <ChevronLeft size={20} className="text-cyan-400" />
            </button>
            <div className="space-y-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white uppercase font-inter">Raw Events</h1>
              <p className="hidden md:block font-roboto-condensed text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em]">MongoDB_Unstructured_Log_Mesh</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 bg-white/[0.03] border border-white/10 py-3 px-6 rounded-2xl backdrop-blur-md">
            <div className="flex flex-col items-end">
              <span className="font-roboto-condensed text-[8px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Status</span>
              <span className="font-jetbrains text-xs font-bold text-cyan-400 uppercase tracking-tighter uppercase leading-none">Uplink_Active</span>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <RefreshCw size={16} className={`${isSyncing ? 'animate-spin text-cyan-400' : 'text-gray-700'}`} />
          </div>
        </div>

        {/* INGESTION MONITOR */}
        <div className="mx-4 md:mx-0 bg-white/[0.02] border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
          <div className="flex items-center gap-3 mb-8 px-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="font-roboto-condensed text-[11px] font-bold uppercase text-cyan-400 tracking-[0.3em]">Traffic_Density</h3>
          </div>

          <div className="h-[200px] md:h-[350px] w-full bg-black/40 rounded-2xl p-2 md:p-6 border border-white/5">
            {rateData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <span className="font-roboto-condensed text-[9px] font-bold uppercase tracking-widest text-gray-600">Buffer_Empty</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rateData} margin={{ top: 10, right: 10, left: isMobile ? -30 : 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#64748b", fontSize: 8, fontWeight: 900, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    axisLine={false} tickLine={false} minTickGap={50}
                  />
                  <YAxis hide={isMobile} tick={{ fill: "#64748b", fontSize: 8, fontWeight: 900, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(2, 6, 23, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "10px", fontFamily: 'JetBrains Mono', backdropFilter: "blur(12px)" }}
                    labelFormatter={(l) => `Stamp: ${new Date(l).toLocaleString()}`}
                  />
                  <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={isMobile ? 2 : 3} dot={false} isAnimationActive={false} style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.4))" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* LOG CONTROLS */}
        <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4 mx-4 md:mx-0 p-4 md:p-6 bg-white/[0.03] rounded-[2rem] border border-white/10 shadow-xl backdrop-blur-md">
          <div className="font-roboto-condensed flex items-center justify-between md:justify-start gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 px-2">
            <div className="flex items-center gap-2">
              <ListFilter size={14} className="text-cyan-500" />
              <span>Buffer_Size:</span>
            </div>
            <select
              value={limit}
              onChange={(e) => { setOffset(0); setLimit(Number(e.target.value)); }}
              className="bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-cyan-400 outline-none focus:border-cyan-500/50 font-jetbrains text-[11px]"
            >
              {[25, 50, 100].map(v => <option key={v} value={v}>{v} Pkts</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 font-roboto-condensed w-full sm:w-auto">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest disabled:opacity-20 hover:bg-white/10 text-white transition-all active:scale-95"
            >
              Prev
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 text-white transition-all active:scale-95"
            >
              Next
            </button>
          </div>
        </div>

        {/* REGISTRY SECTION */}
        <div className="mx-4 md:mx-0 bg-white/[0.01] md:border border-white/5 md:rounded-[2.5rem] overflow-hidden backdrop-blur-sm shadow-2xl">
          {/* DESKTOP TABLE */}
          {!isMobile ? (
            <div className="overflow-x-auto cyber-scroll">
              <table className="w-full text-left border-separate border-spacing-y-0">
                <thead className="bg-white/[0.03] border-b border-white/10">
                  <tr className="font-roboto-condensed text-[10px] font-bold uppercase text-gray-500 tracking-[0.3em]">
                    <th className="px-8 py-6">Forensic_Stamp</th>
                    <th className="px-8 py-6 text-center">Node_Uplink</th>
                    <th className="px-8 py-6 text-right">Data_Packet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-jetbrains text-[12px]">
                  {loading ? (
                    <tr><td colSpan={3} className="py-20 text-center uppercase font-roboto-condensed text-[10px] tracking-widest animate-pulse">Establishing_Link</td></tr>
                  ) : logs.map((row, idx) => (
                    <React.Fragment key={idx}>
                      <tr className={`hover:bg-white/[0.04] transition-colors group ${expandedRow === idx ? 'bg-white/[0.03]' : ''}`}>
                        <td className="px-8 py-6 text-gray-400">
                          {row.event_time ? new Date(row.event_time.$date || row.event_time).toLocaleString() : "---"}
                        </td>
                        <td className="px-8 py-6 text-center font-bold text-cyan-400 tracking-tight uppercase">
                          {row.hostname || "UNKNOWN_NODE"}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                            className={`inline-flex items-center gap-3 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${expandedRow === idx ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-white/5 text-gray-500 hover:text-white border border-white/5'}`}
                          >
                            {expandedRow === idx ? "Hide" : "Decode"}
                            <Terminal size={12} />
                          </button>
                        </td>
                      </tr>
                      {expandedRow === idx && (
                        <tr>
                          <td colSpan={3} className="bg-black/60 p-0">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-10 py-8 border-y border-cyan-500/10">
                                <div className="flex items-center justify-between mb-6">
                                  <p className="font-roboto-condensed text-[10px] font-black uppercase text-cyan-400 tracking-widest leading-none">Raw_Buffer_Dump</p>
                                  <button onClick={() => navigator.clipboard.writeText(JSON.stringify(row, null, 2))} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-xl text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-widest"><Copy size={12} /> Copy_Hex</button>
                                </div>
                                <pre className="font-jetbrains text-[12px] text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-auto cyber-scroll p-8 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
                                  {JSON.stringify(row, null, 3)}
                                </pre>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* MOBILE CARDS */
            <div className="space-y-4 pb-4">
              {loading ? (
                 <div className="py-20 text-center uppercase font-roboto-condensed text-[10px] tracking-widest text-cyan-500 animate-pulse">Establishing_Link</div>
              ) : logs.map((row, idx) => (
                <div key={idx} className="bg-white/[0.03] border-y border-white/5 p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-roboto-condensed text-[8px] font-black text-gray-600 uppercase tracking-widest">Forensic_Stamp</p>
                      <p className="font-jetbrains text-[11px] text-gray-400">
                         {row.event_time ? new Date(row.event_time.$date || row.event_time).toLocaleTimeString() : "---"}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-roboto-condensed text-[8px] font-black text-gray-600 uppercase tracking-widest">Uplink</p>
                      <p className="font-jetbrains text-[11px] font-black text-cyan-400">{row.hostname || "UNK"}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                    className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${expandedRow === idx ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-white/5 text-gray-400 border border-white/10'}`}
                  >
                    {expandedRow === idx ? "Hide_Data" : "Decode_Packet"}
                    <Terminal size={14} />
                  </button>

                  <AnimatePresence>
                    {expandedRow === idx && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-4">
                         <div className="bg-black/80 rounded-2xl border border-white/10 p-4 space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                               <span className="font-roboto-condensed text-[9px] font-black text-cyan-500 uppercase tracking-widest">HEX_DUMP</span>
                               <button onClick={() => navigator.clipboard.writeText(JSON.stringify(row, null, 2))} className="text-gray-600 active:text-white"><Copy size={12} /></button>
                            </div>
                            <pre className="font-jetbrains text-[10px] text-gray-400 leading-relaxed overflow-x-auto cyber-scroll max-h-[300px]">
                              {JSON.stringify(row, null, 2)}
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
    </div>
  );
};

export default MongoLogs;