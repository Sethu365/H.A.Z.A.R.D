import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Globe, Fingerprint, Database, Search, 
  ChevronRight, ExternalLink, Activity, Info, X, Zap, 
  Terminal, Target, Radar, Cpu, Newspaper,
  Map as MapIcon, Orbit, BrainCircuit, Loader2, Sparkles, GitMerge, Share2, ListFilter,
  Crosshair // New icon for direct search
} from 'lucide-react';
import Topbar from "../components/Topbar";

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
    <div className="space-y-10 font-inter animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. ATTACK CHAIN TIMELINE */}
      <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] shadow-inner">
        <div className="flex items-center gap-3 mb-10 border-l-2 border-cyan-500 pl-4">
           <Zap className="text-cyan-400" size={20} />
           <h3 className="font-roboto-condensed text-[11px] font-black uppercase text-gray-400 tracking-[0.3em]">
             Infiltration_Sequence_Telemetry
           </h3>
        </div>
        
        {chain.length > 0 ? (
          <div className="relative border-l border-white/10 ml-4 pl-8 space-y-10">
            {chain.map((step, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative">
                <div className="absolute -left-[41px] top-0 h-4 w-4 rounded-full bg-[#05070a] border-2 border-cyan-500 shadow-[0_0_10px_#06b6d4]" />
                <div className="flex flex-col gap-1">
                  <span className="font-jetbrains text-[9px] text-cyan-500/60 uppercase tracking-widest">Op_Phase_0{step.step_number || idx + 1}</span>
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
            <span className="text-[10px] font-black uppercase tracking-widest">Mapped_Techniques</span>
          </div>
          {techniques.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {techniques.map((t, idx) => (
                <span key={idx} className="font-jetbrains text-[10px] bg-purple-500/10 text-purple-400 px-3 py-1 border border-purple-500/20 rounded-lg">{t}</span>
              ))}
            </div>
          ) : <p className="text-[10px] font-jetbrains text-gray-700 italic px-2">No MITRE techniques mapped</p>}
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-5 text-emerald-400 font-roboto-condensed">
            <Fingerprint size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Extracted_Keywords</span>
          </div>
          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywords.map((k, idx) => (
                <span key={idx} className="font-jetbrains text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 border border-emerald-500/20 rounded-lg uppercase">{k}</span>
              ))}
            </div>
          ) : <p className="text-[10px] font-jetbrains text-gray-700 italic px-2">Key descriptors unavailable</p>}
        </div>
      </div>

      {/* 3. ATTACK FLOW */}
      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem]">
         <div className="flex items-center gap-3 mb-6 font-roboto-condensed text-orange-400">
            <Share2 size={16} />
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Data_Flow_Mapping</h3>
         </div>
         {flow.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {flow.map((f, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="font-jetbrains text-[10px] text-gray-400 px-2 py-1 bg-white/5 rounded italic truncate">{f.source}</div>
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

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT: INTEL                                                      */
/* -------------------------------------------------------------------------- */

const Intel = ({ setLoading, setError }) => {
  const [activeView, setActiveView] = useState("threats");
  const [intelData, setIntelData] = useState({ stats: {}, data: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // States for Direct ID Acquisition
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
    setSelectedThreat({}); // Immediate trigger for UI presence
    setAnalysisData(null);
    setShowDirectInput(false);

    try {
      const [detailRes, analysisRes] = await Promise.all([
        fetch(`${API_BASE}/intel/threat/${id}`),
        fetch(`${API_BASE}/intel/threat/${id}/analysis`)
      ]);
      
      if (!detailRes.ok) throw new Error("Threat not found");

      const detailResult = await detailRes.json();
      const analysisResult = await analysisRes.json();
      
      setSelectedThreat(detailResult);
      setAnalysisData(analysisResult.analysis);
    } catch (err) { 
      console.error("Forensic Retrieval Error:", err); 
      setSelectedThreat(null);
      alert(`UPLINK_FAILURE: Threat ID ${id} is not present in active registry.`);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => { fetchIntel(activeView, true); }, [activeView]);

  const filteredData = intelData.data.filter((item) => {
    const searchStr = searchTerm.toLowerCase();
    return (
      (item.title?.toLowerCase().includes(searchStr)) ||
      (item.cve_id?.toLowerCase().includes(searchStr)) ||
      (item.ip?.toLowerCase().includes(searchStr)) ||
      (item.domain?.toLowerCase().includes(searchStr))
    );
  });

  const handleDirectAcquire = (e) => {
    e.preventDefault();
    if (directId.trim()) {
      fetchThreatDetail(directId.trim());
      setDirectId("");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-inter selection:bg-cyan-500/30">
      <Topbar name="Intel Matrix" desc="OSINT_Threat_Aggregator_Mesh" />

      <main className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto space-y-10 overflow-x-hidden">
        
        {/* HEADER: SELECTOR, SEARCH, DIRECT ACQUISITION */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
             
             {/* REGULAR SEARCH */}
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

             {/* DIRECT ID SEARCH */}
             <div className="relative flex items-center gap-2">
                <AnimatePresence mode="wait">
                  {!showDirectInput ? (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => setShowDirectInput(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl font-roboto-condensed font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-95 shadow-lg whitespace-nowrap"
                    >
                      <Crosshair size={14} /> Direct_Acquire
                    </motion.button>
                  ) : (
                    <motion.form 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "220px", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      onSubmit={handleDirectAcquire}
                      className="flex items-center bg-cyan-500/10 border border-cyan-500/30 rounded-xl overflow-hidden"
                    >
                      <input 
                        autoFocus
                        type="text"
                        placeholder="ID..."
                        value={directId}
                        onChange={(e) => setDirectId(e.target.value)}
                        className="bg-transparent px-4 py-2.5 text-[10px] font-jetbrains text-cyan-400 outline-none w-full placeholder:text-cyan-900"
                      />
                      <button type="submit" className="px-3 text-cyan-400 hover:text-white">
                        <ChevronRight size={18} />
                      </button>
                      <button type="button" onClick={() => setShowDirectInput(false)} className="px-2 text-red-500 opacity-50 hover:opacity-100">
                        <X size={14} />
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
             </div>
          </div>

          <div className="flex bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
            {["threats", "cves", "ips", "domains"].map((view) => (
              <button key={view} onClick={() => setActiveView(view)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeView === view ? 'text-[#020617]' : 'text-gray-500 hover:text-white'}`}>
                {activeView === view && <motion.div layoutId="nav-bg" className="absolute inset-0 bg-white" />}
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
          {filteredData.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}
              className="group bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 p-8 rounded-[2.5rem] transition-all relative overflow-hidden backdrop-blur-md shadow-xl cursor-pointer"
              onClick={() => activeView === 'threats' ? fetchThreatDetail(item.id) : null}
            >
               <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <Terminal size={20} className="text-gray-500 group-hover:text-cyan-400 transition-colors" />
                    <div className={`h-2 w-2 rounded-full animate-ping ${getSeverityStyles(item.severity || 'LOW', true)}`} />
                  </div>
                  <div className="min-w-0">
                      <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="block font-jetbrains text-2xl font-black tracking-tighter text-white hover:text-cyan-400 transition-colors uppercase truncate">
                          {item.title || item.cve_id || item.ip || item.domain}
                      </a>
                      <p className="font-roboto-condensed text-[10px] font-extrabold text-gray-500 uppercase tracking-[0.2em] mt-3">{item.source || 'GLOBAL_OSINT'}</p>
                      <p className="font-jetbrains text-[8px] text-gray-600 mt-1 uppercase">Seq_ID: {item.id}</p>
                  </div>
                  <div className="pt-6 border-t border-white/5 flex justify-between items-center opacity-60">
                    <ChevronRight size={16} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  </div>
               </div>
            </motion.div>
          ))}
        </div>

        {/* MODAL VIEWPORT */}
        <AnimatePresence>
          {selectedThreat && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-end lg:items-center justify-center bg-black/80 backdrop-blur-xl p-0 lg:p-12">
              <div className="absolute inset-0" onClick={() => { setSelectedThreat(null); setAnalysisData(null); }} />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-[#05070a] border-t lg:border border-white/10 w-full max-w-6xl h-[90vh] flex flex-col relative z-[210] rounded-t-[3rem] lg:rounded-[3rem] overflow-hidden">
                  <div className="p-6 md:p-10 border-b border-white/5 flex justify-between items-start">
                     <div className="flex items-center gap-6">
                        <div className={`p-5 rounded-2xl border-2 ${selectedThreat?.threat ? getSeverityStyles(selectedThreat.threat.severity) : 'border-white/10 animate-pulse'}`}>
                          <Fingerprint size={32} />
                        </div>
                        <div className="space-y-1">
                          <span className="font-roboto-condensed text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em]">Forensic_Investigation</span>
                          <h2 className="font-inter text-2xl font-black text-white uppercase truncate md:w-[600px] italic">
                            {selectedThreat?.threat?.title || "Uplink_Acquisition..."}
                          </h2>
                        </div>
                     </div>
                     <button onClick={() => { setSelectedThreat(null); setAnalysisData(null); }} className="p-3 bg-white/5 hover:bg-red-500/20 rounded-full transition-all"><X size={24} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 md:p-10 cyber-scroll font-inter">
                      {detailsLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 space-y-6">
                           <Orbit size={48} className="text-cyan-500 animate-spin-slow" />
                           <p className="font-roboto-condensed text-[10px] font-black text-cyan-400 uppercase tracking-widest animate-pulse">Aggregating_Telemetry</p>
                        </div>
                      ) : (
                        <div className="space-y-10">
                          <ForensicView analysisData={analysisData} />
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  <TacticalBlock title="CVE_Signatures" data={selectedThreat?.associations?.cves} field="cve_id" icon={<Activity size={16}/>} type="cve" />
                                  <TacticalBlock title="Host_Artifacts" data={selectedThreat?.associations?.ips} field="ip" icon={<Globe size={16}/>} type="ip" />
                              </div>
                              <div className="lg:col-span-5">
                                  <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-inner relative h-full">
                                      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                          <Radar size={18} className="text-cyan-400" />
                                          <h3 className="font-roboto-condensed text-[11px] font-black uppercase text-gray-300 tracking-[0.3em]">Infrastructure_Map</h3>
                                      </div>
                                      <div className="space-y-3 max-h-[400px] overflow-y-auto cyber-scroll pr-3">
                                          {selectedThreat?.associations?.domains && selectedThreat.associations.domains.length > 0 ? (
                                            selectedThreat.associations.domains.map((d, i) => (
                                              <motion.a key={i} href={`https://www.virustotal.com/gui/domain/${d.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-2xl hover:border-cyan-500/30 transition-all group">
                                                  <span className="text-xs font-jetbrains text-gray-400 group-hover:text-white font-bold uppercase">{d.domain}</span>
                                                  <ExternalLink size={14} className="text-gray-700 group-hover:text-cyan-400" />
                                              </motion.a>
                                            ))
                                          ) : (
                                            <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                              <MapIcon size={24} className="mb-2" />
                                              <span className="font-jetbrains text-[8px] uppercase">No_Domain_Nodes_Linked</span>
                                            </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                        </div>
                      )}
                  </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* HUD HELPER COMPONENTS                                                      */
/* -------------------------------------------------------------------------- */

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

const TacticalBlock = ({ title, data, field, icon, type }) => {
  const getOSINT = (val) => type === 'cve' ? `https://nvd.nist.gov/vuln/detail/${val}` : `https://www.virustotal.com/gui/ip-address/${val}`;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-3 border-l-2 border-cyan-500/30">
          <div className="p-2 bg-white/5 rounded-lg text-cyan-400">{icon}</div>
          <span className="font-roboto-condensed text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400">{title}</span>
      </div>
      <div className="space-y-3 h-[350px] overflow-y-auto cyber-scroll pr-3">
         {data && data.length > 0 ? (
           data.map((item, i) => (
             <motion.a key={i} href={getOSINT(item[field])} target="_blank" rel="noopener noreferrer" whileHover={{ x: 6 }} className="bg-white/[0.03] p-5 rounded-[1.5rem] flex justify-between items-center group/item hover:border-cyan-500/40 border border-white/5 transition-all shadow-xl">
                <span className="text-white font-jetbrains font-bold tracking-tight text-xs uppercase">{item[field]}</span>
                <ExternalLink size={14} className="text-gray-700 group-hover/item:text-cyan-400 transition-colors" />
             </motion.a>
           ))
         ) : (
           <div className="flex flex-col items-center justify-center h-full border border-dashed border-white/5 rounded-[2rem] opacity-20">
             <Database size={24} className="mb-2" />
             <span className="font-jetbrains text-[9px] uppercase">Registry_Empty</span>
           </div>
         )}
      </div>
    </div>
  );
};

const getSeverityStyles = (sev, isPing = false) => {
  const s = String(sev || 'LOW').toUpperCase();
  if (s === "CRITICAL" || s === "1") return isPing ? 'bg-red-500 shadow-[0_0_15px_red]' : 'text-red-400 border-red-500/40 bg-red-500/5 shadow-2xl';
  if (s === "HIGH") return isPing ? 'bg-orange-500' : 'text-orange-400 border-orange-500/30 bg-orange-500/5';
  if (s === "MEDIUM") return isPing ? 'bg-yellow-500' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5';
  return isPing ? 'bg-cyan-500 shadow-[0_0_10px_cyan]' : 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5';
};

export default Intel;