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
  const [localLoading, setLocalLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showRawLog, setShowRawLog] = useState(false);
  
  const [ghostFiles, setGhostFiles] = useState([]);
  const [ghostLoading, setGhostLoading] = useState(false);

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
      setLocalLoading(false);
    } catch (err) {
      setLoading?.(false);
      setLocalLoading(false);
      setError?.("Uplink to Client SOC failed");
    }
  }, [hostname, setLoading, setError]);

  const fetchGhostData = async (log) => {
    setGhostLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/fim/${hostname}/${log.timestamp}`);
      const result = await res.json();
      setGhostFiles(result.data || []); 
    } catch (err) {
      console.error("Ghost Mode Fetch Failed:", err);
    } finally {
      setGhostLoading(false);
    }
  };

  useEffect(() => {
    if (hostname) fetchToday();
  }, [hostname, fetchToday]);

  const filteredData = (data.data || []).filter(item => 
    item.process?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-inter p-4 md:p-6">
      {/* WIDER EXPANSIVE WRAPPER */}
      <div className="max-w-[1600px] mx-auto space-y-6 selection:bg-cyan-500/30">
        
        {/* INTEGRATED HEADER: Replaced Topbar with native tighter design */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <button 
      onClick={() => navigate(-1)} 
      className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
    >
      <ArrowLeft size={18} />
    </button>
              <Orbit size={18} className="text-cyan-500 animate-pulse" />
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase ">
                Node: {hostname}
              </h1>
            </div>
            <p className="font-roboto-condensed text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">
              Forensic_Uplink // behavioral_analysis
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/clients/${hostname}/client-anomaly/history`)}
              className="font-roboto-condensed flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-black text-[10px] uppercase tracking-widest hover:bg-purple-500/20 transition-all"
            >
              <History size={14} />
              Archives
            </button>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              <input
                type="text"
                placeholder="Search Buffer..."
                className="font-roboto-condensed bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[11px] outline-none focus:border-cyan-500/50 transition-all w-full md:w-60 uppercase tracking-widest"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* STAT TILES: Scaled down padding/text */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatTile label="Events (24h)" value={data.today_anomalies} color="cyan" />
          <StatTile label="Max Risk Index" value={`${data.data.length > 0 ? Math.max(...data.data.map(d => d.risk_score || 0)) : 0}%`} color="red" />
        </div>

        {/* FEED LIST: Tighter rows */}
        <div className="space-y-2 cyber-scroll max-h-[70vh] overflow-y-auto pr-2">
          {filteredData.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl text-slate-600 text-[11px] uppercase tracking-widest">
              Risks nominal. No behavioural deviations.
            </div>
          ) : (
            filteredData.map((log) => (
              <motion.div 
                key={log.event_id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => { setSelectedLog(log); setShowRawLog(false); fetchGhostData(log); }}
                className="group bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-5 flex-1 min-w-0 w-full">
                   <div className={`p-3 rounded-xl border shrink-0 ${log.risk_score > 80 ? 'border-red-500/30 bg-red-500/5 text-red-500' : 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400'}`}>
                      <Fingerprint size={20} />
                   </div>
                   <div className="min-w-0 flex-1">
                      <h4 className="text-base font-black text-white uppercase tracking-tight group-hover:text-cyan-400 transition-colors truncate">
                        {log.process || 'SYSTEM_CORE'}
                      </h4>
                      <p className="font-jetbrains text-[9px] text-slate-500 truncate uppercase mt-0.5">
                        {log.summary || 'Deviation event recorded'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 opacity-50">
                          <div className="flex items-center gap-1.5">
                            <Clock size={10}/>
                            <span className="font-roboto-condensed text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-jetbrains text-[9px] truncate">
                            <Binary size={10}/>
                            <span className="truncate">{log.process_chain?.[0]}...</span>
                          </div>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                   <div className="text-right hidden sm:block">
                      <p className="text-[8px] font-black text-slate-600 uppercase mb-1 tracking-widest">Risk</p>
                      <div className="flex items-center gap-3">
                          <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
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
        </div>

        {/* DETAIL MODAL: Scaled for density */}
        <AnimatePresence>
          {selectedLog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="absolute inset-0" onClick={() => setSelectedLog(null)} />
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-slate-950 border border-white/10 w-full max-w-4xl max-h-[85vh] rounded-3xl overflow-hidden flex flex-col relative z-[260] shadow-2xl"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl border ${selectedLog.risk_score > 80 ? "border-red-500/50 text-red-500" : "border-cyan-500/50 text-cyan-400"}`}>
                      <Fingerprint size={20} />
                    </div>
                    <h2 className="text-lg font-black uppercase text-white truncate">{selectedLog.process}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowRawLog(!showRawLog)} className="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
                      {showRawLog ? "UI HUD" : "Raw Data"}
                    </button>
                    <X className="text-slate-500 hover:text-white cursor-pointer" size={20} onClick={() => setSelectedLog(null)} />
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 overflow-y-auto cyber-scroll">
                  {showRawLog ? (
                    <pre className="text-[10px] text-cyan-400/80 bg-black/40 p-4 rounded-xl font-mono overflow-x-auto">
                      {JSON.stringify(selectedLog, null, 2)}
                    </pre>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Risk Level</p>
                          <p className="text-4xl font-black text-white">{selectedLog.risk_score}%</p>
                        </div>
                        <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Timestamp</p>
                          <p className="text-lg font-bold text-white">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Cpu size={12} /> Exec Path</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedLog.process_chain?.map((p, i) => (
                            <span key={i} className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/5 text-slate-300 font-mono">{p}</span>
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

export default AnomalyClients;