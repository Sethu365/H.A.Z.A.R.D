import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; 
import { 
  AlertTriangle, Activity, Terminal, ChevronRight, Search, X, 
  ShieldAlert, Fingerprint, Zap, FileCode, Eye, 
  Clock, Link2, History, ShieldOff, Snowflake, Database, Gauge, Loader2, Ghost, Radar,
  Orbit, Cpu, Server, Target, Code, Binary, Radio, AlertCircle
} from 'lucide-react';
import Topbar from "../components/Topbar"; // 1. Imported Topbar

const API_BASE = "http://172.24.16.81:8001";

const Anomalies = ({ setLoading, setError }) => {
  const [anomalyData, setAnomalyData] = useState({ total_anomalies: 0, data: [] });
  const [localSyncing, setLocalSyncing] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showRawLog, setShowRawLog] = useState(false);
  const [ghostFiles, setGhostFiles] = useState([]);
  const [ghostLoading, setGhostLoading] = useState(false);
  
  const navigate = useNavigate(); 

  const loadData = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setError(null);
    }

    try {
      const res = await fetch(`${API_BASE}/api/anomalies`);
      if (!res.ok) throw new Error(`Neural_Link_Status: ${res.status}`);
      
      const result = await res.json();
      setAnomalyData({ total_anomalies: result.total_anomalies || 0, data: result.data || [] });
      
      if (isInitial) setLoading(false);
      setLocalSyncing(false);
    } catch (err) {
      console.error("SOC Data Link Interrupted");
      if (isInitial) {
        setLoading(false);
        setError("Neural Link Failed: Could not sync with Anomaly Registry.");
      }
    }
  };

  const fetchGhostData = async (log) => {
    setGhostLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/fim/${log.hostname}/${log.timestamp}`);
      const result = await res.json();
      setGhostFiles(result.data || []);
    } catch (err) { 
      console.error("Ghost_Scan Failed:", err); 
    } finally {
      setGhostLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = anomalyData.data.filter(item => 
    item.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.process?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-['Nunito']">
      {/* 2. Added Topbar Component */}
      <Topbar name="Anomalies" desc="Real-time_Threat_Monitoring_Uplink" />

      {/* 3. Added pt-24 to main content to account for fixed Topbar height */}
      <main className="max-w-7xl mx-auto space-y-8 pb-20 px-4 pt-24 relative selection:bg-cyan-500/30">
        <style>{`
          .cyber-scroll::-webkit-scrollbar { width: 4px; }
          .cyber-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 20px; }
          .cyber-scroll::-webkit-scrollbar-thumb:hover { background: #06b6d4; }
          .text-glow { text-shadow: 0 0 15px rgba(255,255,255,0.2); }
        `}</style>
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
               <Orbit size={14} className="text-cyan-500 animate-pulse" />
               <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.6em]">Global_Archives</span>
            </div>

          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/anomalies/history')}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all text-purple-400 bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-400 active:scale-95 group shadow-2xl"
            >
              <History size={14} className="group-hover:rotate-[-45deg] transition-transform duration-300" />
              Archive Vault
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search active buffer..."
                className="bg-gray-900/50 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-cyan-500 transition-all w-64 uppercase tracking-widest"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* STAT TILES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatTile label="Ingested Events (24h)" value={anomalyData.total_anomalies} color="cyan" />
          <StatTile label="Threat_Ceiling" value={`${Math.max(...(anomalyData.data?.map(d => d.risk_score) || [0]), 0)}%`} color="red" />
        </div>

        {/* LIVE FEED CARDS */}
        <div className="space-y-4 cyber-scroll max-h-[60vh] overflow-y-auto pr-2">
          {localSyncing ? (
            <div className="p-20 text-center text-gray-600 font-black uppercase tracking-[0.6em] animate-pulse">Syncing Registry...</div>
          ) : filteredData.length === 0 ? (
            <div className="p-20 text-center border border-dashed border-white/5 rounded-[2rem] text-gray-500 font-mono text-sm italic">
              No behavioral deviations detected in current buffer.
            </div>
          ) : (
            filteredData.map((log) => (
              <motion.div 
                key={log.event_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => { setSelectedLog(log); setShowRawLog(false); fetchGhostData(log); }}
                className="group bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 p-5 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md transition-all relative overflow-hidden cursor-pointer"
              >
                <div className="flex items-center gap-6 flex-1 min-w-0 w-full">
                   <div className={`p-4 rounded-2xl border shrink-0 ${log.risk_score > 80 ? 'border-red-500/30 bg-red-500/5 text-red-500 shadow-lg' : 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400'}`}>
                      <Fingerprint size={24} />
                   </div>
                   <div className="min-w-0 flex-1">
                      <h4 className="text-xl font-black tracking-tight uppercase group-hover:text-cyan-400 transition-colors truncate italic">
                        {log.process || 'SYSTEM_CORE'}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-mono italic truncate mt-0.5 uppercase tracking-tighter">
                        NODE :: {log.hostname} // {log.summary || 'Deviation detected'}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-3">
                          <div className="flex items-center gap-1.5 opacity-40 shrink-0">
                            <Clock size={10}/>
                            <span className="text-[9px] font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-cyan-500/60 font-mono text-[9px] min-w-0 uppercase tracking-tighter italic">
                            <Binary size={10} className="shrink-0"/>
                            <span className="truncate">{log.process_chain?.join(' > ') || 'Execution_Chain'}</span>
                          </div>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-8 shrink-0">
                   <div className="text-right hidden sm:block">
                      <p className="text-[8px] font-black text-gray-600 uppercase mb-1 tracking-widest">Risk_Magnitude</p>
                      <div className="flex items-center gap-3">
                          <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full ${log.risk_score > 80 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]'}`} style={{ width: `${log.risk_score}%` }} />
                          </div>
                          <span className={`text-xs font-black font-mono ${log.risk_score > 80 ? 'text-red-400' : 'text-cyan-400'}`}>{log.risk_score}%</span>
                      </div>
                   </div>
                   <ChevronRight size={20} className="text-gray-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* FORENSIC MODAL remains at higher z-index */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md">
            {/* Modal Content... (rest of your logic remains the same) */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatTile = ({ label, value, color }) => (
  <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] shadow-xl backdrop-blur-md border-b-4 transition-all hover:bg-white/[0.03]" style={{ borderColor: color === 'cyan' ? '#06b6d4' : '#ef4444' }}>
    <div className="flex items-center gap-3 mb-3">
        <div className={`h-2 w-2 rounded-full ${color === 'cyan' ? 'bg-cyan-500 shadow-[0_0_8px_cyan]' : 'bg-red-500 shadow-[0_0_8px_red]'}`} />
        <p className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em]">{label}</p>
    </div>
    <p className={`text-5xl font-black tracking-tighter ${color === 'cyan' ? 'text-cyan-400' : 'text-red-500'}`}>{value}</p>
  </div>
);

export default Anomalies;