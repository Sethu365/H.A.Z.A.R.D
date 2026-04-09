import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Database, ArrowLeft, Calendar, Clock, Terminal, 
  X, Fingerprint, Activity, ShieldAlert, Zap, Cpu, 
  FileCode, AlertCircle, Target, Server, Code, Binary,
  ChevronRight, Orbit
} from 'lucide-react';

const API_BASE = "http://172.24.16.81:8001";

const AnomalyClientsHistory = ({ setLoading, setError }) => {
  const { hostname } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ total_anomalies: 0, data: [] });
  const [localLoading, setLocalLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showRawLog, setShowRawLog] = useState(false);
  
  const [ghostFiles, setGhostFiles] = useState([]);
  const [ghostLoading, setGhostLoading] = useState(false);

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

  const fetchGhostData = async (log) => {
    setGhostLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/fim/${hostname}/${log.timestamp}`);
      const result = await res.json();
      setGhostFiles(result.data || []);
    } catch (err) { console.error(err); } finally { setGhostLoading(false); }
  };

  const highestRisk = data.data.length > 0 
    ? Math.max(...data.data.map(d => d.risk_score)) 
    : 0;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-inter p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6 selection:bg-purple-500/30">
        
        {/* INTEGRATED HEADER: Tighter density native design */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <button 
      onClick={() => navigate(-1)} 
      className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
    >
      <ArrowLeft size={18} />
    </button>
              <Database size={18} className="text-purple-500 animate-pulse" />
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase ">
                Vault: {hostname}
              </h1>
            </div>
            <p className="font-roboto-condensed text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">
              Historical_Forensic_Registry // Archive_Access
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/clients/${hostname}`)}
              className="font-roboto-condensed flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500/20 transition-all"
            >
              <ArrowLeft size={14} />
              Return to Node
            </button>
          </div>
        </header>

        {/* STAT TILES: standardized scale */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatTile label="Archived Events" value={data.total_anomalies} color="purple" />
          <StatTile label="Max Historical Risk" value={`${highestRisk}%`} color="red" />
        </div>

        {/* FEED LIST: Compact rows */}
        <div className="space-y-2 cyber-scroll max-h-[70vh] overflow-y-auto pr-2">
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
                onClick={() => { setSelectedLog(log); setShowRawLog(false); fetchGhostData(log); }}
                className="group bg-white/[0.02] border border-white/5 hover:border-purple-500/30 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md transition-all cursor-pointer shadow-xl"
              >
                <div className="flex items-center gap-5 flex-1 min-w-0 w-full">
                   <div className={`p-3 rounded-xl border shrink-0 ${log.risk_score > 80 ? 'border-red-500/30 bg-red-500/5 text-red-500' : 'border-purple-500/30 bg-purple-500/5 text-purple-400'}`}>
                      <Fingerprint size={20} />
                   </div>
                   <div className="min-w-0 flex-1">
                      <h4 className="text-base font-black text-white uppercase tracking-tight group-hover:text-purple-400 transition-colors truncate">
                        {log.process || 'ARCHIVED_BINARY'}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 opacity-50">
                        <span className="font-jetbrains text-[9px] uppercase tracking-tight text-slate-400 truncate max-w-[400px]">
                           {log.summary || 'Deviation recorded'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 opacity-40 font-roboto-condensed">
                          <div className="flex items-center gap-1.5"><Calendar size={10} /><span className="text-[9px] uppercase">{new Date(log.timestamp).toLocaleDateString()}</span></div>
                          <div className="flex items-center gap-1.5 border-l border-white/10 pl-4"><Clock size={10} /><span className="text-[9px] uppercase">{new Date(log.timestamp).toLocaleTimeString()}</span></div>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                   <div className="text-right hidden sm:block">
                      <p className="text-[8px] font-black text-slate-600 uppercase mb-1 tracking-widest">Magnitude</p>
                      <div className="flex items-center gap-3">
                          <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full ${log.risk_score > 80 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${log.risk_score}%` }} />
                          </div>
                          <span className={`text-[11px] font-black font-jetbrains ${log.risk_score > 80 ? 'text-red-400' : 'text-purple-400'}`}>{log.risk_score}%</span>
                      </div>
                   </div>
                   <ChevronRight size={18} className="text-slate-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
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
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl border ${selectedLog.risk_score > 80 ? "border-red-500/50 text-red-500" : "border-purple-500/50 text-purple-400"}`}>
                      <Fingerprint size={20} />
                    </div>
                    <h2 className="text-lg font-black uppercase text-white truncate">{selectedLog.process}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowRawLog(!showRawLog)} className="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
                      {showRawLog ? "UI HUD" : "Forensic Data"}
                    </button>
                    <X className="text-slate-500 hover:text-white cursor-pointer" size={20} onClick={() => setSelectedLog(null)} />
                  </div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto cyber-scroll">
                  {showRawLog ? (
                    <pre className="text-[10px] text-purple-300/80 bg-black/40 p-4 rounded-xl font-mono overflow-x-auto">
                      {JSON.stringify(selectedLog, null, 2)}
                    </pre>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Historical Risk Magnitude</p>
                          <p className="text-4xl font-black text-white">{selectedLog.risk_score}%</p>
                        </div>
                        <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Archive Timestamp</p>
                          <p className="text-lg font-bold text-white">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Cpu size={12} /> Forensic Path</h3>
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
        <div className={`h-2 w-2 rounded-full ${color === 'purple' ? 'bg-purple-500 shadow-[0_0_10px_#a855f7]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
        <p className="font-roboto-condensed text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">{label}</p>
    </div>
    <p className={`font-jetbrains text-4xl font-black tracking-tighter ${color === 'purple' ? 'text-purple-400' : 'text-red-500'}`}>{value}</p>
  </div>
);

export default AnomalyClientsHistory;