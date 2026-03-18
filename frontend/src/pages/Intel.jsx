import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Globe, Fingerprint, Database, Search, 
  ChevronRight, ExternalLink, Activity, Info, X, Zap, 
  ShieldCheck, Terminal, Hash, Target, Box, Calendar, Radar, Cpu, Newspaper,
  Map as MapIcon, Orbit, ListFilter
} from 'lucide-react';
import Topbar from "../components/Topbar";

const API_BASE = "http://172.24.16.81:8001";

const Intel = ({ setLoading, setError }) => {
  const [activeView, setActiveView] = useState("threats");
  const [intelData, setIntelData] = useState({ stats: {}, data: [] });
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);
  const navigate = useNavigate();

  const getExternalLink = (item) => {
    if (item.link) return item.link;
    const value = item.title || item.cve_id || item.ip || item.domain || "";
    if (item.cve_id || (typeof value === 'string' && value.startsWith('CVE-'))) return `https://nvd.nist.gov/vuln/detail/${value}`;
    if (item.ip || (typeof value === 'string' && /^\d/.test(value))) return `https://www.virustotal.com/gui/ip-address/${value}`;
    return `https://www.virustotal.com/gui/domain/${value}`;
  };

  const fetchIntel = async (view, isInitial = false) => {
    if (isInitial) {
        setLoading(true);
        setError(null);
    }
    setLocalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/intel/dashboard?view=${view}`);
      if (!res.ok) throw new Error(`Vault_Sync_Fault: ${res.status}`);
      const result = await res.json();
      setIntelData(result);
      if (isInitial) setLoading(false);
      setLocalLoading(false);
    } catch (err) { 
        console.error(err); 
        if (isInitial) {
            setLoading(false);
            setError("Master Intel Registry Offline: Uplink Failure");
        }
    }
  };

  useEffect(() => { fetchIntel(activeView, true); }, [activeView]);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-inter selection:bg-cyan-500/30">
      <style>{`
        .cyber-scroll::-webkit-scrollbar { width: 3px; }
        .cyber-scroll::-webkit-scrollbar-track { background: transparent; }
        .cyber-scroll::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #06b6d4, #8b5cf6); border-radius: 20px; }
      `}</style>

      <Topbar name="Intel Matrix" desc="OSINT_Threat_Aggregator_Mesh" />

      <main className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto space-y-10 overflow-x-hidden">
        
        {/* VIEW SELECTOR */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="h-3 w-3 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#06b6d4]" />
             <span className="font-roboto-condensed text-[10px] font-extrabold text-cyan-400 uppercase tracking-[0.6em]">Telemetry_Stream</span>
          </div>
          
          <div className="flex bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl w-full lg:w-auto overflow-x-auto cyber-scroll font-roboto-condensed">
            {["threats", "cves", "ips", "domains"].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden shrink-0 ${
                  activeView === view ? 'text-[#020617]' : 'text-gray-500 hover:text-white'
                }`}
              >
                {activeView === view && (
                  <motion.div layoutId="nav-bg" className="absolute inset-0 bg-white" />
                )}
                <span className="relative z-10">{view}</span>
              </button>
            ))}
          </div>
        </div>

        {/* STAT TILES */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatTile label="Registry" value={intelData.stats.total} color="cyan" />
          <StatTile label="Critical" value={intelData.stats.critical} color="red" glow />
          <StatTile label="Exploits" value={intelData.stats.high} color="orange" />
          <StatTile label="Suspect" value={intelData.stats.medium} color="yellow" />
          <StatTile label="Safe" value={intelData.stats.low} color="blue" />
        </div>

        {/* DATA CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 cyber-scroll max-h-[700px] overflow-y-auto pr-2 pb-10">
          {intelData.data.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="group bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 p-8 rounded-[2.5rem] transition-all relative overflow-hidden backdrop-blur-md shadow-xl"
            >
               <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <div onClick={() => activeView === 'threats' ? setSelectedThreat(item) : null} className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white group-hover:text-black transition-all cursor-pointer">
                       <Terminal size={20} />
                    </div>
                    <div className={`h-2 w-2 rounded-full animate-ping ${getSeverityStyles(item.severity || (item.vt_malicious ? 'CRITICAL' : 'LOW'), true)}`} />
                  </div>

                  <div className="min-w-0">
                      {/* Technical Identifier: JetBrains Mono */}
                      <a 
                        href={getExternalLink(item)} target="_blank" rel="noopener noreferrer"
                        className="block font-jetbrains text-2xl font-black tracking-tighter text-white group-hover:text-cyan-400 transition-colors uppercase leading-none truncate"
                      >
                          {item.title || item.cve_id || item.ip || item.domain}
                      </a>
                      <p className="font-roboto-condensed text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
                        <Newspaper size={12} className="text-cyan-500/50" /> {item.source || 'GLOBAL_OSINT'}
                      </p>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                    <span className="font-jetbrains text-[9px] font-bold tracking-widest text-gray-500 uppercase">Seq_ID: {item.id}</span>
                    <div onClick={() => activeView === 'threats' ? setSelectedThreat(item) : null} className="cursor-pointer bg-white/5 p-2 rounded-lg group-hover:bg-cyan-500/20 transition-all">
                      <ChevronRight size={16} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
               </div>
            </motion.div>
          ))}
        </div>

        {/* MODAL VIEWPORT */}
        <AnimatePresence>
          {selectedThreat && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center bg-black/80 backdrop-blur-xl p-0 lg:p-12"
            >
              <div className="absolute inset-0" onClick={() => setSelectedThreat(null)} />
              
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                className="bg-[#05070a] border-t lg:border border-white/10 w-full max-w-5xl h-[85vh] flex flex-col relative z-[210] shadow-[0_20px_60px_rgba(0,0,0,0.7)] rounded-t-[3rem] lg:rounded-[3rem] overflow-hidden font-inter"
              >
                  <div className="p-6 md:p-10 border-b border-white/5 flex justify-between items-start bg-white/[0.01]">
                     <div className="flex items-center gap-6">
                        <div className={`p-5 rounded-2xl border-2 shadow-2xl relative ${getSeverityStyles(selectedThreat.severity)}`}>
                          <Fingerprint size={32} />
                          <div className="absolute -bottom-1 -right-1 bg-red-500 h-6 w-6 rounded-full flex items-center justify-center border-2 border-[#05070a] shadow-lg"><Zap size={10} fill="white" /></div>
                        </div>
                        <div className="space-y-1 min-w-0">
                          <span className="font-roboto-condensed text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em]">Forensic_Investigation</span>
                          <h2 className="font-inter text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none truncate md:w-96">{selectedThreat.title || selectedThreat.cve_id}</h2>
                          <div className="flex flex-wrap gap-4 items-center mt-3">
                              <span className="font-jetbrains text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-1 bg-white/5 rounded border border-white/10">ID: {selectedThreat.id}</span>
                              <a href={getExternalLink(selectedThreat)} target="_blank" rel="noopener noreferrer" className="font-roboto-condensed text-[10px] text-cyan-500 hover:text-white transition-colors flex items-center gap-2 font-extrabold uppercase tracking-widest border-b border-cyan-500/20">
                                  <ExternalLink size={12}/> Repository_Link
                              </a>
                          </div>
                        </div>
                     </div>
                     <button onClick={() => setSelectedThreat(null)} className="p-3 bg-white/5 hover:bg-red-500/20 rounded-full text-gray-500 hover:text-white transition-all active:scale-90"><X size={24} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 cyber-scroll">
                      {/* Use default logic to handle children/blocks since specific associations need API mapping */}
                      <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <TacticalBlock title="CVE_Signatures" data={[]} field="cve_id" color="orange" icon={<Activity size={16}/>} type="cve" />
                          <TacticalBlock title="Host_Artifacts" data={[]} field="ip" color="red" icon={<Globe size={16}/>} type="ip" />
                      </div>

                      <div className="lg:col-span-5">
                          <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-inner relative overflow-hidden backdrop-blur-md h-full">
                              <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none"><MapIcon size={80}/></div>
                              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                  <Radar size={18} className="text-cyan-400 animate-pulse" />
                                  <h3 className="font-roboto-condensed text-[11px] font-black uppercase text-gray-300 tracking-[0.3em]">Infrastructure_Map</h3>
                              </div>
                              <div className="space-y-3 max-h-[400px] overflow-y-auto cyber-scroll pr-3">
                                  {/* Dummy data or map if associations exist */}
                                  <div className="font-jetbrains p-10 text-center border border-dashed border-white/5 rounded-[2rem] text-[9px] text-gray-700 uppercase font-black opacity-30">
                                     No_Map_Registry
                                   </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const StatTile = ({ label, value, color, glow }) => (
  <div className={`p-6 md:p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] transition-all hover:bg-white/[0.04] group ${glow ? 'shadow-[0_0_50px_rgba(239,68,68,0.1)] border-red-500/20' : ''}`}>
    <p className="font-roboto-condensed text-[9px] font-extrabold uppercase text-gray-500 tracking-[0.3em] mb-4">{label}</p>
    <p className={`font-jetbrains text-4xl font-black tracking-tighter leading-none ${
      color === 'red' ? 'text-red-500' : color === 'orange' ? 'text-orange-400' : 
      color === 'yellow' ? 'text-yellow-400' : color === 'cyan' ? 'text-cyan-400' : 'text-blue-400'
    }`}>
      {value || 0}
    </p>
  </div>
);

const TacticalBlock = ({ title, data, field, color, icon, type }) => {
  const getOSINT = (val) => type === 'cve' ? `https://nvd.nist.gov/vuln/detail/${val}` : `https://www.virustotal.com/gui/ip-address/${val}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-3 border-l-2 border-cyan-500/30">
          <div className="p-2 bg-white/5 rounded-lg text-cyan-400">{icon}</div>
          <span className="font-roboto-condensed text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400">{title}</span>
      </div>
      <div className="space-y-3 h-[350px] overflow-y-auto cyber-scroll pr-3">
         {data && data.length > 0 ? data.map((item, i) => (
           <motion.a 
             key={i} href={getOSINT(item[field])} target="_blank" rel="noopener noreferrer"
             whileHover={{ x: 6 }}
             className="bg-white/[0.03] p-5 rounded-[1.5rem] flex justify-between items-center group/item hover:border-cyan-500/40 border border-white/5 transition-all shadow-xl"
           >
              <span className="text-white font-jetbrains font-bold tracking-tight text-xs uppercase">{item[field]}</span>
              <ExternalLink size={14} className="text-gray-700 group-hover/item:text-cyan-400 transition-colors" />
           </motion.a>
         )) : (
           <div className="font-jetbrains p-10 text-center border border-dashed border-white/5 rounded-[2rem] text-[9px] text-gray-700 uppercase font-black opacity-30">
             No_Active_Artifacts
           </div>
         )}
      </div>
    </div>
  );
};

const getSeverityStyles = (sev, isPing = false) => {
  if (sev === "CRITICAL" || sev === 1) return isPing ? 'bg-red-500 shadow-[0_0_15px_red]' : 'text-red-400 border-red-500/40 bg-red-500/5 shadow-[0_0_50px_rgba(239,68,68,0.2)]';
  if (sev === "HIGH") return isPing ? 'bg-orange-500' : 'text-orange-400 border-orange-500/30 bg-orange-500/5';
  if (sev === "MEDIUM") return isPing ? 'bg-yellow-500' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5';
  return isPing ? 'bg-cyan-500 shadow-[0_0_10px_cyan]' : 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5';
};

export default Intel;