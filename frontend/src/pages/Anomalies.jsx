import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; 
import { 
  Fingerprint, Binary, Clock, ChevronRight, Search, History, 
  Orbit, Radio, ArrowLeft
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
    if (isInitial) {
      setLoading?.(true);
      setError?.(null);
    }
    try {
      const res = await fetch(`${API_BASE}/api/anomalies`);
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const result = await res.json();
      setAnomalyData({ total_anomalies: result.total_anomalies || 0, data: result.data || [] });
      if (isInitial) setLoading?.(false);
      setLocalSyncing(false);
    } catch (err) {
      if (isInitial) {
        setLoading?.(false);
        setError?.("Sync Failed.");
      }
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
    <div className="min-h-screen bg-[#020617] text-slate-200 font-inter p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6 selection:bg-cyan-500/30">
        
        {/* HEADER: Tightened height and font sizes */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <button 
      onClick={() => navigate(-1)} 
      className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
    >
      <ArrowLeft size={18} />
    </button>
              <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
                Anomalies
              </h1>
            </div>
            <p className="font-roboto-condensed text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">
              Neural_Link // Live_Threat_Stream
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-cyan-400" size={14} />
              <input
                type="text"
                placeholder="Search Buffer..."
                className="font-roboto-condensed bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[11px] outline-none focus:border-cyan-500/50 transition-all w-full md:w-60 uppercase tracking-widest backdrop-blur-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              onClick={() => navigate('/anomalies/history')}
              className="font-roboto-condensed flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-slate-950 font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-95"
            >
              <History size={14} strokeWidth={3} />
              Archives
            </button>
          </div>
        </header>

        {/* STATS: Scaled down from p-10/text-7xl to p-6/text-4xl */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatTile label="Total Events" value={anomalyData.total_anomalies} color="cyan" />
          <StatTile label="Risk Ceiling" value={`${Math.max(...(anomalyData.data?.map(d => d.risk_score) || [0]), 0)}%`} color="red" />
        </section>

        {/* LIST: Reduced item height and padding */}
        <section className="space-y-2 cyber-scroll max-h-[70vh] overflow-y-auto pr-2">
          {localSyncing ? (
            <div className="py-20 text-center text-slate-600 uppercase text-[10px] font-black tracking-widest animate-pulse">
              Linking...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl text-slate-600 text-[11px] tracking-widest uppercase">
              No behavioral deviations
            </div>
          ) : (
            filteredData.map((log) => (
              <motion.div 
                key={log.event_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md transition-all cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <div className="flex items-center gap-5 flex-1 min-w-0 w-full">
                   <div className={`p-3 rounded-xl border shrink-0 transition-all ${log.risk_score > 80 ? 'border-red-500/30 text-red-500' : 'border-cyan-500/30 text-cyan-400'}`}>
                      <Fingerprint size={20} />
                   </div>
                   <div className="min-w-0 flex-1">
                      <h4 className="text-base font-black text-white uppercase tracking-tight group-hover:text-cyan-400 transition-colors truncate">
                        {log.process || 'SYSTEM_CORE'}
                      </h4>
                      <p className="font-jetbrains text-[9px] text-slate-500 truncate uppercase tracking-tight mt-0.5">
                        {log.hostname} <span className="mx-1 opacity-20">|</span> {log.summary}
                      </p>
                   </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                   <div className="text-right hidden sm:block">
                      <p className="text-[8px] font-black text-slate-600 uppercase mb-1 tracking-widest">Risk</p>
                      <div className="flex items-center gap-3">
                          <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden shadow-inner">
                              <div className={`h-full ${log.risk_score > 80 ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${log.risk_score}%` }} />
                          </div>
                          <span className={`text-[11px] font-black font-jetbrains ${log.risk_score > 80 ? 'text-red-400' : 'text-cyan-400'}`}>{log.risk_score}%</span>
                      </div>
                   </div>
                   <ChevronRight size={18} className="text-slate-700 group-hover:text-cyan-500 transition-all" />
                </div>
              </motion.div>
            ))
          )}
        </section>
      </div>
    </div>
  );
};

const StatTile = ({ label, value, color }) => (
  <div className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl shadow-xl backdrop-blur-3xl transition-all hover:bg-white/[0.03] group overflow-hidden relative">
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <div className="flex items-center gap-3 mb-2">
        <div className={`h-2 w-2 rounded-full ${color === 'cyan' ? 'bg-cyan-500' : 'bg-red-500'}`} />
        <p className="font-roboto-condensed text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">{label}</p>
    </div>
    <p className={`font-jetbrains text-4xl font-black tracking-tighter ${color === 'cyan' ? 'text-cyan-400' : 'text-red-500'}`}>{value}</p>
  </div>
);

export default Anomalies;