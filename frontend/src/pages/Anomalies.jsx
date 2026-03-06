import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Correct import for navigation
import { useNavigate } from 'react-router-dom'; 
import { 
  AlertTriangle, Activity, Terminal, ChevronRight, Search, XCircle, Cpu, X, 
  ShieldAlert, Fingerprint, Zap, FileCode, Download, Eye, ScrollText, 
  Clock, Link2, Share2, History, ShieldOff, Snowflake, Database, Gauge, Loader2, Ghost, Radar,
  Orbit
} from 'lucide-react';

const API_BASE = "http://172.24.16.81:8001";

const Anomalies = () => {
  const [anomalyData, setAnomalyData] = useState({ total_anomalies: 0, data: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [fileChanges, setFileChanges] = useState([]);
  const [showRaw, setShowRaw] = useState(false); 
  const [actionLoading, setActionLoading] = useState(null);
  
  // Initialize navigate
  const navigate = useNavigate(); 

  const loadData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/anomalies`);
      if (!res.ok) throw new Error(`Server Error: ${res.status}`);
      const result = await res.json();
      setAnomalyData({ total_anomalies: result.total_anomalies || 0, data: result.data || [] });
      setError(null);
    } catch (err) {
      setError("Data Link Interrupted: Check FastAPI Route");
    } finally {
      setLoading(false);
    }
  };

  const fetchGhostData = async (log) => {
    try {
      const res = await fetch(`${API_BASE}/api/fim/${log.hostname}/${log.timestamp}`);
      const data = await res.json();
      setFileChanges(data);
    } catch (err) { console.error("Ghost Mode Error:", err); }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerContainment = async (action, log) => {
    setActionLoading(action);
    try {
      const res = await fetch(`${API_BASE}/client/command/${log.hostname}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: log.process ? parseInt(log.process) : 0, event_id: log.event_id })
      });
      if (res.ok) alert(`${action.toUpperCase()} successful on ${log.hostname}`);
    } catch (err) { alert("gRPC Error: Agent unreachable"); } finally { setActionLoading(null); }
  };

  const getSeverityColor = (riskScore) => {
    if (riskScore >= 90) return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (riskScore >= 75) return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
    return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
  };

  const filteredData = anomalyData.data.filter(item => 
    item.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 pt-4 relative">
      
      {/* HEADER & STATS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-3">
             <Orbit size={14} className="text-cyan-500 animate-pulse" />
             <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.6em]">A.U.R.O.R.A</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">ANOMALY</h1>
        </motion.div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* HISTORY NAVIGATION BUTTON */}
          <button
            onClick={() => navigate('/anomalies/history')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all text-purple-400 bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-400 active:scale-95 group shadow-lg shadow-purple-500/5"
          >
            <History size={14} className="group-hover:rotate-[-45deg] transition-transform duration-300" />
            View Exploited History
          </button>

          {/* SEARCH INPUT */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Filter artifacts..."
              className="bg-gray-900/50 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-cyan-500 transition-all w-full md:w-64 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatTile label="Ingested Anomalies" value={anomalyData.total_anomalies} icon={<Activity size={20} />} color="cyan" />
        <StatTile label="Critical Threats" value={anomalyData.data.filter(a => a.risk_score >= 90).length} icon={<AlertTriangle size={20} />} color="red" />
      </div>

      {/* DATA TABLE */}
      <div className="bg-[#0a0c14]/80 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
        <table className="w-full text-left">
          <thead className="bg-gray-900/20 text-[10px] font-bold uppercase text-gray-500 tracking-widest border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">Event Source</th>
              <th className="px-6 py-4">Risk Magnitude</th>
              <th className="px-6 py-4">Execution Logic</th>
              <th className="px-6 py-4 text-right">Analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredData.map((log) => (
              <tr 
                key={log.event_id} 
                className="hover:bg-cyan-500/[0.03] cursor-pointer group transition-colors" 
                onClick={() => { 
                  setSelectedLog(log); 
                  setShowRaw(false);
                  fetchGhostData(log);
                }}
              >
                <td className="px-6 py-5 text-white font-bold text-sm tracking-tight">{log.hostname}</td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${log.risk_score}%` }} className={`h-full rounded-full ${log.risk_score > 85 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-cyan-500'}`} />
                      </div>
                      <span className={`text-[10px] font-mono font-bold ${log.risk_score > 85 ? 'text-red-400' : 'text-gray-400'}`}>{log.risk_score}%</span>
                    </div>
                </td>
                <td className="px-6 py-5 font-mono text-[10px] text-gray-400 truncate max-w-[200px]">
                  {log.process_chain?.length > 0 ? log.process_chain.join(' → ') : (log.process || 'SYSTEM')}
                </td>
                <td className="px-6 py-5 text-right"><ChevronRight size={18} className="text-gray-700 group-hover:text-cyan-400 inline-block transition-all" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FORENSIC MODAL - FIXED FULL VIEWPORT BLUR */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] w-screen h-screen flex items-center justify-center p-4 md:p-8 bg-white/[0.02] backdrop-blur-2xl transition-all"
          >
            {/* Clickable Backdrop to close */}
            <div className="absolute inset-0" onClick={() => setSelectedLog(null)} />

            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0b0f1a] border border-gray-800/80 rounded-[2.5rem] w-full max-w-6xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)] flex flex-col relative z-[160]"
            >
              {/* MODAL HEADER */}
              <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-gray-900/80 to-transparent">
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-3xl border shadow-xl ${getSeverityColor(selectedLog.risk_score)}`}>
                    <Fingerprint size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Forensic Artifact Analysis</h2>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em] mt-1 opacity-70">ID: {selectedLog.event_id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-3 bg-white/10 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-white transition-all"><X size={24} /></button>
              </div>

              {/* MODAL CONTENT */}
              <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1 max-h-[75vh]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* RISK BREAKDOWN */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-cyan-500 tracking-[0.25em] flex items-center gap-2"><Gauge size={14} /> Risk Analysis</h3>
                    <div className="bg-gray-900/40 p-6 rounded-[2rem] border border-gray-800 min-h-[180px] space-y-3 shadow-inner">
                       <ScoreLine label="Threat Intel Match" score="+40" active={selectedLog.risk_score >= 80} />
                       <ScoreLine label="Suspicious Path" score="+30" active={selectedLog.command?.includes('/tmp')} />
                       <ScoreLine label="Binary Reputation" score="+24" active={selectedLog.process === 'Unknown'} />
                       <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Final Risk:</span>
                          <span className="text-xl font-mono font-black text-white">{selectedLog.risk_score}%</span>
                       </div>
                    </div>
                  </div>

                  {/* LATERAL MOVEMENT (SVG) */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-purple-500 tracking-[0.25em] flex items-center gap-2"><Link2 size={14} /> Lateral Movement Path</h3>
                    <div className="bg-gray-900/40 rounded-[2rem] border border-gray-800 h-[180px] relative overflow-hidden flex items-center justify-center">
                       <svg width="100%" height="100%" viewBox="0 0 200 120" className="absolute">
                          <circle cx="100" cy="60" r="8" className="fill-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                          {[...new Set(selectedLog.similar_attacks || [])].map((host, i) => {
                            const angle = (i * (360 / Math.max(1, selectedLog.similar_attacks.length))) * (Math.PI / 180);
                            const x = 100 + Math.cos(angle) * 55;
                            const y = 60 + Math.sin(angle) * 40;
                            return (
                              <g key={i}>
                                <line x1="100" y1="60" x2={x} y2={y} stroke="rgba(239, 68, 68, 0.3)" strokeWidth="0.5" strokeDasharray="2" />
                                <circle cx={x} cy={y} r="4" className="fill-gray-700 stroke-red-400/40" />
                                <text x={x} y={y + 10} textAnchor="middle" fill="#6b7280" fontSize="5" fontWeight="bold">{host}</text>
                              </g>
                            );
                          })}
                       </svg>
                    </div>
                  </div>

                  {/* CONTAINMENT */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-red-500 tracking-[0.25em] flex items-center gap-2"><ShieldAlert size={14} /> Containment Suite</h3>
                    <div className="flex flex-col gap-2">
                       <RemediationBtn label="Isolate Host" icon={<ShieldOff size={14}/>} onClick={() => triggerContainment('isolate_host', selectedLog)} loading={actionLoading === 'isolate_host'} color="red" />
                       <RemediationBtn label="Freeze PID" icon={<Snowflake size={14}/>} onClick={() => triggerContainment('kill_process', selectedLog)} loading={actionLoading === 'kill_process'} color="orange" />
                       <RemediationBtn label="Dump Memory" icon={<Database size={14}/>} onClick={() => triggerContainment('dump_memory', selectedLog)} loading={actionLoading === 'dump_memory'} color="cyan" />
                    </div>
                  </div>
                </div>

                {/* GHOST MODE & TIMELINE */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-gray-800/50">
                   <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-orange-500 tracking-[0.25em] flex items-center gap-2"><Ghost size={14}/> Ghost Mode: File Integrity</h3>
                      <div className="bg-black/40 rounded-2xl border border-gray-800 p-4 h-[160px] overflow-y-auto custom-scrollbar space-y-2 shadow-inner">
                        {fileChanges.length > 0 ? fileChanges.map((f, i) => (
                          <div key={i} className="flex justify-between items-center text-[10px] font-mono p-2 bg-gray-900/50 rounded-lg border border-gray-800">
                             <span className="text-gray-400 truncate max-w-[200px]">{f.path}</span>
                             <span className="text-orange-400/70">{new Date(f.time).toLocaleTimeString()}</span>
                          </div>
                        )) : <div className="text-center py-10 text-gray-600 text-[10px] uppercase font-black tracking-widest opacity-40 italic">No suspicious modifications</div>}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.25em] flex items-center gap-2"><History size={14}/> Incident Timeline</h3>
                      <div className="bg-black/40 p-6 rounded-2xl border border-gray-800 flex gap-4 overflow-x-auto shadow-inner h-[160px]">
                        <TimelineNode label="Log" time="-60s" sub="SSH Uplink" color="green" />
                        <TimelineNode label="Risk" time="0s" sub={selectedLog.process} color="red" active />
                        {selectedLog.process_chain.slice(0, 2).map((p, i) => (
                           <TimelineNode key={i} label="Exec" time={`+${(i+1)*2}s`} sub={p} color="cyan" />
                        ))}
                      </div>
                   </div>
                </div>

                {/* EXECUTION DETAILS */}
                <div className="space-y-4 pt-6 border-t border-gray-800/50">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.25em]">Execution Context</h3>
                    <button onClick={() => setShowRaw(!showRaw)} className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${showRaw ? 'bg-cyan-500 text-black border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}`}>
                        {showRaw ? <Eye size={12} /> : <FileCode size={12} />}
                        {showRaw ? 'Analysis' : 'Raw Log'}
                    </button>
                  </div>
                  <div className="bg-[#04060b] p-8 rounded-[2rem] font-mono text-xs border border-gray-800/50 shadow-inner group overflow-hidden">
                    <AnimatePresence mode="wait">
                      {showRaw ? (
                        <motion.pre key="raw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-cyan-400/90 whitespace-pre overflow-x-auto leading-loose custom-scrollbar">
                          {JSON.stringify(selectedLog, null, 2)}
                        </motion.pre>
                      ) : (
                        <motion.div key="formatted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 relative z-10">
                          <div className="flex gap-4 items-center">
                             <span className="text-green-500/30 uppercase w-24 shrink-0 font-black tracking-widest">Binary:</span>
                             <span className="text-green-400 font-bold tracking-tight">{selectedLog.process || "Unknown"}</span>
                          </div>
                          <div className="flex gap-4 items-start pt-4 border-t border-white/5">
                             <span className="text-cyan-500/30 uppercase w-24 shrink-0 font-black tracking-widest">Command:</span>
                             <span className="text-cyan-200/90 break-all leading-relaxed font-medium tracking-tight">{selectedLog.command || "N/A"}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-components
const ScoreLine = ({ label, score, active }) => (
  <div className={`flex justify-between items-center text-xs transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-20'}`}>
    <span className="text-gray-300 font-medium">{label}</span>
    <span className="font-mono text-cyan-400 font-bold">{score}</span>
  </div>
);

const RemediationBtn = ({ label, icon, onClick, loading, color }) => (
  <button onClick={onClick} disabled={loading} className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl border bg-gray-800/20 border-gray-800 hover:border-${color}-500/50 group disabled:opacity-50 transition-all shadow-md`}>
    <div className="flex items-center gap-3">
      <span className={`text-gray-500 group-hover:text-${color}-400`}>{loading ? <Loader2 className="animate-spin" size={14}/> : icon}</span>
      <span className="text-[10px] font-black text-gray-300 group-hover:text-white uppercase tracking-widest">{label}</span>
    </div>
    <div className={`w-1 h-1 rounded-full bg-gray-700 group-hover:bg-${color}-500 transition-all shadow-[0_0_8px_rgba(0,0,0,0)] group-hover:shadow-${color}-500/60`}></div>
  </button>
);

const TimelineNode = ({ label, time, sub, color, active }) => (
  <div className="flex flex-col items-center min-w-[100px]">
    <div className={`w-3 h-3 rounded-full mb-3 shadow-lg ${active ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse' : `bg-${color}-500/30 border border-${color}-500/20`}`} />
    <span className="text-[10px] font-black uppercase text-white mb-1 tracking-tighter">{label}</span>
    <span className="text-[9px] font-mono text-gray-500 mb-2">{time}</span>
    <div className="px-2 py-1 bg-gray-950 border border-gray-800 rounded-lg text-[8px] text-gray-400 font-mono truncate max-w-[90px]">{sub}</div>
  </div>
);

const StatTile = ({ label, value, icon, color }) => (
  <div className="bg-gray-900/30 border border-gray-800 p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl backdrop-blur-md transition-all hover:bg-gray-900/40">
    <div>
      <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{label}</p>
      <p className="text-4xl font-bold text-white tracking-tighter">{value}</p>
    </div>
    <div className={`p-5 bg-${color}-500/10 rounded-2xl text-${color}-400 border border-${color}-500/20 shadow-inner`}>{icon}</div>
  </div>
);

export default Anomalies;