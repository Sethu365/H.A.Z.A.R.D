import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Database, ArrowLeft, Calendar, Clock, Terminal, 
  X, Fingerprint, Activity, ShieldAlert, Zap, Cpu, 
  FileCode, AlertCircle, Target, Server, Code, Binary,
  ChevronRight, Orbit, OctagonAlert
} from 'lucide-react';

const API_BASE = "http://172.24.16.81:8001";

const AnomalyClientsHistory = ({ setLoading, setError }) => {
  const { hostname } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ total_anomalies: 0, data: [] });
  const [localLoading, setLocalLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showRawLog, setShowRawLog] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading?.(true);
    setError?.(null);
    try {
      const res = await fetch(`${API_BASE}/anomalies/history/${hostname}`);
      if (!res.ok) throw new Error(`Vault_Access_Denied: ${res.status}`);
      const result = await res.json();
      setData({
        total_anomalies: result.total_anomalies || 0,
        data: result.data || []
      });
      setLoading?.(false);
      setLocalLoading(false);
    } catch (err) { 
      setLoading?.(false);
      setLocalLoading(false);
      setError?.("Forensic Archive Link Interrupted");
    }
  }, [hostname, setLoading, setError]);

  useEffect(() => {
    if (hostname) fetchHistory();
  }, [hostname, fetchHistory]);

  const highestRisk = data.data.length > 0 
    ? Math.max(...data.data.map(d => d.risk_score)) 
    : 0;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-inter p-4 md:p-6 pb-32 md:pb-6">
      <div className="max-w-[1600px] mx-auto space-y-6 selection:bg-purple-500/30">
        
        {/* REFINED HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 md:border-b border-white/5">
          <div className="flex items-center justify-center md:justify-start w-full relative">
            {/* Desktop Only Back Button */}
            <button 
              onClick={() => navigate(-1)} 
              className="hidden md:flex absolute left-0 p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            
            <div className="flex flex-col items-center md:items-start md:pl-12">
              <div className="flex items-center gap-2">
                <Database size={18} className="hidden md:block text-purple-500 animate-pulse" />
                <h1 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase text-center md:text-left inter">
                  Vault : {hostname}
                </h1>
              </div>
              {/* Description Hidden on Mobile */}
              <p className="hidden md:block font-roboto-condensed text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">
                Historical_Forensic_Registry // Archive_Access
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate(`/clients/${hostname}/client-anomaly`)}
              className="font-roboto-condensed flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500/20 transition-all"
            >
              <ArrowLeft size={14} />
              Return to Alerts
            </button>
          </div>
        </header>

        {/* STAT TILES */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
          <StatTile label="Archived" value={data.total_anomalies} color="purple" />
          <StatTile label="Max Risk" value={`${highestRisk}%`} color="red" />
        </div>

        {/* FEED LIST */}
        <div className="space-y-2 cyber-scroll">
          {localLoading ? (
            <div className="py-20 text-center text-slate-600 uppercase text-[10px] font-black tracking-widest animate-pulse">
              Accessing Vault...
            </div>
          ) : data.data.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl text-slate-600 text-[11px] uppercase tracking-widest">
              No historical data in vault.
            </div>
          ) : (
            data.data.map((log) => (
              <motion.div 
                key={log.event_id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => setSelectedLog(log)}
                className="group bg-white/[0.02] border border-white/5 hover:border-purple-500/30 p-3 md:p-4 rounded-2xl flex items-center justify-between gap-4 backdrop-blur-md transition-all cursor-pointer shadow-xl active:scale-[0.98]"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                   <div className={`p-2.5 rounded-xl border shrink-0 ${log.risk_score > 80 ? 'border-red-500/30 bg-red-500/5 text-red-500' : 'border-purple-500/30 bg-purple-500/5 text-purple-400'}`}>
                      <Fingerprint size={18} />
                   </div>
                   <div className="min-w-0 flex-1">
                      <h4 className="text-sm md:text-base font-black text-white uppercase tracking-tight group-hover:text-purple-400 transition-colors truncate">
                        {log.process || 'ARCHIVED'}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 opacity-40 font-roboto-condensed">
                          <div className="flex items-center gap-1"><Calendar size={8} /><span className="text-[8px] uppercase">{new Date(log.timestamp).toLocaleDateString()}</span></div>
                          <div className="flex items-center gap-1 border-l border-white/10 pl-2"><Clock size={8} /><span className="text-[8px] uppercase">{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit'})}</span></div>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                   <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full ${log.risk_score > 80 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${log.risk_score}%` }} />
                          </div>
                          <span className={`text-[10px] font-black font-jetbrains ${log.risk_score > 80 ? 'text-red-400' : 'text-purple-400'}`}>{log.risk_score}%</span>
                      </div>
                   </div>
                   <ChevronRight size={16} className="text-slate-700 group-hover:text-white" />
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* MOBILE FLOATING BACK BUBBLE */}
        <div className="md:hidden fixed bottom-32 right-6 z-[2000]">
          <button
            onClick={() => navigate(`/clients/${hostname}/client-anomaly`)}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 text-black shadow-[0_10px_30px_rgba(34,211,238,0.3)] active:scale-90 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent opacity-40" />
            <OctagonAlert size={26} strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse" />
          </button>
        </div>

        {/* DETAIL MODAL */}
        <AnimatePresence>
          {selectedLog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm">
              <div className="absolute inset-0" onClick={() => setSelectedLog(null)} />
              <motion.div initial={isMobile ? { y: "100%" } : { scale: 0.95 }} animate={isMobile ? { y: 0 } : { scale: 1 }} exit={isMobile ? { y: "100%" } : { scale: 0.95 }}
                className="bg-slate-950 border-t md:border border-white/10 w-full md:max-w-2xl max-h-[85vh] rounded-t-[2rem] md:rounded-3xl overflow-hidden flex flex-col relative z-[260] shadow-2xl"
              >
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                  <div className="flex items-center gap-3">
                    <Fingerprint size={18} className={selectedLog.risk_score > 80 ? "text-red-500" : "text-purple-400"} />
                    <h2 className="text-sm font-black uppercase text-white truncate max-w-[200px]">{selectedLog.process}</h2>
                  </div>
                  <X className="text-slate-500 hover:text-white cursor-pointer" size={20} onClick={() => setSelectedLog(null)} />
                </div>

                <div className="p-5 space-y-4 overflow-y-auto cyber-scroll pb-10">
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Risk Factor</p>
                        <p className={`text-2xl font-black ${selectedLog.risk_score > 80 ? 'text-red-500' : 'text-purple-400'}`}>{selectedLog.risk_score}%</p>
                      </div>
                      <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Registry_Date</p>
                        <p className="text-[10px] font-bold text-white leading-tight">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                      </div>
                   </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const StatTile = ({ label, value, color }) => (
  <div className="p-4 md:p-6 bg-white/[0.01] border border-white/5 rounded-2xl md:rounded-3xl shadow-xl backdrop-blur-3xl relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <div className="flex items-center gap-2 mb-1">
        <div className={`h-1.5 w-1.5 rounded-full ${color === 'purple' ? 'bg-purple-500 shadow-[0_0_10px_#a855f7]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
        <p className="font-roboto-condensed text-[8px] font-black uppercase text-slate-500 tracking-widest">{label}</p>
    </div>
    <p className={`font-jetbrains text-2xl md:text-4xl font-black tracking-tighter ${color === 'purple' ? 'text-purple-400' : 'text-red-500'}`}>{value}</p>
  </div>
);

export default AnomalyClientsHistory;