import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Globe, Fingerprint, Database, Search, 
  ChevronRight, ExternalLink, Activity, Info, X, Zap, 
  Terminal, Target, Radar, Cpu, Newspaper,
  Map as MapIcon, Orbit, BrainCircuit, Loader2, Sparkles, GitMerge, Share2, ListFilter,
  Crosshair, ChevronLeft 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = "http://172.24.16.81:8001";

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENT: FORENSIC VIEW (EVIDENCE ONLY)                               */
/* -------------------------------------------------------------------------- */
const ForensicView = ({ analysisData }) => {
  const data = analysisData || {};
  const chain = data.attack_chain || [];
  const techniques = data.techniques || [];
  const keywords = data.keywords || [];
  const flow = data.attack_flow || [];

  const EmptyState = ({ message }) => (
    <div className="flex items-center gap-3 p-6 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl text-gray-600 font-jetbrains text-[10px] uppercase tracking-widest">
      <Info size={14} className="opacity-50" />
      {message}
    </div>
  );

  return (
    <div className="space-y-10 font-inter">
      {/* 1. ATTACK CHAIN TIMELINE */}
      <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] shadow-inner">
        <div className="flex items-center gap-3 mb-10 border-l-2 border-cyan-500 pl-4">
           <Zap className="text-cyan-400" size={20} />
           <h3 className="font-roboto-condensed text-[11px] font-bold uppercase text-gray-400 tracking-[0.3em]">
             Infiltration_Sequence_Telemetry
           </h3>
        </div>
        
        {chain.length > 0 ? (
          <div className="relative border-l border-white/10 ml-4 pl-8 space-y-10">
            {chain.map((step, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative">
                <div className="absolute -left-[41px] top-0 h-4 w-4 rounded-full bg-[#05070a] border-2 border-cyan-500 shadow-[0_0_10px_#06b6d4]" />
                <div className="flex flex-col gap-1">
                  <span className="font-roboto-condensed text-[9px] text-cyan-500/60 font-bold uppercase tracking-widest">Op_Phase_0{step.step_number || idx + 1}</span>
                  <p className="font-inter text-sm font-medium text-slate-200 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState message="Step-wise attack sequence not identified in current buffer" />
        )}
      </div>

      {/* 2. TECHNIQUES & ARTIFACTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-purple-500/5 border border-purple-500/10 p-6 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-5 text-purple-400 font-roboto-condensed">
            <ShieldAlert size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Mapped_Techniques</span>
          </div>
          {techniques.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {techniques.map((t, idx) => (
                <span key={idx} className="font-jetbrains text-[10px] bg-purple-500/10 text-purple-400 px-3 py-1 border border-purple-500/20 rounded-lg">{t}</span>
              ))}
            </div>
          ) : <p className="text-[10px] font-jetbrains text-gray-700 px-2">No MITRE techniques mapped</p>}
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-5 text-emerald-400 font-roboto-condensed">
            <Fingerprint size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Extracted_Keywords</span>
          </div>
          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywords.map((k, idx) => (
                <span key={idx} className="font-jetbrains text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 border border-emerald-500/20 rounded-lg uppercase">{k}</span>
              ))}
            </div>
          ) : <p className="text-[10px] font-jetbrains text-gray-700 px-2">Key descriptors unavailable</p>}
        </div>
      </div>

      {/* 3. ATTACK FLOW */}
      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem]">
         <div className="flex items-center gap-3 mb-6 font-roboto-condensed text-orange-400">
            <Share2 size={16} />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em]">Data_Flow_Mapping</h3>
         </div>
         {flow.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {flow.map((f, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="font-jetbrains text-[10px] text-gray-400 px-2 py-1 bg-white/5 rounded truncate">{f.source}</div>
                  <GitMerge size={14} className="text-orange-500 shrink-0" />
                  <div className="font-jetbrains text-[10px] text-orange-400 font-bold uppercase truncate">{f.target}</div>
                </div>
              ))}
           </div>
         ) : <EmptyState message="Entity transition flow not established" />}
      </div>
    </div>
  );
};

