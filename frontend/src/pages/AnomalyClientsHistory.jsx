import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { 
  Database, ArrowLeft, Calendar, Clock, Terminal, 
  X, Fingerprint, Activity, ShieldAlert, Zap, Cpu, 
  FileCode, AlertCircle, Target, Server, Code, Binary,
  ChevronRight
} from 'lucide-react';

const API_BASE = "http://172.24.16.81:8001";

const AnomalyClientsHistory = ({ setLoading, setError }) => {
  const { hostname } = useParams();
  const navigate = useNavigate();
  
  // 1. Neural Link: Safe Context Access
  const context = useOutletContext();
  const setHeaderData = context?.setHeaderData;

  const [data, setData] = useState({ total_anomalies: 0, data: [] });
  const [localLoading, setLocalLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showRawLog, setShowRawLog] = useState(false);
  
  const [ghostFiles, setGhostFiles] = useState([]);
  const [ghostLoading, setGhostLoading] = useState(false);

  // 2. Sync Topbar Title on Mount
  useEffect(() => {
    if (setHeaderData) {
      setHeaderData({
        name: `Archive: ${hostname}`,
        desc: "Historical_Forensic_Registry // Vault Access"
      });
    }
  }, [hostname, setHeaderData]);

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
      setError?.("Forensic Archive Link Interrupted: Registry Offline");
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
    } catch (err) { 
      console.error(err); 
    } finally { 
      setGhostLoading(false); 
    }
  };

  const highestRisk = data.data.length > 0 
    ? Math.max(...data.data.map(d => d.risk_score || 0)) 
    : 0;

  return (
    <div className="space-y-8 relative selection:bg-purple-500/30">
      {/* 3. Global CSS and Structure Handled by Layout */}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
           <Database size={16} className="text-purple-500 animate-pulse" />
           <span className="font-roboto-condensed text-[10px] font-black text-purple-400 uppercase tracking-[0.6em]">Vault_Sync_Active</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate(`/clients/${hostname}`)}
            className="font-roboto-condensed flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all text-cyan-400 bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-400 active:scale-95 group shadow-2xl"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
            Return to Node
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatTile label="Archived Events" value={data.total_anomalies} color="purple" />
        <StatTile label="Max Historical Risk" value={`${highestRisk}%`} color="red" />
      </div>

      <div className="space-y-4 cyber-scroll max-h-[65vh] overflow-y-auto pr-2">
        {!localLoading && data.data.map((log) => (
          <motion.div 
            key={log.event_id} 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => { setSelectedLog(log); setShowRawLog(false); fetchGhostData(log); }}
            className="group bg-white/[0.02] border border-white/5 hover:border-purple-500/30 p-5 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md transition-all relative overflow-hidden cursor-pointer shadow-xl"
          >
              <div className="flex items-center gap-6 flex-1 min-w-0 w-full">
                 <div className={`p-4 rounded-2xl border shrink-0 ${log.risk_score > 80 ? 'border-red-500/30 bg-red-500/5 text-red-500 shadow-lg' : 'border-purple-500/30 bg-purple-500/5 text-purple-400'}`}>
                    <Fingerprint size={24} />
                 </div>
                 <div className="min-w-0 flex-1">
                    <h4 className="font-inter text-xl font-black tracking-tight uppercase group-hover:text-purple-400 transition-colors truncate">
                      {log.process || 'ARCHIVED_BINARY'}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 opacity-60 font-roboto-condensed">
                        <div className="flex items-center gap-1.5"><Calendar size={10} /><span className="text-[9px] uppercase">{new Date(log.timestamp).toLocaleDateString()}</span></div>
                        <div className="flex items-center gap-1.5 border-l border-white/10 pl-4"><Clock size={10} /><span className="text-[9px] uppercase">{new Date(log.timestamp).toLocaleTimeString()}</span></div>
                    </div>
                    <p className="font-jetbrains text-[10px] text-gray-600 mt-2 truncate uppercase tracking-tight">{log.summary || 'Historical deviation event'}</p>
                 </div>
              </div>

              <div className="flex items-center gap-8 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                 <div className="text-right">
                    <p className="font-roboto-condensed text-[8px] font-black text-gray-600 uppercase mb-1 tracking-widest">Risk_Magnitude</p>
                    <div className="flex items-center gap-3">
                        <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${log.risk_score > 80 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-purple-500 shadow-[0_0_8px_#a855f7]'}`} style={{ width: `${log.risk_score}%` }} />
                        </div>
                        <span className={`font-jetbrains text-xs font-black ${log.risk_score > 80 ? 'text-red-400' : 'text-purple-400'}`}>{log.risk_score}%</span>
                    </div>
                 </div>
                 <ChevronRight size={20} className="text-gray-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
              </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedLog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => setSelectedLog(null)} />
            <motion.div initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }}
              className="bg-[#05070a] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col relative z-[260] shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
            >
              <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02]">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`p-4 rounded-2xl border-2 shadow-xl backdrop-blur-md shrink-0 ${selectedLog.risk_score > 80 ? "border-red-500/50 text-red-500 bg-red-500/5" : "border-purple-500/50 text-purple-400 bg-purple-500/5"}`}>
                    <Fingerprint size={24} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-inter text-xl font-black uppercase tracking-tight text-white truncate">{selectedLog.process}</h2>
                    <p className="font-jetbrains text-[8px] text-gray-400 uppercase tracking-widest mt-0.5 truncate">Sequence: {selectedLog.event_id?.slice(0, 18)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button onClick={() => setShowRawLog(!showRawLog)} className={`font-roboto-condensed flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all backdrop-blur-md ${showRawLog ? "bg-purple-500 text-white border-purple-400" : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"}`}>
                    <Code size={12} /> {showRawLog ? "HUD View" : "Raw Log"}
                  </button>
                  <button onClick={() => setSelectedLog(null)} className="p-2.5 bg-white/5 hover:bg-red-500/20 rounded-full text-gray-500 hover:text-white transition-all active:scale-90 border border-white/5 shrink-0"><X size={18} /></button>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-8 overflow-y-auto cyber-scroll flex-1">
                {showRawLog ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-6 font-jetbrains text-[11px] leading-relaxed overflow-hidden h-full min-h-[400px]">
                    <pre className="text-purple-300/80 whitespace-pre-wrap overflow-x-auto cyber-scroll h-full">{JSON.stringify(selectedLog, null, 2)}</pre>
                  </motion.div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden">
                      <div className="md:col-span-4 bg-white/[0.03] border border-white/5 p-8 rounded-3xl flex flex-col justify-center min-h-[160px] shadow-inner">
                        <h3 className="font-roboto-condensed text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4 flex items-center gap-2"><Activity size={12} /> Risk Magnitude</h3>
                        <span className="font-jetbrains text-5xl font-black text-white leading-none">{selectedLog.risk_score}%</span>
                        <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${selectedLog.risk_score > 80 ? "bg-red-500 shadow-[0_0_10px_red]" : "bg-purple-500 shadow-[0_0_10px_#8b5cf6]"}`} style={{ width: `${selectedLog.risk_score}%` }} />
                        </div>
                      </div>

                      <div className="md:col-span-8 bg-white/[0.03] border border-white/5 p-8 rounded-3xl min-h-[160px] overflow-hidden flex flex-col">
                        <h3 className="font-roboto-condensed text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4 flex items-center gap-2"><ShieldAlert size={12} /> Execution_Chain</h3>
                        <div className="flex items-center gap-3 overflow-x-auto pb-4 cyber-scroll mt-auto min-h-[80px]">
                          {selectedLog.process_chain?.map((proc, idx) => (
                            <React.Fragment key={idx}>
                              <div className="flex flex-col items-center gap-1 shrink-0">
                                <div className={`p-3 rounded-xl border backdrop-blur-sm ${idx === selectedLog.process_chain.length - 1 ? "border-red-500 bg-red-500/10 text-red-500 animate-pulse" : "border-white/10 bg-white/5 text-gray-500"}`}><Cpu size={16} /></div>
                                <span className="font-jetbrains text-[9px] uppercase text-gray-300 tracking-tighter">{proc}</span>
                              </div>
                              {idx < selectedLog.process_chain.length - 1 && (
                                <div className="flex items-center self-start pt-5 shrink-0">
                                   <div className="w-6 h-[1px] bg-white/10 border-t border-dashed" />
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden">
                      <div className="md:col-span-7 space-y-3 min-w-0">
                        <div className="flex items-center justify-between px-1 font-roboto-condensed">
                          <h3 className="text-[10px] font-black uppercase text-purple-400 tracking-[0.3em] flex items-center gap-2"><Zap size={14} className="animate-pulse" /> Historical_FIM</h3>
                          <span className="text-[8px] text-gray-500 uppercase bg-white/5 px-2 py-0.5 rounded">Temporal Scan ±5m</span>
                        </div>
                        <div className="bg-black/20 border border-white/10 rounded-[2rem] p-5 shadow-inner">
                          <div className="space-y-3 max-h-[220px] overflow-y-auto cyber-scroll pr-2">
                            {ghostLoading ? <div className="font-roboto-condensed p-10 text-center text-[9px] font-black uppercase text-purple-500 animate-pulse">Scanning Archive...</div> : ghostFiles.length > 0 ? ghostFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.03] border border-transparent hover:border-white/10 rounded-xl transition-all group min-w-0">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <FileCode size={14} className="text-gray-500" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-jetbrains text-[10px] font-bold text-gray-200 group-hover:text-purple-400 truncate break-all uppercase tracking-tight">{file.path}</p>
                                    <p className="font-roboto-condensed text-[7px] text-gray-500 uppercase tracking-widest opacity-60">{new Date(file.time).toLocaleTimeString()}</p>
                                  </div>
                                </div>
                                <AlertCircle size={12} className="text-gray-600 shrink-0 ml-2" />
                              </div>
                            )) : <div className="font-jetbrains p-10 text-center text-gray-600 text-[9px] uppercase opacity-40">No concurrent file modifications</div>}
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-5 space-y-3 min-w-0">
                        <h3 className="font-roboto-condensed text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] flex items-center gap-2"><Server size={14} /> Global Patterns</h3>
                        <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 p-5 rounded-[2rem] h-full flex flex-col shadow-inner">
                          <div className="space-y-2 max-h-[220px] overflow-y-auto cyber-scroll pr-2 flex-1 font-jetbrains">
                            {selectedLog.similar_attacks?.length > 0 ? selectedLog.similar_attacks.map((host, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl group hover:border-purple-400 transition-all backdrop-blur-sm shrink-0">
                                <Server size={12} className="text-purple-400 shrink-0" />
                                <p className="text-[10px] font-black uppercase text-gray-200 truncate">{host}</p>
                              </div>
                            )) : <div className="p-10 text-center text-gray-600 text-[8px] uppercase opacity-40">Static threat profile</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatTile = ({ label, value, color }) => (
  <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] shadow-xl backdrop-blur-md border-b-4 transition-all hover:bg-white/[0.03]" style={{ borderColor: color === 'purple' ? '#8b5cf6' : '#ef4444' }}>
    <div className="flex items-center gap-3 mb-3">
        <div className={`h-2 w-2 rounded-full ${color === 'purple' ? 'bg-purple-500 shadow-[0_0_8px_#8b5cf6]' : 'bg-red-500 shadow-[0_0_8px_red]'}`} />
        <p className="font-roboto-condensed text-[9px] font-black uppercase text-gray-400 tracking-[0.3em]">{label}</p>
    </div>
    <p className={`font-jetbrains text-5xl font-black tracking-tighter ${color === 'purple' ? 'text-purple-400' : 'text-red-500'}`}>{value}</p>
  </div>
);

export default AnomalyClientsHistory;