import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Activity, Terminal, ChevronRight, Search, XCircle, Cpu, X, 
  ShieldAlert, Fingerprint, Zap, FileCode, Download, Eye, ScrollText, 
  Clock, Link2, Share2, History, ShieldOff, Snowflake, Database, Gauge, Loader2, Ghost, ArrowLeft, Globe, MapPin, Radar,
  Orbit
} from 'lucide-react';

const API_BASE = "http://172.24.16.81:8001";

const AnomalyHistory = () => {
  const [historyData, setHistoryData] = useState({ total_exploited: 0, data: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [fileChanges, setFileChanges] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false); 
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/anomalies/history`);
      const result = await res.json();
      setHistoryData(result);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchGhostData = async (log) => {
    try {
      const res = await fetch(`${API_BASE}/api/fim/${log.hostname}/${log.timestamp}`);
      const data = await res.json();
      setFileChanges(data);
    } catch (err) { console.error(err); }
  };

  const fetchIPGeo = async (command) => {
    setGeoData(null);
    const ipMatch = command.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    if (ipMatch) {
      setGeoLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/ip_geo/${ipMatch[0]}`);
        const data = await res.json();
        setGeoData(data);
      } catch (err) { console.error(err); } finally { setGeoLoading(false); }
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const triggerContainment = async (action, log) => {
    setActionLoading(action);
    try {
      const res = await fetch(`${API_BASE}/client/command/${log.hostname}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: log.process ? parseInt(log.process) : 0, event_id: log.event_id })
      });
      if (res.ok) alert(`${action.toUpperCase()} remediation signal dispatched.`);
    } catch (err) { alert("gRPC Error"); } finally { setActionLoading(null); }
  };

  const getSeverityColor = (riskScore) => {
    if (riskScore >= 90) return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (riskScore >= 75) return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
    return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
  };

  const filteredData = historyData.data.filter(item => 
    item.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 pt-4 relative text-white">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-3">
             <Orbit size={14} className="text-cyan-500 animate-pulse" />
             <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.6em]">A.U.R.O.R.A</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">ANOMALY_HISTORY</h1>
        </motion.div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate('/anomalies')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all text-cyan-400 bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10">
            <ArrowLeft size={14} /> Back to Live
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input type="text" placeholder="Search archives..." className="bg-gray-900/50 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-purple-500 outline-none w-full md:w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatTile label="Archived Exploits" value={historyData.total_exploited} icon={<Database size={20} />} color="purple" />
        <StatTile label="Resolved Criticals" value={historyData.data.filter(a => a.risk_score >= 90).length} icon={<ShieldAlert size={20} />} color="red" />
      </div>

      {/* DATA TABLE */}
      <div className="bg-[#0a0c14]/80 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
        <table className="w-full text-left">
          <thead className="bg-gray-900/20 text-[10px] font-bold uppercase text-gray-500 tracking-widest border-b border-gray-800">
            <tr><th className="px-6 py-4">Historical Source</th><th className="px-6 py-4">Risk Magnitude</th><th className="px-6 py-4">Execution Logic</th><th className="px-6 py-4 text-right">Review</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredData.map((log) => (
              <tr key={log.event_id} className="hover:bg-purple-500/[0.03] cursor-pointer transition-colors" onClick={() => { setSelectedLog(log); setShowRaw(false); fetchGhostData(log); fetchIPGeo(log.command); }}>
                <td className="px-6 py-5">
                  <div className="font-bold text-sm">{log.hostname}</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}</div>
                </td>
                <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-800 h-1.5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${log.risk_score}%` }} className={`h-full ${log.risk_score > 85 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-purple-500'}`} /></div>
                      <span className="text-[10px] font-mono">{log.risk_score}%</span>
                    </div>
                </td>
                <td className="px-6 py-5 font-mono text-[10px] text-gray-400 truncate max-w-[200px]">{log.process_chain?.length > 0 ? log.process_chain.join(' → ') : (log.process || 'SYSTEM')}</td>
                <td className="px-6 py-5 text-right"><ChevronRight size={18} className="text-gray-700 inline-block" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FORENSIC MODAL */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] w-screen h-screen flex items-center justify-center p-4 md:p-8 bg-white/[0.01] backdrop-blur-2xl transition-all">
            <div className="absolute inset-0" onClick={() => setSelectedLog(null)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#0b0f1a] border border-gray-800/80 rounded-[2.5rem] w-full max-w-6xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)] flex flex-col relative z-[160]">
              
              <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-gray-900/80 to-transparent">
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-3xl border shadow-xl ${getSeverityColor(selectedLog.risk_score)}`}><Fingerprint size={28} /></div>
                  <div><h2 className="text-2xl font-bold tracking-tight">Forensic Artifact Analysis</h2><p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em] mt-1 opacity-70">ID: {selectedLog.event_id}</p></div>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setShowRaw(true)} className="p-3 bg-purple-500/10 hover:bg-purple-500/20 rounded-full text-purple-400 border border-purple-500/30 transition-all"><FileCode size={20} /></button>
                   <button onClick={() => setSelectedLog(null)} className="p-3 bg-white/10 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-white transition-all"><X size={24} /></button>
                </div>
              </div>

              <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1 max-h-[75vh]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* RISK BREAKDOWN */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-purple-500 tracking-[0.25em] flex items-center gap-2"><Gauge size={14} /> Risk Analysis</h3>
                    <div className="bg-gray-900/40 p-6 rounded-[2rem] border border-gray-800 min-h-[180px] space-y-3 shadow-inner">
                       <ScoreLine label="Past Threat Match" score="+40" active={selectedLog.risk_score >= 80} />
                       <ScoreLine label="Suspicious Path" score="+30" active={selectedLog.command?.includes('/tmp')} />
                       <ScoreLine label="Process Reputation" score="+24" active={selectedLog.process === 'Unknown'} />
                       <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Score:</span>
                          <span className="text-xl font-mono font-black">{selectedLog.risk_score}%</span>
                       </div>
                    </div>
                  </div>

                  {/* INFECTION PATHWAY (WITH FIXES) */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-purple-500 tracking-[0.25em] flex items-center gap-2"><Link2 size={14} /> Infection Pathway</h3>
                    <div className="bg-gray-900/40 rounded-[2rem] border border-gray-800 h-[180px] relative overflow-hidden flex items-center justify-center shadow-inner">
                       <svg width="100%" height="100%" viewBox="0 0 200 120" className="absolute top-0 left-0">
                          {/* Connections behind nodes */}
                          {selectedLog.similar_attacks && [...new Set(selectedLog.similar_attacks)].map((host, i, arr) => {
                            const angle = (i * (360 / arr.length)) * (Math.PI / 180);
                            const x = 100 + Math.cos(angle) * 70;
                            const y = 60 + Math.sin(angle) * 45;
                            return <motion.line key={`ln-${i}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="100" y1="60" x2={x} y2={y} stroke="rgba(168, 85, 247, 0.3)" strokeWidth="0.5" strokeDasharray="2" />;
                          })}
                          {/* Nodes */}
                          <circle cx="100" cy="60" r="7" className="fill-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                          <text x="100" y="78" textAnchor="middle" fill="white" fontSize="6" fontWeight="black" className="uppercase tracking-widest">{selectedLog.hostname}</text>
                          {selectedLog.similar_attacks && [...new Set(selectedLog.similar_attacks)].map((host, i, arr) => {
                            const angle = (i * (360 / arr.length)) * (Math.PI / 180);
                            const x = 100 + Math.cos(angle) * 70;
                            const y = 60 + Math.sin(angle) * 45;
                            return (
                              <g key={`host-${i}`}>
                                <circle cx={x} cy={y} r="3.5" className="fill-gray-700 stroke-purple-400/60" />
                                <text x={x} y={y + 10} textAnchor="middle" fill="#a78bfa" fontSize="5" fontWeight="black" className="uppercase">{host}</text>
                              </g>
                            );
                          })}
                       </svg>
                       {(!selectedLog.similar_attacks || selectedLog.similar_attacks.length === 0) && (
                         <text x="100" y="110" textAnchor="middle" fill="#4b5563" fontSize="6" fontWeight="black" className="uppercase tracking-[0.3em] opacity-40">Isolated Incident</text>
                       )}
                    </div>
                  </div>

                  {/* THREAT ORIGIN RADAR */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-red-500 tracking-[0.25em] flex items-center gap-2"><Globe size={14} /> Threat Origin Radar</h3>
                    <div className="bg-gray-900/40 rounded-[2rem] border border-gray-800 h-[180px] relative overflow-hidden flex flex-col items-center justify-center shadow-inner group">
                       {geoLoading ? <Loader2 className="animate-spin text-red-500" size={20} /> : geoData ? (
                         <div className="text-center space-y-2 p-4 z-10">
                            <MapPin size={24} className="text-red-500 animate-bounce mx-auto" />
                            <p className="font-black uppercase text-[10px] tracking-widest">{geoData.city}, {geoData.country}</p>
                            <p className="text-[8px] text-gray-500 font-mono">{geoData.isp}</p>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center gap-2 opacity-30">
                            <Globe size={32} className="text-gray-800" />
                            <p className="text-[8px] font-black uppercase tracking-widest">Local Artifact</p>
                         </div>
                       )}
                       <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />
                    </div>
                  </div>
                </div>

                {/* GHOST MODE & TIMELINE */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-gray-800/50">
                   <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-orange-500 tracking-[0.25em] flex items-center gap-2"><Ghost size={14}/> Ghost Mode Analysis</h3>
                      <div className="bg-black/40 rounded-2xl border border-gray-800 p-4 h-[120px] overflow-y-auto custom-scrollbar space-y-2">
                        {fileChanges.length > 0 ? fileChanges.map((f, i) => (
                          <div key={i} className="flex justify-between items-center text-[9px] font-mono p-2 bg-gray-900/50 rounded-lg border border-gray-800">
                             <span className="text-gray-400 truncate max-w-[150px]">{f.path}</span>
                             <span className="text-orange-400/70">{new Date(f.time).toLocaleTimeString()}</span>
                          </div>
                        )) : <div className="text-center py-8 text-[10px] uppercase font-black tracking-widest opacity-20 italic">No File Activity</div>}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.25em] flex items-center gap-2"><History size={14}/> Incident Timeline</h3>
                      <div className="bg-black/40 p-6 rounded-2xl border border-gray-800 flex gap-4 overflow-x-auto shadow-inner h-[120px]">
                        <TimelineNode label="Log" time="-60s" sub="SSH Uplink" color="green" />
                        <TimelineNode label="Risk" time="0s" sub={selectedLog.process} color="red" active />
                        {selectedLog.process_chain?.slice(0, 2).map((p, i) => (
                           <TimelineNode key={i} label="Exec" time={`+${(i+1)*2}s`} sub={p} color="cyan" />
                        ))}
                      </div>
                   </div>
                </div>

              </div>

              {/* CONTAINMENT BAR */}
              <div className="p-8 border-t border-gray-800 bg-gray-900/40 flex justify-between items-center gap-4">
                 <h3 className="text-[10px] font-black uppercase text-red-500 tracking-[0.25em] flex items-center gap-2 shrink-0"><ShieldAlert size={14} /> Containment Suite</h3>
                 <div className="flex gap-3 flex-1 justify-end">
                    <RemediationBtn label="Isolate Host" icon={<ShieldOff size={14}/>} onClick={() => triggerContainment('isolate_host', selectedLog)} loading={actionLoading === 'isolate_host'} color="red" />
                    <RemediationBtn label="Freeze PID" icon={<Snowflake size={14}/>} onClick={() => triggerContainment('kill_process', selectedLog)} loading={actionLoading === 'kill_process'} color="orange" />
                 </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEW: RAW JSON MODAL OVERLAY */}
      <AnimatePresence>
        {showRaw && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/90 backdrop-blur-md">
            <div className="bg-[#04060b] border border-gray-800 rounded-[2.5rem] w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
               <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/20">
                  <h3 className="text-[10px] font-black uppercase text-purple-500 tracking-[0.3em] flex items-center gap-2"><FileCode size={16} /> Artifact Payload JSON</h3>
                  <button onClick={() => setShowRaw(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all"><X size={20} /></button>
               </div>
               <div className="p-8 overflow-y-auto custom-scrollbar font-mono text-[11px] leading-relaxed">
                  <pre className="text-purple-300/80">{JSON.stringify(selectedLog, null, 2)}</pre>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Reusable Components
const ScoreLine = ({ label, score, active }) => (
  <div className={`flex justify-between items-center transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-20'}`}>
    <span className="text-gray-300">{label}</span>
    <span className="font-mono text-purple-400 font-bold">{score}</span>
  </div>
);

const RemediationBtn = ({ label, icon, onClick, loading, color }) => (
  <button onClick={onClick} disabled={loading} className={`flex items-center gap-3 px-6 py-3 rounded-2xl border bg-gray-800/20 border-gray-800 hover:border-${color}-500/50 group disabled:opacity-50 transition-all shadow-md`}>
    <span className={`text-gray-500 group-hover:text-${color}-400`}>{loading ? <Loader2 className="animate-spin" size={14}/> : icon}</span>
    <span className="text-[10px] font-black text-gray-300 group-hover:text-white uppercase tracking-widest">{label}</span>
    <div className={`w-1 h-1 rounded-full bg-gray-700 group-hover:bg-${color}-500 transition-all`}></div>
  </button>
);

const TimelineNode = ({ label, time, sub, color, active }) => (
  <div className="flex flex-col items-center min-w-[90px]">
    <div className={`w-3 h-3 rounded-full mb-2 shadow-lg ${active ? 'bg-red-500 animate-pulse' : `bg-${color}-500/30 border border-${color}-500/20`}`} />
    <span className="text-[10px] font-black uppercase mb-1 tracking-tighter">{label}</span>
    <span className="text-[8px] font-mono text-gray-500 mb-1">{time}</span>
    <div className="px-2 py-1 bg-gray-950 border border-gray-800 rounded-lg text-[8px] text-gray-400 font-mono truncate max-w-[80px]">{sub}</div>
  </div>
);

const StatTile = ({ label, value, icon, color }) => (
  <div className={`bg-gray-900/30 border border-gray-800 p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl backdrop-blur-md transition-all hover:bg-gray-900/40`}>
    <div>
      <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{label}</p>
      <p className="text-4xl font-bold">{value}</p>
    </div>
    <div className={`p-5 bg-${color}-500/10 rounded-2xl text-${color}-400 border border-${color}-500/20 shadow-inner`}>{icon}</div>
  </div>
);

export default AnomalyHistory;