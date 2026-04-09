import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; 
import { 
  Database, ArrowLeft, Clock, X, Fingerprint, ShieldAlert, 
  Activity, Cpu, Binary, ChevronRight, Search, FileCode 
} from 'lucide-react';

const API_BASE = "http://172.24.16.81:8001";

const AnomalyHistory = ({ setLoading, setError }) => {
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState({ total_anomalies: 0, data: [] });
  const [localSyncing, setLocalSyncing] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showRawLog, setShowRawLog] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading?.(true);
    setError?.(null);
    try {
      const res = await fetch(`${API_BASE}/api/anomalies/history`);
      if (!res.ok) throw new Error(`Vault_Access_Denied: ${res.status}`);
      const result = await res.json();
      setHistoryData({ total_anomalies: result.total_anomalies || 0, data: result.data || [] });
      setLoading?.(false);
      setLocalSyncing(false);
    } catch (err) { 
      setLoading?.(false);
      setLocalSyncing(false);
      setError?.("Global Forensic Vault Unresponsive");
    }
  }, [setLoading, setError]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const filteredData = (historyData.data || []).filter(item => 
    item.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.process?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-inter p-4 md:p-6 pb-32 md:pb-6">
      <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6 selection:bg-purple-500/30">
        
        {/* HEADER: Dynamic Mobile/Laptop switch */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 md:border-b border-white/5">
          <div className="flex items-center justify-center md:justify-start w-full md:w-auto relative">
            <button onClick={() => navigate(-1)} className="hidden md:flex absolute left-0 p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
              <ArrowLeft size={18} />
            </button>
            
            <div className="flex flex-col items-center md:items-start md:pl-12">
              <div className="flex items-center gap-2">
                <Database size={18} className="hidden md:block text-purple-500 animate-pulse" />
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase text-center md:text-left">Forensic Vault</h1>
              </div>
              <p className="hidden md:block font-roboto-condensed text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Historical_Registry // global_exploits_buffer</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-purple-400" size={14} />
              <input 
                type="text" placeholder="Search Vault..." 
                className="font-roboto-condensed bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 md:py-2 text-[11px] outline-none focus:border-purple-500/50 transition-all w-full uppercase tracking-widest backdrop-blur-xl" 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <button onClick={() => navigate('/anomalies')} className="hidden md:flex font-roboto-condensed items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500/20 transition-all">
              <ArrowLeft size={14} /> Live Telemetry
            </button>
          </div>
        </header>

        {/* STATS: Scrollable on Mobile */}
        <div className="flex md:grid md:grid-cols-2 gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <StatTile label="Archived" value={historyData.total_anomalies} icon={<Database size={18} />} color="purple" />
          <StatTile label="Critical" value={historyData.data.filter(a => a.risk_score >= 90).length} icon={<ShieldAlert size={18} />} color="red" />
        </div>

        {/* FEED LIST */}
        <div className="space-y-2 cyber-scroll max-h-[70vh] overflow-y-auto pr-2 pb-10">
          {localSyncing ? (
            <div className="py-20 text-center text-slate-600 uppercase text-[10px] font-black tracking-widest animate-pulse">Accessing Vault...</div>
          ) : filteredData.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl text-slate-600 text-[10px] uppercase tracking-widest">Vault Buffer Empty</div>
          ) : (
            filteredData.map((log) => (
              <motion.div 
                key={log.event_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => { setSelectedLog(log); setShowRawLog(false); }}
                className="group bg-white/[0.02] border border-white/5 active:bg-white/[0.05] p-3 md:p-4 rounded-2xl flex items-center justify-between gap-3 backdrop-blur-md transition-all cursor-pointer shadow-lg"
              >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                     <div className={`p-2.5 rounded-xl border shrink-0 transition-all ${log.risk_score > 80 ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-purple-500/30 bg-purple-500/10 text-purple-400'}`}>
                        <Fingerprint size={18} />
                     </div>
                     <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white uppercase tracking-tight truncate group-hover:text-purple-400 transition-colors">{log.process || 'SYSTEM'}</h4>
                          <span className={`text-[9px] font-bold font-mono md:hidden ${log.risk_score > 80 ? 'text-red-500' : 'text-purple-400'}`}>{log.risk_score}%</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 opacity-40 font-jetbrains text-[8px] uppercase tracking-tight">
                            <span className="text-slate-400">{log.hostname}</span>
                            <span className="opacity-20">|</span>
                            <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                     <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden"><div className={`h-full ${log.risk_score > 80 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${log.risk_score}%` }} /></div>
                            <span className={`text-[10px] font-black font-jetbrains ${log.risk_score > 80 ? 'text-red-400' : 'text-purple-400'}`}>{log.risk_score}%</span>
                        </div>
                     </div>
                     <ChevronRight size={16} className="text-slate-700 active:text-purple-400" />
                  </div>
              </motion.div>
            ))
          )}
        </div>

        {/* MOBILE FLOATING ACTION: Live Telemetry */}
        <div className="md:hidden fixed bottom-32 right-6 z-[2000]">
          <button onClick={() => navigate('/anomalies')} className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-black shadow-2xl active:scale-90 transition-all border border-white/20">
            <Activity size={26} strokeWidth={2.5} />
          </button>
        </div>

        {/* DETAIL MODAL: Centered Bottom Sheet for Mobile */}
<AnimatePresence>
          {selectedLog && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedLog(null)}
            >
              <motion.div 
                initial={isMobile ? { y: "100%" } : { scale: 0.95, opacity: 0 }} 
                animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }} 
                exit={isMobile ? { y: "100%" } : { scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#030712] border md:border border-white/10 
                  w-[95%] sm:w-[90%] md:w-full md:max-w-4xl 
                  max-h-[85vh] 
                  rounded-3xl overflow-hidden flex flex-col relative z-[260]"
              >
                {/* Tactical Drag Handle - Mobile Only Center */}
                <div className="flex justify-center w-full pt-4 pb-2 md:hidden">
                  <div className="w-12 h-1 bg-white/10 rounded-full" />
                </div>
                
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                  <div className="flex items-center gap-3">
                    <Fingerprint size={18} className={selectedLog.risk_score > 80 ? "text-red-500" : "text-purple-400"} />
                    <h2 className="text-sm font-black uppercase text-white truncate max-w-[150px] md:max-w-none">{selectedLog.process}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowRawLog(!showRawLog)} className="text-[8px] md:text-[9px] font-black uppercase px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
                      {showRawLog ? "UI HUD" : "Raw Logs"}
                    </button>
                    <X className="text-slate-500 cursor-pointer" size={20} onClick={() => setSelectedLog(null)} />
                  </div>
                </div>

                {/* MODAL BODY: Responsive Alignment */}
                <div className="p-6 space-y-4 overflow-y-auto cyber-scroll pb-12 flex flex-col items-center md:items-start">
                   {showRawLog ? (
                     <pre className="text-[10px] text-purple-300/80 bg-black/40 p-4 rounded-xl font-mono overflow-x-auto selection:bg-purple-500/40 w-full">
                       {JSON.stringify(selectedLog, null, 2)}
                     </pre>
                   ) : (
                     <div className="space-y-4 w-full flex flex-col items-center md:items-start">
                       {/* Grid Row */}
                       <div className="grid grid-cols-2 gap-3 w-full md:max-w-none max-w-md">
                          <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 flex flex-col items-center md:items-start justify-center text-center md:text-left">
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Magnitude</p>
                            <p className={`text-2xl font-black ${selectedLog.risk_score > 80 ? 'text-red-500' : 'text-purple-400'}`}>{selectedLog.risk_score}%</p>
                          </div>
                          <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 flex flex-col items-center md:items-start justify-center text-center md:text-left">
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Registry_ID</p>
                            <p className="text-[10px] font-bold text-white truncate w-full uppercase">{selectedLog.hostname}</p>
                          </div>
                       </div>

                       {/* Log Date Card */}
                       <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 w-full md:max-w-none max-w-md flex flex-col items-center md:items-start text-center md:text-left">
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <Clock size={10} /> Date_Logged
                            </p>
                            <p className="text-xs font-bold text-white leading-tight uppercase tracking-tighter">
                              {new Date(selectedLog.timestamp).toLocaleString()}
                            </p>
                       </div>

                       {/* Trace Card */}
                       <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 w-full md:max-w-none max-w-md flex flex-col items-center md:items-start">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Cpu size={12} /> execution_trace
                        </h3>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                          {selectedLog.process_chain?.map((p, i) => (
                            <span key={i} className="text-[9px] bg-white/5 px-2 py-1 rounded border border-white/5 text-slate-300 font-mono">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                     </div>
                   )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const StatTile = ({ label, value, icon, color }) => (
  <div className="min-w-[150px] md:min-w-0 p-4 md:p-6 bg-white/[0.01] border border-white/5 rounded-2xl md:rounded-3xl shadow-xl backdrop-blur-3xl relative overflow-hidden shrink-0">
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <div className="flex items-center gap-2 mb-1">
        <span className={`shrink-0 ${color === 'purple' ? 'text-purple-400' : 'text-red-500'}`}>{icon}</span>
        <p className="font-roboto-condensed text-[8px] md:text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}</p>
    </div>
    <p className={`font-jetbrains text-2xl md:text-4xl font-black tracking-tighter ${color === 'purple' ? 'text-purple-400' : 'text-red-500'}`}>{value}</p>
  </div>
);

export default AnomalyHistory;