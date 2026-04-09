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
    <div className="min-h-screen bg-[#020617] text-white font-inter selection:bg-cyan-500/30">
      
      <main className="pt-12 pb-20 px-6 md:px-12 w-full space-y-8 transition-all duration-500">
        
        {/* INTEGRATED HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
            >
              <ChevronLeft size={20} className="text-cyan-400" />
            </button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-white">Uplink Stream</h1>
              <p className="font-roboto-condensed text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em]">TimescaleDB_Forensic_Telemetry</p>
            </div>
          </div>
          <div className="flex items-center gap-6 bg-black/40 border border-white/5 py-3 px-6 rounded-2xl">
            <div className="flex flex-col items-end">
              <span className="font-roboto-condensed text-[8px] font-bold text-gray-500 uppercase tracking-widest">Stream_Status</span>
              <span className="font-jetbrains text-xs font-bold text-cyan-400 uppercase tracking-tighter">HYPERTABLE_ACTIVE</span>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <RefreshCw size={16} className={`${isSyncing ? 'animate-spin text-cyan-400' : 'text-gray-700'}`} />
          </div>
        </div>

        {/* EVENT RATE MONITOR (WIDER) */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-10 px-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="font-roboto-condensed text-[11px] font-bold uppercase text-cyan-400/80 tracking-[0.3em]">Ingestion_Velocity_Telemetry</h3>
          </div>

          <div className="h-[300px] w-full bg-black/20 rounded-3xl p-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} opacity={0.03} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#4b5563", fontSize: 10, fontWeight: 700, fontFamily: 'Roboto Condensed' }}
                  tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  axisLine={false} tickLine={false}
                />
                <YAxis tick={{ fill: "#4b5563", fontSize: 10, fontWeight: 700, fontFamily: 'Roboto Condensed' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#05070a", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", fontSize: "11px", fontFamily: 'JetBrains Mono' }}
                  labelFormatter={(l) => `Timestamp: ${new Date(l).toLocaleString()}`}
                />
                <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={3} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* LOG CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 shadow-xl">
          <div className="font-roboto-condensed flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <div className="flex items-center gap-2">
              <ListFilter size={14} className="text-cyan-500" />
              <span>Buffer_Size:</span>
            </div>
            <select
              value={limit}
              onChange={(e) => { setOffset(0); setLimit(Number(e.target.value)); }}
              className="bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-cyan-400 outline-none focus:border-cyan-500/50 transition-all font-jetbrains"
            >
              {[25, 50, 100].map((v) => <option key={v} value={v}>{v} Nodes</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 font-roboto-condensed">
            <button 
              disabled={offset === 0} 
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest disabled:opacity-20 hover:bg-white/10 transition-all text-white"
            >
              Prev_Sector
            </button>
            <button 
              onClick={() => setOffset(offset + limit)}
              className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all text-white"
            >
              Next_Sector
            </button>
          </div>
        </div>

        {/* REGISTRY TABLE (WIDER) */}
        <motion.div 
          layout
          className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm shadow-2xl"
        >
          <div className="overflow-x-auto cyber-scroll">
            <table className="w-full text-left border-separate border-spacing-y-0">
              <thead className="bg-white/[0.02] border-b border-white/5 font-roboto-condensed text-[10px] font-bold uppercase text-gray-500 tracking-[0.3em]">
                <tr>
                  <th className="px-8 py-6">Temporal_Stamp</th>
                  <th className="px-8 py-6 text-center">Node_Source</th>
                  <th className="px-8 py-6 text-right">Raw_Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-jetbrains text-[12px]">
                {loading && !hasLoaded ? (
                  <tr>
                    <td colSpan={3} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="animate-spin text-cyan-500" size={24} />
                        <span className="font-roboto-condensed text-[10px] font-bold uppercase tracking-widest text-gray-600">Establishing_Forensic_Link</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.map((row, idx) => (
                  <React.Fragment key={idx}>
                    <tr className={`hover:bg-white/[0.02] transition-colors group ${expandedRow === idx ? 'bg-white/[0.03]' : ''}`}>
                      <td className="px-8 py-5 text-gray-400 font-medium">
                        {row.event_time ? new Date(row.event_time).toLocaleString() : "---"}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="px-4 py-1.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 font-bold uppercase tracking-tighter">
                          {row.hostname || "UNKNOWN_NODE"}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right font-roboto-condensed">
                        <button
                          onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                          className={`inline-flex items-center gap-3 px-5 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${expandedRow === idx ? 'bg-white text-black' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
                        >
                          {expandedRow === idx ? "Collapse" : "Decode"}
                          <Terminal size={14} />
                        </button>
                      </td>
                    </tr>

                    <AnimatePresence>
                      {expandedRow === idx && (
                        <tr>
                          <td colSpan={3} className="bg-black/60 p-0">
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }} 
                              animate={{ height: "auto", opacity: 1 }} 
                              exit={{ height: 0, opacity: 0 }}
                              className="px-10 py-8 border-y border-cyan-500/10"
                            >
                              <div className="flex items-center justify-between mb-6">
                                <div className="space-y-1">
                                  <p className="font-roboto-condensed text-[10px] font-bold uppercase text-cyan-500 tracking-widest">Forensic_Data_Packet</p>
                                  <p className="font-jetbrains text-[9px] text-gray-600 uppercase">Sequence_ID: {idx.toString(16).padStart(8, '0')}</p>
                                </div>
                                <button
                                  onClick={() => navigator.clipboard.writeText(JSON.stringify(row.original_payload, null, 2))}
                                  className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/10 rounded-xl text-[10px] font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all uppercase tracking-widest"
                                >
                                  <Copy size={12} /> Sync to Clipboard
                                </button>
                              </div>
                              <pre className="font-jetbrains text-[13px] text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-auto cyber-scroll p-8 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
                                {JSON.stringify(row.original_payload, null, 3)}
                              </pre>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default TimescaleLogs;