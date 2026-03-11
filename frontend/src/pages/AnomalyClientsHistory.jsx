import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Database, ArrowLeft, Calendar, Filter, Clock, Terminal, 
  X, Fingerprint, Activity, ShieldAlert, Zap, Cpu, 
  Radar, ShieldX, FileCode, AlertCircle, Target, Server, Code
} from 'lucide-react';

const API_BASE = "http://172.24.16.81:8001";

const AnomalyClientsHistory = () => {
  const { hostname } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ total_anomalies: 0, data: [] });
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showRawLog, setShowRawLog] = useState(false);
  
  const [ghostFiles, setGhostFiles] = useState([]);
  const [ghostLoading, setGhostLoading] = useState(false);

  // 1. Fetch main history list
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/anomalies/history/${hostname}`);
        const result = await res.json();
        setData({
          total_anomalies: result.total_anomalies || 0,
          data: result.data || []
        });
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchHistory();
  }, [hostname]);

  // 2. Fetch Ghost Mode (FIM) Data for the selected artifact
  useEffect(() => {
    const fetchGhostData = async () => {
      if (!selectedLog) return;
      setGhostLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/fim/${hostname}/${selectedLog.timestamp}`);
        const result = await res.json();
        // Updated to result.data to match your JSON structure
        setGhostFiles(result.data || []);
      } catch (err) { console.error(err); } finally { setGhostLoading(false); }
    };
    fetchGhostData();
  }, [selectedLog, hostname]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 pt-4 text-white font-sans selection:bg-purple-500/30">
      <style>{`
        .cyber-scroll::-webkit-scrollbar { width: 4px; }
        .cyber-scroll::-webkit-scrollbar-track { background: transparent; }
        .cyber-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 20px; }
        .cyber-scroll::-webkit-scrollbar-thumb:hover { background: #8b5cf6; }
      `}</style>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-4">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors text-[10px] font-black uppercase tracking-widest">
            <ArrowLeft size={14}/> Back to Live Telemetry
          </button>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">Forensic_Archives : {hostname}</h1>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">Vault_Size: {data.total_anomalies} Nodes</span>
        </div>
        <Filter className="text-gray-500 hover:text-white cursor-pointer transition-colors" size={20} />
      </div>

      {/* LIST SECTION */}
      <div className="grid grid-cols-1 gap-4 cyber-scroll max-h-[65vh] overflow-y-auto pr-2">
        {!loading && data.data.map((log) => (
          <motion.div 
            key={log.event_id} 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => { setSelectedLog(log); setShowRawLog(false); }}
            className="bg-gray-900/40 border border-white/5 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between group transition-all hover:bg-gray-900/60 shadow-2xl cursor-pointer hover:border-purple-500/30"
          >
              <div className="flex items-center gap-6 flex-1">
                 <div className={`p-4 rounded-2xl border shrink-0 ${log.risk_score > 90 ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-lg' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'}`}>
                    <Database size={24} />
                 </div>
                 <div className="min-w-0 flex-1">
                    <h4 className="text-lg font-black tracking-tight uppercase group-hover:text-purple-400 transition-colors truncate">{log.process}</h4>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 opacity-40"><Calendar size={12} /><span className="text-[9px] font-mono uppercase">{new Date(log.timestamp).toLocaleDateString()}</span></div>
                        <div className="flex items-center gap-1.5 opacity-40 border-l border-white/10 pl-4"><Clock size={12} /><span className="text-[9px] font-mono uppercase">{new Date(log.timestamp).toLocaleTimeString()}</span></div>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-2 italic truncate">{log.summary || 'Historical log recorded'}</p>
                 </div>
              </div>
              <div className="flex items-center gap-10 mt-4 md:mt-0 justify-end">
                 <div className="text-right">
                    <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Archive_Risk</p>
                    <span className={`text-xl font-black font-mono tracking-tighter ${log.risk_score > 80 ? 'text-red-500' : 'text-purple-400'}`}>{log.risk_score}%</span>
                 </div>
                 <div className="p-3 bg-white/5 rounded-xl text-gray-700 group-hover:text-purple-400 transition-all border border-transparent group-hover:border-purple-500/20">
                    <Terminal size={20} />
                 </div>
              </div>
          </motion.div>
        ))}
      </div>

      {/* FORENSIC MODAL */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => setSelectedLog(null)} />
            <motion.div 
              initial={{ scale: 0.98, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.98, opacity: 0, y: 10 }}
              className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col relative z-[260] shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
            >
              
              {/* MODAL HEADER */}
              <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02]">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`p-4 rounded-2xl border-2 shadow-xl backdrop-blur-md shrink-0 ${selectedLog.risk_score > 80 ? "border-red-500/50 text-red-500 bg-red-500/5" : "border-cyan-500/50 text-cyan-400 bg-cyan-500/5"}`}>
                    <Fingerprint size={24} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-black uppercase tracking-tight text-white truncate">Forensic Analysis</h2>
                    <p className="text-[8px] font-mono text-gray-400 uppercase tracking-widest mt-0.5 truncate italic">Sequence: {selectedLog.event_id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button onClick={() => setShowRawLog(!showRawLog)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all backdrop-blur-md ${showRawLog ? "bg-purple-500 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"}`}>
                    <Code size={12} /> {showRawLog ? "HUD View" : "Raw Log"}
                  </button>
                  <button onClick={() => setSelectedLog(null)} className="p-2.5 bg-white/5 hover:bg-red-500/20 rounded-full text-gray-500 hover:text-white transition-all active:scale-90 border border-white/5 shrink-0"><X size={18} /></button>
                </div>
              </div>

              {/* MODAL BODY */}
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto cyber-scroll flex-1">
                {showRawLog ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-6 font-mono text-[11px] leading-relaxed overflow-hidden h-full min-h-[400px]">
                    <pre className="text-cyan-400/80 whitespace-pre-wrap overflow-x-auto cyber-scroll h-full">
                      {JSON.stringify(selectedLog, null, 2)}
                    </pre>
                  </motion.div>
                ) : (
                  <>
                    {/* TOP ROW: RISK & PATHWAY */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden">
                      <div className="md:col-span-4 bg-white/[0.03] backdrop-blur-md border border-white/5 p-6 rounded-3xl flex flex-col justify-center min-h-[160px] shadow-inner">
                        <h3 className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4 flex items-center gap-2"><Activity size={12} /> Risk Magnitude</h3>
                        <span className="text-5xl font-black text-white leading-none">{selectedLog.risk_score}%</span>
                        <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${selectedLog.risk_score > 80 ? "bg-red-500 shadow-[0_0_10px_red]" : "bg-cyan-500 shadow-[0_0_10px_cyan]"}`} style={{ width: `${selectedLog.risk_score}%` }} />
                        </div>
                      </div>

                      <div className="md:col-span-8 bg-white/[0.03] backdrop-blur-md border border-white/5 p-6 rounded-3xl min-h-[160px] overflow-hidden flex flex-col">
                        <h3 className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4 flex items-center gap-2"><ShieldAlert size={12} /> Execution_Chain</h3>
                        <div className="flex items-center gap-3 overflow-x-auto pb-4 cyber-scroll mt-auto">
                          {selectedLog.process_chain?.map((proc, idx) => (
                            <React.Fragment key={idx}>
                              <div className="flex flex-col items-center gap-1 shrink-0">
                                <div className={`p-3 rounded-xl border backdrop-blur-sm ${idx === selectedLog.process_chain.length - 1 ? "border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_10px_red]" : "border-white/10 bg-white/5 text-gray-400"}`}><Cpu size={16} /></div>
                                <span className="text-[9px] font-mono uppercase text-gray-300 tracking-tighter">{proc}</span>
                              </div>
                              {idx < selectedLog.process_chain.length - 1 && <div className="w-6 h-[1px] bg-white/10 shrink-0 mt-[-16px]" />}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* MIDDLE ROW: GHOST MODE & CORRELATION */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden">
                      {/* GHOST MODE (FIM) */}
                      <div className="md:col-span-7 space-y-3 min-w-0">
                        <div className="flex items-center justify-between px-1">
                          <h3 className="text-[10px] font-black uppercase text-cyan-400 tracking-[0.3em] flex items-center gap-2"><Zap size={14} className="animate-pulse" /> Ghost_Scan</h3>
                          <span className="text-[8px] font-mono text-gray-500 italic uppercase bg-white/5 px-2 py-0.5 rounded">±5m temporal scan</span>
                        </div>
                        <div className="bg-black/20 backdrop-blur-md border border-cyan-500/10 rounded-[2rem] p-4 shadow-[inset_0_0_30px_rgba(6,182,212,0.02)]">
                          <div className="space-y-2 max-h-[250px] overflow-y-auto cyber-scroll pr-2">
                            {ghostLoading ? <div className="p-10 text-center text-[9px] font-black text-cyan-500 animate-pulse uppercase">Syncing Registry...</div> : ghostFiles.length > 0 ? ghostFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.03] border border-transparent hover:border-white/10 rounded-xl transition-all group min-w-0">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <FileCode size={14} className="text-gray-500 shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-mono font-bold text-gray-200 group-hover:text-cyan-400 truncate break-all uppercase tracking-tight">{file.path}</p>
                                    <p className="text-[7px] font-mono text-gray-500 uppercase tracking-widest opacity-60">{new Date(file.time).toLocaleTimeString()}</p>
                                  </div>
                                </div>
                                <AlertCircle size={12} className="text-gray-600 shrink-0 ml-2" />
                              </div>
                            )) : <div className="p-10 text-center text-gray-600 font-mono text-[9px] uppercase italic opacity-40">No concurrent system modifications detected</div>}
                          </div>
                        </div>
                      </div>

                      {/* CORRELATED NODES */}
                      <div className="md:col-span-5 space-y-3 min-w-0">
                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] flex items-center gap-2"><Server size={14} /> Correlated Nodes</h3>
                        <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 p-4 rounded-[2rem] h-full flex flex-col">
                          <div className="space-y-2 max-h-[250px] overflow-y-auto cyber-scroll pr-2 flex-1">
                            {selectedLog.similar_attacks?.length > 0 ? selectedLog.similar_attacks.map((host, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl group hover:border-purple-400 transition-all backdrop-blur-sm shrink-0">
                                <Server size={12} className="text-purple-400 shrink-0" />
                                <p className="text-[10px] font-black uppercase text-gray-200 truncate">{host}</p>
                              </div>
                            )) : <div className="p-10 text-center text-gray-600 font-mono text-[8px] uppercase italic opacity-40">Isolation verified // No shared patterns</div>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM ROW: PRIMARY PAYLOADS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-red-500/5 backdrop-blur-md border border-red-500/10 rounded-2xl flex items-center justify-between shadow-xl min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                           <Target size={14} className="text-red-400 shrink-0" />
                           <span className="text-[9px] font-black uppercase text-red-400 tracking-widest truncate">{selectedLog.summary || 'Deviation event recorded'}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-cyan-500/5 backdrop-blur-md border border-cyan-500/10 rounded-2xl flex items-center justify-between shadow-xl min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                           <Terminal size={14} className="text-cyan-400 shrink-0" />
                           <span className="text-[9px] font-mono text-cyan-400 tracking-tight truncate uppercase italic">{selectedLog.command || "N/A"}</span>
                        </div>
                        <span className="text-[7px] font-mono text-gray-600 uppercase shrink-0 hidden sm:block">Artifact</span>
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

export default AnomalyClientsHistory;