const Intel = ({ setLoading, setError }) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("threats");
  const [intelData, setIntelData] = useState({ stats: {}, data: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [directId, setDirectId] = useState("");

  const fetchIntel = async (view, isInitial = false) => {
    if (isInitial) { setLoading(true); setError(null); }
    try {
      const res = await fetch(`${API_BASE}/intel/dashboard?view=${view}`);
      const result = await res.json();
      setIntelData(result);
      if (isInitial) setLoading(false);
    } catch (err) { 
      if (isInitial) { setLoading(false); setError("Master Intel Registry Offline"); }
    }
  };

  const fetchThreatDetail = async (id) => {
    if (!id) return;
    setDetailsLoading(true);
    setSelectedThreat({});
    setAnalysisData(null);
    setShowDirectInput(false);

    try {
      const [detailRes, analysisRes] = await Promise.all([
        fetch(`${API_BASE}/intel/threat/${id}`),
        fetch(`${API_BASE}/intel/threat/${id}/analysis`)
      ]);
      const detailResult = await detailRes.json();
      const analysisResult = await analysisRes.json();
      setSelectedThreat(detailResult);
      setAnalysisData(analysisResult.analysis);
    } catch (err) { 
      setSelectedThreat(null);
      alert(`UPLINK_FAILURE: Threat ID ${id} is not present.`);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => { fetchIntel(activeView, true); }, [activeView]);

  const filteredData = intelData.data.filter((item) => {
    const searchStr = searchTerm.toLowerCase();
    return (item.title?.toLowerCase().includes(searchStr)) ||
           (item.cve_id?.toLowerCase().includes(searchStr)) ||
           (item.ip?.toLowerCase().includes(searchStr));
  });

  return (
    <div className="min-h-screen bg-[#020617] text-white font-inter selection:bg-cyan-500/30">
      <main className="pt-12 pb-20 px-6 md:px-12 w-full space-y-10 transition-all duration-500">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
            >
              <ChevronLeft size={20} className="text-cyan-400" />
            </button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-white">Intel Matrix</h1>
              <p className="font-roboto-condensed text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em]">OSINT_Threat_Aggregator_Mesh</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
             <div className="relative w-full sm:w-64 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                  type="text"
                  placeholder="FILTER_STREAM..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-[10px] font-jetbrains uppercase tracking-widest text-white outline-none focus:border-cyan-500/50 transition-all"
                />
             </div>
             <button onClick={() => setShowDirectInput(!showDirectInput)} className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl font-roboto-condensed font-bold text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all">
                <Crosshair size={14} /> Direct_Acquire
             </button>
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

        {/* VIEW SELECTOR */}
        <div className="flex justify-center w-full my-8">
          <div className="relative flex bg-[#030712]/60 p-1.5 rounded-[1.2rem] border border-white/5 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
            {["threats", "cves", "ips"].map((view) => {
              const isActive = activeView === view;
              return (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`
                    group relative px-10 py-3 rounded-[0.9rem] transition-all duration-500 
                    flex items-center gap-3 overflow-hidden
                    ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
                  `}
                >
                  {/* 1. Tactical Highlight Background */}
                  {isActive && (
                    <motion.div
                      layoutId="tactical-active-glow"
                      className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent border-t border-cyan-400/30 shadow-[inset_0_1px_15px_rgba(34,211,238,0.1)]"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                    />
                  )}

                  {/* 2. Status LED Indicator */}
                  <div className="relative flex items-center justify-center">
                    <div className={`
                      w-1.5 h-1.5 rounded-full transition-all duration-500
                      ${isActive ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee] scale-110' : 'bg-gray-800 group-hover:bg-gray-600'}
                    `} />
                    {isActive && (
                      <motion.div 
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 rounded-full bg-cyan-500/50"
                      />
                    )}
                  </div>

                  {/* 3. Label Text */}
                  <span className={`
                    font-roboto-condensed text-[11px] font-black uppercase tracking-[0.25em] relative z-10 transition-colors
                    ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}
                  `}>
                    {view}
                  </span>

                  {/* 4. Decorative Corner Accents (Visible only on Active) */}
                  {isActive && (
                    <>
                      <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-cyan-400/50" />
                      <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-cyan-400/50" />
                      <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-cyan-400/50" />
                      <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-cyan-400/50" />
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* DATA GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
          {filteredData.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="group bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 p-8 rounded-[2.5rem] transition-all relative overflow-hidden backdrop-blur-md shadow-xl cursor-pointer"
              onClick={() => activeView === 'threats' ? fetchThreatDetail(item.id) : (item.link ? window.open(item.link, '_blank') : null)}
            >
               <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <Terminal size={20} className="text-gray-500 group-hover:text-cyan-400" />
                    <div className={`h-2 w-2 rounded-full animate-ping ${getSeverityStyles(item.severity || 'LOW', true)}`} />
                  </div>
                  <div className="min-w-0">
                      {/* Name as a Link to the source website */}
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block font-jetbrains text-2xl font-bold tracking-tighter text-white uppercase truncate hover:text-cyan-400 transition-colors"
                        onClick={(e) => e.stopPropagation()} // Prevents the card click from firing when clicking the link
                      >
                        {item.title || item.cve_id || item.ip}
                      </a>
                      <p className="font-roboto-condensed text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-3">{item.source || 'GLOBAL_OSINT'}</p>
                  </div>
                  <ChevronRight size={16} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
               </div>
            </motion.div>
          ))}
        </div>

        {/* FORENSIC MODAL */}
        <AnimatePresence>
          {selectedThreat && (
            <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 md:p-12">
               <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="bg-[#05070a] border border-white/10 rounded-[3rem] w-full max-w-[1400px] h-[85vh] flex flex-col shadow-2xl overflow-hidden"
              >
                  <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-2xl border-2 ${selectedThreat?.threat ? getSeverityStyles(selectedThreat.threat.severity) : 'border-white/10'}`}>
                          <Fingerprint size={28} />
                        </div>
                        <div>
                          {/* Name as a Link in Modal Header */}
                          <a 
                            href={selectedThreat?.threat?.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-inter text-2xl font-bold text-white uppercase truncate max-w-xl hover:text-cyan-400 transition-colors block"
                          >
                            {selectedThreat?.threat?.title || "Retrieving_Data..."}
                          </a>
                          <p className="font-roboto-condensed text-[9px] font-bold text-gray-500 uppercase tracking-widest">Forensic_Investigation_Buffer</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedThreat(null)} className="p-3 hover:bg-red-500/10 rounded-full transition-colors"><X size={24} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 cyber-scroll">
                      {detailsLoading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                           <Orbit size={48} className="text-cyan-500 animate-spin" />
                           <p className="font-roboto-condensed text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Syncing_Telemetry</p>
                        </div>
                      ) : (
                        <div className="space-y-12">
                          <ForensicView analysisData={analysisData} />
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                              <TacticalBlock title="CVE_Signatures" data={selectedThreat?.associations?.cves} field="cve_id" icon={<Activity size={16}/>} type="cve" />
                              <TacticalBlock title="Host_Artifacts" data={selectedThreat?.associations?.ips} field="ip" icon={<Globe size={16}/>} type="ip" />
                          </div>
                        </div>
                      )}
                  </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const StatTile = ({ label, value, color, glow }) => (
  <div className={`p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] transition-all hover:bg-white/[0.04] ${glow ? 'shadow-[0_0_50px_rgba(239,68,68,0.1)]' : ''}`}>
    <p className="font-roboto-condensed text-[9px] font-bold uppercase text-gray-500 tracking-[0.3em] mb-4">{label}</p>
    <p className={`font-jetbrains text-4xl font-bold tracking-tighter ${color === 'red' ? 'text-red-500' : color === 'orange' ? 'text-orange-400' : 'text-cyan-400'}`}>
      {value || 0}
    </p>
  </div>
);

const TacticalBlock = ({ title, data, field, icon, type }) => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-4 border-l-2 border-cyan-500">
            <span className="font-roboto-condensed text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">{title}</span>
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 cyber-scroll">
           {data?.length > 0 ? (
             data.map((item, i) => (
               <a 
                 key={i} 
                 href={type === 'cve' ? `https://nvd.nist.gov/vuln/detail/${item[field]}` : `https://www.virustotal.com/gui/ip-address/${item[field]}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="bg-white/[0.03] p-6 rounded-[2rem] flex justify-between items-center border border-white/5 hover:border-cyan-500/30 transition-all group"
               >
                  <span className="text-white font-jetbrains font-bold text-xs">{item[field]}</span>
                  <ExternalLink size={14} className="text-gray-700 group-hover:text-cyan-400 transition-colors" />
               </a>
             ))
           ) : <p className="text-gray-700 text-[10px] font-jetbrains uppercase tracking-widest px-6">Registry_Empty</p>}
        </div>
      </div>
    );
};

const getSeverityStyles = (sev, isPing = false) => {
  const s = String(sev || 'LOW').toUpperCase();
  if (s === "CRITICAL") return isPing ? 'bg-red-500 shadow-[0_0_15px_red]' : 'text-red-400 border-red-500/40 bg-red-500/5';
  if (s === "HIGH") return isPing ? 'bg-orange-500' : 'text-orange-400 border-orange-500/30 bg-orange-500/5';
  return isPing ? 'bg-cyan-500 shadow-[0_0_10px_cyan]' : 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5';
};

export default Intel;