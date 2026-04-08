import React, { useEffect, useState, useRef } from "react";
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
import { Database, Activity, Terminal, ChevronRight, ListFilter, Copy } from "lucide-react";
import Topbar from "../components/Topbar";

const API_BASE = "http://172.24.16.81:8001";
const DB_NAME = "client_logs";
const COLLECTION = "client_raw_events";

const MongoLogs = () => {
  const [logs, setLogs] = useState([]);
  const [rateData, setRateData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);
  const mounted = useRef(false);

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
    try {
      const res = await axios.get(`${API_BASE}/mongo/ingestion-rate`, {
        params: { db: DB_NAME, coll: COLLECTION, minutes: 8640 }
      });
      setRateData(res.data || []);
    } catch (e) {
      console.error("Ingestion rate fetch failed", e);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchRate();
  }, [limit, offset]);

  useEffect(() => { mounted.current = true; }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-inter">
      {/* RESPONSIVE TOPBAR */}
      <Topbar name="Raw Events" desc="MongoDB_Unstructured_Log_Mesh" />

      <main className="pt-24 pb-20 px-4 md:px-8 space-y-6 max-w-7xl mx-auto overflow-x-hidden">
        
        {/* INGESTION MONITOR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 backdrop-blur-md shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="font-roboto-condensed text-xs md:text-sm font-black uppercase tracking-[0.2em] text-gray-100">Traffic_Density</h3>
          </div>

          <div className="h-48 md:h-64 w-full">
            {rateData.length === 0 ? (
              <div className="font-roboto-condensed h-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-gray-600">No_Telemetry_Available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} opacity={0.05} />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#6b7280", fontSize: 9, fontWeight: 700, fontFamily: 'Roboto Condensed' }}
                    tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis hide={window.innerWidth < 640} tick={{ fill: "#6b7280", fontSize: 9, fontWeight: 700, fontFamily: 'Roboto Condensed' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "10px", fontFamily: 'Roboto Condensed' }}
                    labelFormatter={(l) => `Time: ${new Date(l).toLocaleTimeString()}`}
                  />
                  <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
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
              {[25, 50, 100].map(v => <option key={v} value={v}>{v} Nodes</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 font-roboto-condensed">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase disabled:opacity-20 hover:bg-white/10 transition-all"
            >
              Prev_Sector
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase hover:bg-white/10 transition-all"
            >
              Next_Sector
            </button>
          </div>
        </div>

        {/* REGISTRY TABLE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl"
        >
          <div className="overflow-x-auto cyber-scroll">
            <table className="w-full text-left">
              <thead className="bg-white/[0.02] border-b border-white/5 font-roboto-condensed text-[9px] font-black uppercase text-gray-500 tracking-[0.3em]">
                <tr>
                  <th className="px-6 py-4">Forensic_Stamp</th>
                  <th className="px-6 py-4 text-center">Node_Uplink</th>
                  <th className="px-6 py-4 text-right">Data_Packet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-jetbrains text-[11px]">
                {loading ? (
                  <tr><td colSpan={3} className="font-roboto-condensed p-10 text-center text-gray-600 animate-pulse uppercase tracking-widest">Establishing_Neural_Link...</td></tr>
                ) : logs.map((row, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-6 py-4 text-gray-400">
                        {row.event_time ? new Date(row.event_time.$date || row.event_time).toLocaleString() : "---"}
                      </td>
                      <td className="px-6 py-4 text-center uppercase font-bold tracking-tighter text-cyan-400">
                        {row.hostname || "UNKNOWN_NODE"}
                      </td>
                      <td className="px-6 py-4 text-right font-roboto-condensed">
                        <button
                          onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                          className="flex items-center gap-2 ml-auto text-gray-500 hover:text-white transition-colors group"
                        >
                          <span className="text-[9px] font-black uppercase tracking-widest">{expandedRow === idx ? "Hide" : "Decode"}</span>
                          <Terminal size={14} className="group-hover:rotate-12 transition-transform" />
                        </button>
                      </td>
                    </tr>

                    <AnimatePresence>
                      {expandedRow === idx && (
                        <tr>
                          <td colSpan={3} className="bg-black/40 p-0 overflow-hidden">
                            <motion.div 
                              initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                              className="p-6 border-y border-cyan-500/10"
                            >
                              <div className="flex items-center justify-between mb-4 font-roboto-condensed">
                                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-500/60">Raw_Buffer_Dump</span>
                                <button
                                  onClick={() => navigator.clipboard.writeText(JSON.stringify(row, null, 2))}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 rounded-lg text-[9px] font-black text-cyan-400 hover:bg-cyan-500/20 transition-all uppercase"
                                >
                                  <Copy size={12} /> Copy_Hex
                                </button>
                              </div>
                              <pre className="font-jetbrains text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-auto cyber-scroll p-4 bg-white/[0.01] rounded-xl border border-white/5">
                                {JSON.stringify(row, null, 2)}
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

export default MongoLogs;