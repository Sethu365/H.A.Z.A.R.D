import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Globe, Fingerprint, Database, Search, 
  ChevronRight, ExternalLink, Activity, Info, X, Zap, 
  ShieldCheck, Terminal, Hash, Target, Box, Calendar, Radar, Cpu, Newspaper,
  Map as MapIcon, 
  Orbit
} from 'lucide-react';

const API_BASE = "http://172.24.16.81:8001";

const Intel = () => {
  const [activeView, setActiveView] = useState("threats");
  const [intelData, setIntelData] = useState({ stats: {}, data: [] });
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getExternalLink = (item) => {
    if (item.link) return item.link;
    const value = item.title || item.cve_id || item.ip || item.domain || "";
    if (item.cve_id || (typeof value === 'string' && value.startsWith('CVE-'))) return `https://nvd.nist.gov/vuln/detail/${value}`;
    if (item.ip || (typeof value === 'string' && /^\d/.test(value))) return `https://www.virustotal.com/gui/ip-address/${value}`;
    return `https://www.virustotal.com/gui/domain/${value}`;
  };

  const fetchIntel = async (view) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/intel/dashboard?view=${view}`);
      const result = await res.json();
      setIntelData(result);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchThreatDetail = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/intel/threat/${id}`);
      const result = await res.json();
      // Ensure result contains { threat: {}, associations: { cves: [], ips: [], domains: [] } }
      setSelectedThreat(result);
    } catch (err) { console.error("Detail Fetch Error:", err); }
  };

  useEffect(() => { fetchIntel(activeView); }, [activeView]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 pt-4 text-white relative font-sans selection:bg-cyan-500/30">
      
      <style>{`
        .cyber-scroll::-webkit-scrollbar { width: 3px; }
        .cyber-scroll::-webkit-scrollbar-track { background: transparent; }
        .cyber-scroll::-webkit-scrollbar-thumb { 
          background: linear-gradient(to bottom, #06b6d4, #8b5cf6); 
          border-radius: 20px; 
        }
      `}</style>

      {/* HEADER AREA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-3">
             <Orbit size={14} className="text-cyan-500 animate-pulse" />
             <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.6em]">A.U.R.O.R.A</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">Intel_Matrix</h1>
        </motion.div>
        
        <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
          {["threats", "cves", "ips", "domains"].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 relative overflow-hidden group ${
                activeView === view ? 'text-black' : 'text-gray-500 hover:text-white'
              }`}
            >
              {activeView === view && (
                <motion.div layoutId="nav-bg" className="absolute inset-0 bg-cyan-400" />
              )}
              <span className="relative z-10">{view}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STAT TILES */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatTile label="Registry" value={intelData.stats.total} color="cyan" />
        <StatTile label="Critical" value={intelData.stats.critical} color="red" glow />
        <StatTile label="Exploits" value={intelData.stats.high} color="orange" />
        <StatTile label="Suspicious" value={intelData.stats.medium} color="yellow" />
        <StatTile label="Safe" value={intelData.stats.low} color="blue" />
      </div>

      {/* DATA CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 cyber-scroll max-h-[700px] overflow-y-auto pr-2 pb-10">
        {intelData.data.map((item, i) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="group bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5 hover:border-cyan-500/50 p-8 rounded-[2.5rem] transition-all relative overflow-hidden backdrop-blur-md shadow-2xl"
          >
             <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-start">
                  <div onClick={() => activeView === 'threats' ? fetchThreatDetail(item.id) : navigate(`/intel/${activeView}/${item.id}`)} className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-cyan-500 group-hover:text-black transition-all shadow-xl cursor-pointer">
                     <Terminal size={20} />
                  </div>
                  <div className={`h-2 w-2 rounded-full animate-ping ${getSeverityStyles(item.severity || (item.vt_malicious ? 'CRITICAL' : 'LOW'), true)}`} />
                </div>

                <div>
                    <a 
                      href={getExternalLink(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-2xl font-black tracking-tight text-white group-hover:text-cyan-400 transition-colors uppercase leading-none hover:underline decoration-cyan-500/30 underline-offset-8"
                    >
                        {item.title || item.cve_id || item.ip || item.domain}
                    </a>
                    <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity mt-3">
                        <Newspaper size={10} className="text-cyan-500" />
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter truncate max-w-[200px]">Origin: {item.source || 'Verified OSINT'}</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">Seq_ID: {item.id}</span>
                  <div onClick={() => activeView === 'threats' ? fetchThreatDetail(item.id) : navigate(`/intel/${activeView}/${item.id}`)} className="cursor-pointer bg-white/5 p-2 rounded-lg group-hover:bg-cyan-500/20 transition-all">
                    <ChevronRight size={16} className="text-cyan-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
             </div>
          </motion.div>
        ))}
      </div>

      {/* COMPACT CENTER VIEWPORT */}
      <AnimatePresence>
        {selectedThreat && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-[#05070a]/90 backdrop-blur-[40px] transition-all p-4 md:p-12"
          >
            <div className="absolute inset-0" onClick={() => setSelectedThreat(null)} />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b0f1a] border border-white/10 w-full max-w-4xl max-h-[85vh] flex flex-col relative z-[210] shadow-[0_0_150px_rgba(6,182,212,0.15)] rounded-[3rem] overflow-hidden"
            >
                {/* MODAL HEADER */}
                <div className="p-8 border-b border-white/5 flex justify-between items-start bg-gradient-to-br from-white/[0.03] to-transparent">
                   <div className="flex items-center gap-6">
                      <div className={`p-5 rounded-2xl border-2 shadow-xl relative ${getSeverityStyles(selectedThreat.threat.severity)}`}>
                        <Fingerprint size={32} strokeWidth={1.5} />
                        <div className="absolute -bottom-1 -right-1 bg-red-500 h-6 w-6 rounded-full flex items-center justify-center border-2 border-[#0b0f1a] shadow-lg"><Zap size={10} fill="white" /></div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.4em]">Investigation_Report</span>
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{selectedThreat.threat.title}</h2>
                        <div className="flex gap-4 items-center mt-2">
                            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest px-2 py-1 bg-white/5 rounded border border-white/5">UUID: {selectedThreat.threat.id}</span>
                            <a href={getExternalLink(selectedThreat.threat)} target="_blank" rel="noopener noreferrer" className="text-[9px] text-cyan-500 hover:text-white transition-colors flex items-center gap-1 font-black uppercase tracking-widest border-b border-cyan-500/20">
                                <ExternalLink size={10}/> Authority Repository
                            </a>
                        </div>
                      </div>
                   </div>
                   <button onClick={() => setSelectedThreat(null)} className="p-3 bg-white/5 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-white transition-all border border-white/10 active:scale-90 shadow-xl"><X size={20} /></button>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 p-8 gap-8 cyber-scroll overflow-y-auto">
                    <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TacticalBlock title="Signatures" data={selectedThreat.associations.cves} field="cve_id" color="orange" icon={<Activity size={14}/>} type="cve" />
                        <TacticalBlock title="Attack_Nodes" data={selectedThreat.associations.ips} field="ip" color="red" icon={<Globe size={14}/>} type="ip" />
                    </div>

                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md h-full">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><MapIcon size={48}/></div>
                            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                                <Radar size={16} className="text-cyan-500 animate-pulse" />
                                <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-[0.3em]">Infrastructure</h3>
                            </div>
                            <div className="space-y-3 max-h-[350px] overflow-y-auto cyber-scroll pr-2">
                                {selectedThreat.associations.domains.map((d, i) => (
                                    <motion.a 
                                      key={i} href={`https://www.virustotal.com/gui/domain/${d.domain}`} target="_blank" rel="noopener noreferrer"
                                      whileHover={{ scale: 1.02, x: 5, backgroundColor: "rgba(34, 211, 238, 0.05)" }}
                                      className="flex items-center justify-between p-4 bg-black border border-white/5 rounded-xl hover:border-cyan-500/30 transition-all group shadow-lg"
                                    >
                                        <span className="text-xs font-mono text-gray-400 group-hover:text-white font-black">{d.domain}</span>
                                        <ExternalLink size={12} className="text-gray-700 group-hover:text-cyan-400 cursor-pointer" />
                                    </motion.a>
                                ))}
                            </div>
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

// --- COMPONENTS ---
const StatTile = ({ label, value, color, glow }) => (
  <div className={`p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent transition-all hover:bg-white/[0.06] group ${glow ? 'shadow-[0_0_40px_rgba(239,68,68,0.15)] border-red-500/20' : ''}`}>
    <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.4em] mb-4 group-hover:text-white/60 transition-colors italic">{label}</p>
    <p className={`text-4xl font-black tracking-tighter ${color === 'red' ? 'text-red-500' : color === 'orange' ? 'text-orange-400' : color === 'yellow' ? 'text-yellow-400' : color === 'cyan' ? 'text-cyan-400' : 'text-blue-400'}`}>
      {value || 0}
    </p>
  </div>
);

const TacticalBlock = ({ title, data, field, color, icon, type }) => {
  const getOSINT = (val) => type === 'cve' ? `https://nvd.nist.gov/vuln/detail/${val}` : `https://www.virustotal.com/gui/ip-address/${val}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2 border-l-2 border-white/10">
          <div className={`p-2 bg-${color}-500/10 rounded-lg text-${color}-500 border border-${color}-500/20 shadow-md`}>{icon}</div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 italic">{title}</span>
      </div>
      <div className="space-y-2 h-[350px] overflow-y-auto cyber-scroll pr-3">
         {data && data.length > 0 ? data.map((item, i) => (
           <motion.a 
             key={i} href={getOSINT(item[field])} target="_blank" rel="noopener noreferrer"
             whileHover={{ x: 6, scale: 1.01 }}
             className="bg-white/[0.03] p-4 rounded-[1.5rem] text-xs text-gray-400 flex justify-between items-center group/item hover:bg-white/[0.08] border border-white/5 hover:border-cyan-500/40 transition-all shadow-xl backdrop-blur-sm"
           >
              <span className="group-hover/item:text-white font-mono font-bold tracking-[0.1em] uppercase">{item[field]}</span>
              <div className="p-1.5 bg-white/5 rounded-lg group-hover/item:bg-white/10 transition-all">
                  <ExternalLink size={12} className="text-gray-700 group-hover:text-cyan-400" />
              </div>
           </motion.a>
         )) : <div className="p-10 text-center border border-dashed border-white/10 rounded-[2rem] text-[9px] text-gray-700 uppercase font-black tracking-widest italic opacity-40">Artifact Empty</div>}
      </div>
    </div>
  );
};

const getSeverityStyles = (sev, isPing = false) => {
  if (sev === "CRITICAL" || sev === 1) return isPing ? 'bg-red-500 shadow-[0_0_15px_red]' : 'text-red-400 border-red-500/40 bg-red-500/5 shadow-[0_0_50px_rgba(239,68,68,0.2)]';
  if (sev === "HIGH") return isPing ? 'bg-orange-500' : 'text-orange-400 border-orange-500/30 bg-orange-500/5';
  if (sev === "MEDIUM") return isPing ? 'bg-yellow-500' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5';
  return isPing ? 'bg-cyan-500' : 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5';
};

export default Intel;