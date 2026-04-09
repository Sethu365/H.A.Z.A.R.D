import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Activity, Terminal, ChevronRight, Search, History, 
  ShieldAlert, Fingerprint, Zap, Cpu, Clock, X, 
  Binary, FileCode, AlertCircle, Target, Server, Code, Orbit, ArrowLeft
} from 'lucide-react';

const API_BASE = "http://172.24.16.81:8001";

const AnomalyClients = ({ setLoading, setError }) => {
  const { hostname } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ today_anomalies: 0, data: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showRawLog, setShowRawLog] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchToday = useCallback(async () => {
    setLoading?.(true);
    setError?.(null);
    try {
      const res = await fetch(`${API_BASE}/anomalies/today/${hostname}`);
      if (!res.ok) throw new Error(`Link_Fault: ${res.status}`);
      const result = await res.json();
      setData({
        today_anomalies: result.today_anomalies || 0,
        data: result.data || []
      });
      setLoading?.(false);
    } catch (err) {
      setLoading?.(false);
      setError?.("Uplink to Client SOC failed");
    }
  }, [hostname, setLoading, setError]);

  useEffect(() => {
    if (hostname) fetchToday();
  }, [hostname, fetchToday]);

  const filteredData = (data.data || []).filter(item => 
    item.process?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-inter p-3 md:p-6 pb-32">
      <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6 selection:bg-cyan-500/30">
        
        {/* CENTERED MOBILE HEADER */}
        <header className="flex flex-col gap-6 pb-2 border-b border-white/5">
<div className="flex items-center justify-between gap-4 md:gap-2">
  {/* Back Button */}
  <button 
    onClick={() => navigate(-1)} 
    className="hidden md:flex p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 active:scale-90"
  >
    <ArrowLeft size={18} />
  </button>

  <div className="flex-1 text-center md:text-left px-2 md:px-4">
    <h1 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase inter">
      Alerts :: {hostname}
    </h1>
    <p className="hidden md:block font-roboto-condensed text-[7px] md:text-[9px] font-black text-cyan-500/60 uppercase tracking-[0.3em]">
      Forensic_Link // behavioral_analysis
    </p>
  </div>

  {/* Archive Button */}
  <button
    onClick={() => navigate(`/clients/${hostname}/client-anomaly/history`)}
    className="hidden md:flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-black text-[10px] uppercase tracking-widest"
  >
    <History size={14} /> Archives
  </button>
</div>

          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            <input
              type="text"
              placeholder="Filter Buffer..."
              className="font-roboto-condensed bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-[11px] outline-none focus:border-cyan-500/50 transition-all w-full uppercase tracking-widest"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {/* STAT TILES */}
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Events" value={data.today_anomalies} color="cyan" />
          <StatTile label="Risk" value={`${data.data.length > 0 ? Math.max(...data.data.map(d => d.risk_score || 0)) : 0}%`} color="red" />
        </div>

        {/* FEED LIST */}
        <div className="space-y-2 cyber-scroll">
          {filteredData.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl text-slate-600 text-[10px] uppercase tracking-widest">
              ~ System Nominal ~
            </div>
          ) : (
            filteredData.map((log) => (
              <motion.div 
                key={log.event_id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => { setSelectedLog(log); setShowRawLog(false); }}
                className="group bg-white/[0.02] border border-white/5 active:bg-white/[0.05] p-3 md:p-4 rounded-2xl flex items-center justify-between gap-3 backdrop-blur-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                   <div className={`p-2.5 rounded-lg border shrink-0 ${log.risk_score > 80 ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'}`}>
                      <Fingerprint size={18} />
                   </div>
                   <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">{log.process || 'SYSTEM'}</h4>
                        <span className={`text-[9px] font-bold font-mono ${log.risk_score > 80 ? 'text-red-500' : 'text-cyan-500'}`}>{log.risk_score}%</span>
                      </div>
                      <p className="font-jetbrains text-[8px] text-slate-500 truncate uppercase mt-0.5">{log.summary}</p>
                   </div>
                </div>
                <ChevronRight size={16} className="text-slate-700" />
              </motion.div>
            ))
          )}
        </div>

        {/* MOBILE FLOATING HISTORY BUBBLE */}
        <div className="md:hidden fixed bottom-32 right-6 z-[2000]">
          <button
            onClick={() => navigate(`/clients/${hostname}/client-anomaly/history`)}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-800 text-white shadow-[0_10px_30px_rgba(168,85,247,0.3)] active:scale-90 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-40" />
            <History size={26} strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse" />
          </button>
        </div>

        {/* DETAIL MODAL (Bottom Sheet for Mobile) */}
        <AnimatePresence>
          {selectedLog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm">
              <div className="absolute inset-0" onClick={() => setSelectedLog(null)} />
              <motion.div 
                initial={isMobile ? { y: "100%" } : { scale: 0.95 }} 
                animate={isMobile ? { y: 0 } : { scale: 1 }} 
                exit={isMobile ? { y: "100%" } : { scale: 0.95 }}
                className="bg-[#030712] border-t md:border border-white/10 w-full md:max-w-2xl max-h-[90vh] rounded-t-[2rem] md:rounded-[2rem] overflow-hidden flex flex-col relative z-[1010]"
              >
                <div className="md:hidden w-12 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-1" />
                <div className="p-5 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Fingerprint size={18} className={selectedLog.risk_score > 80 ? "text-red-500" : "text-cyan-400"} />
                    <h2 className="text-sm font-black uppercase text-white truncate max-w-[200px]">{selectedLog.process}</h2>
                  </div>
                  <X className="text-slate-500 cursor-pointer" size={20} onClick={() => setSelectedLog(null)} />
                </div>
                <div className="p-5 space-y-4 overflow-y-auto cyber-scroll pb-10">
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Risk Index</p>
                        <p className={`text-2xl font-black ${selectedLog.risk_score > 80 ? 'text-red-500' : 'text-cyan-400'}`}>{selectedLog.risk_score}%</p>
                      </div>
                      <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Time_Log</p>
                        <p className="text-xs font-bold text-white leading-tight">{new Date(selectedLog.timestamp).toLocaleTimeString()}</p>
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
  <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl shadow-xl relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <p className="font-roboto-condensed text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">{label}</p>
    <p className={`font-jetbrains text-2xl font-black tracking-tighter ${color === 'cyan' ? 'text-cyan-400' : 'text-red-500'}`}>{value}</p>
  </div>
);

export default AnomalyClients;