import React, { useEffect, useState } from "react";
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
import { Database, Terminal, Copy, ChevronRight, ListFilter, Activity } from "lucide-react";
import Topbar from "../components/Topbar";

const API_BASE = "http://172.24.16.81:8001";

const TimescaleLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/timescale/logs?limit=${limit}&offset=${offset}`
      );
      setLogs(res.data.data || []);
    } catch (err) {
      console.error("Link Failure: Timescale Stream", err);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-[#020617] text-white font-inter">
      <Topbar name="Uplink Stream" desc="TimescaleDB_Forensic_Telemetery" />

      <main className="pt-24 pb-20 px-4 md:px-8 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
        
        {/* EVENT RATE MONITOR */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 backdrop-blur-md shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="font-roboto-condensed text-xs md:text-sm font-black uppercase tracking-[0.2em] text-gray-100">Ingestion_Velocity</h3>
          </div>

          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} opacity={0.05} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#6b7280", fontSize: 9, fontWeight: 700, fontFamily: 'Roboto Condensed' }}
                  tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  axisLine={false} tickLine={false}
                />
                <YAxis tick={{ fill: "#6b7280", fontSize: 9, fontWeight: 700, fontFamily: 'Roboto Condensed' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "10px", fontFamily: 'Roboto Condensed' }}
                  labelFormatter={(l) => `Time: ${new Date(l).toLocaleTimeString()}`}
                />
                <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* LOG CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
          <div className="font-roboto-condensed flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <ListFilter size={14} />
            <span>Buffer_Size:</span>
            <select
              value={limit}
              onChange={(e) => { setOffset(0); setLimit(Number(e.target.value)); }}
              className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-1.5 text-cyan-400 outline-none focus:border-cyan-500 transition-all font-inter"
            >
              {[25, 50, 100].map((v) => <option key={v} value={v}>{v} Rows</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 font-roboto-condensed">
            <button 
              disabled={offset === 0} 
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase disabled:opacity-20 hover:bg-white/10"
            >
              Prev_Sector
            </button>
            <button 
              onClick={() => setOffset(offset + limit)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase hover:bg-white/10"
            >
              Next_Sector
            </button>
          </div>
        </div>

        {/* LOG REGISTRY TABLE */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="overflow-x-auto cyber-scroll">
            <table className="w-full text-left">
              <thead className="bg-white/[0.02] border-b border-white/5 font-roboto-condensed text-[9px] font-black uppercase text-gray-500 tracking-[0.3em]">
                <tr>
                  <th className="px-6 py-4">Temporal_Stamp</th>
                  <th className="px-6 py-4 text-center">Node_Source</th>
                  <th className="px-6 py-4 text-right">Raw_Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-jetbrains text-[11px]">
                {loading ? (
                  <tr><td colSpan={3} className="font-roboto-condensed p-10 text-center text-gray-600 animate-pulse uppercase tracking-widest">Syncing Log Registry...</td></tr>
                ) : logs.map((row, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-6 py-4 text-gray-400">
                        {row.event_time ? new Date(row.event_time).toLocaleString() : "---"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 font-bold uppercase tracking-tighter">
                          {row.hostname || "UNKNOWN_NODE"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-roboto-condensed">
                        <button
                          onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                          className="flex items-center gap-2 ml-auto text-gray-500 hover:text-white transition-colors group"
                        >
                          <span className="text-[9px] font-black uppercase tracking-widest">{expandedRow === idx ? "Collapse" : "Decode"}</span>
                          <Terminal size={14} className="group-hover:rotate-12 transition-transform" />
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDED JSON VIEW */}
                    <AnimatePresence>
                      {expandedRow === idx && (
                        <tr>
                          <td colSpan={3} className="bg-black/40 p-0 overflow-hidden">
                            <motion.div 
                              initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                              className="p-6 border-y border-cyan-500/10"
                            >
                              <div className="flex items-center justify-between mb-4 font-roboto-condensed">
                                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-500/60">Forensic_Data_Packet</span>
                                <button
                                  onClick={() => navigator.clipboard.writeText(JSON.stringify(row.original_payload, null, 2))}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 rounded-lg text-[9px] font-black text-cyan-400 hover:bg-cyan-500/20 transition-all uppercase"
                                >
                                  <Copy size={12} /> Sync to Clipboard
                                </button>
                              </div>
                              <pre className="font-jetbrains text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-auto cyber-scroll p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                {JSON.stringify(row.original_payload, null, 2)}
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
        </div>
      </main>
    </div>
  );
};

export default TimescaleLogs;