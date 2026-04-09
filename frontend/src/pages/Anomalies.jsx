import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; 
import { 
  Fingerprint, Clock, ChevronRight, Search, History, 
  ArrowLeft, ShieldAlert
} from 'lucide-react';

const API_BASE = "http://172.24.16.81:8001";
const POLL_INTERVAL = 5000;

const Anomalies = ({ setLoading, setError }) => {
  const [anomalyData, setAnomalyData] = useState({ total_anomalies: 0, data: [] });
  const [localSyncing, setLocalSyncing] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) { setLoading?.(true); setError?.(null); }
    try {
      const res = await fetch(`${API_BASE}/api/anomalies`);
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const result = await res.json();
      setAnomalyData({ total_anomalies: result.total_anomalies || 0, data: result.data || [] });
      if (isInitial) setLoading?.(false);
      setLocalSyncing(false);
    } catch (err) {
      if (isInitial) { setLoading?.(false); setError?.("Sync Failed."); }
    } finally {
      timerRef.current = setTimeout(() => loadData(false), POLL_INTERVAL);
    }
  }, [setLoading, setError]);

  useEffect(() => {
    loadData(true);
    return () => clearTimeout(timerRef.current);
  }, [loadData]);

  const filteredData = anomalyData.data.filter(item => 
    item.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.process?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-inter p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6 selection:bg-cyan-500/30">
        
        {/* HEADER: Dynamic Mobile/Laptop Switch */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 md:border-b border-white/5">
          <div className="flex items-center justify-center md:justify-start w-full md:w-auto relative">
            {/* Laptop Back Button Only */}
            <button 
              onClick={() => navigate(-1)} 
              className="hidden md:flex absolute left-0 p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            
            <div className="flex flex-col items-center md:items-start md:pl-12">
              <div className="flex items-center gap-2">
                <div className="hidden md:block w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase font-inter text-center md:text-left">
                  Anomalies
                </h1>
              </div>
              {/* Description Hidden on Mobile */}
              <p className="hidden md:block font-roboto-condensed text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">
                Neural_Link // Live_Threat_Stream
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-cyan-400" size={14} />
              <input
                type="text"
                placeholder="Search Buffer..."
                className="font-roboto-condensed bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 md:py-2 text-[11px] outline-none focus:border-cyan-500/50 transition-all w-full uppercase tracking-widest backdrop-blur-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Desktop Archive Button */}
            <button
              onClick={() => navigate('/anomalies/history')}
              className="hidden md:flex font-roboto-condensed items-center gap-2 px-5 py-2 rounded-xl bg-white text-slate-950 font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-95"
            >
              <History size={14} strokeWidth={3} />
              Archives
            </button>
          </div>
        </header>

        {/* STATS: 2-column grid on mobile */}
        <section className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
          <StatTile label="Total" value={anomalyData.total_anomalies} color="cyan" />
          <StatTile label="Max Risk" value={`${Math.max(...(anomalyData.data?.map(d => d.risk_score) || [0]), 0)}%`} color="red" />
        </section>

        {/* LIST: Mobile Optimized Cards */}
        <section className="space-y-2 cyber-scroll max-h-[70vh] overflow-y-auto pr-2 pb-10">
          {localSyncing ? (
            <div className="py-20 text-center text-slate-600 uppercase text-[10px] font-black tracking-widest animate-pulse">Linking...</div>
          ) : filteredData.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl text-slate-600 text-[10px] tracking-widest uppercase">No behavioral deviations</div>
          ) : (
            filteredData.map((log) => (
              <motion.div 
                key={log.event_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group bg-white/[0.02] border border-white/5 active:bg-white/[0.05] p-3 md:p-4 rounded-2xl flex items-center justify-between gap-3 backdrop-blur-md transition-all cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                   <div className={`p-2.5 rounded-xl border shrink-0 transition-all ${log.risk_score > 80 ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'}`}>
                      <Fingerprint size={18} />
                   </div>
                   <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">
                          {log.process || 'SYSTEM'}
                        </h4>
                        <span className={`text-[9px] font-bold font-mono md:hidden ${log.risk_score > 80 ? 'text-red-500' : 'text-cyan-500'}`}>
                          {log.risk_score}%
                        </span>
                      </div>
                      <p className="font-jetbrains text-[8px] md:text-[9px] text-slate-500 truncate uppercase tracking-tight mt-0.5">
                        {log.hostname} <span className="mx-1 opacity-20">|</span> {log.summary}
                      </p>
                   </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                   <div className="text-right hidden sm:block">
                      <p className="text-[8px] font-black text-slate-600 uppercase mb-1 tracking-widest leading-none">Risk</p>
                      <div className="flex items-center gap-3">
                          <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden shadow-inner">
                              <div className={`h-full ${log.risk_score > 80 ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${log.risk_score}%` }} />
                          </div>
                          <span className={`text-[10px] font-black font-jetbrains ${log.risk_score > 80 ? 'text-red-400' : 'text-cyan-400'}`}>{log.risk_score}%</span>
                      </div>
                   </div>
                   <ChevronRight size={16} className="text-slate-700 active:text-cyan-500" />
                </div>
              </motion.div>
            ))
          )}
        </section>

        {/* MOBILE FLOATING ARCHIVE BUBBLE: Higher position (bottom-32) */}
        <div className="md:hidden fixed bottom-32 right-6 z-[2000]">
          <button
            onClick={() => navigate('/anomalies/history')}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-white text-slate-950 shadow-2xl active:scale-90 transition-all border border-white/20"
          >
            <History size={26} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

const StatTile = ({ label, value, color }) => (
  <div className="p-4 md:p-6 bg-white/[0.01] border border-white/5 rounded-2xl md:rounded-3xl shadow-xl relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <div className="flex items-center gap-2 mb-1">
        <div className={`h-1.5 w-1.5 rounded-full ${color === 'cyan' ? 'bg-cyan-500' : 'bg-red-500'}`} />
        <p className="font-roboto-condensed text-[8px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest md:tracking-[0.3em]">{label}</p>
    </div>
    <p className={`font-jetbrains text-2xl md:text-4xl font-black tracking-tighter ${color === 'cyan' ? 'text-cyan-400' : 'text-red-500'}`}>{value}</p>
  </div>
);

export default Anomalies;