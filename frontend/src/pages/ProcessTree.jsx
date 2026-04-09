import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams,useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, X, RefreshCw, ChevronLeft 
} from "lucide-react";

const API_BASE = "http://172.24.16.81:8001/client";

const HorizontalTreeNode = ({ node, selectedPid }) => {
  const getEventDetail = (details, keys) => {
    for (const key of keys) { if (details[key]) return details[key]; }
    return "";
  };

  const details = node.events[0]?.details || {};
  const command = getEventDetail(details, ["PROCESS_CMD", "COMMAND_LINE", "PROCESS_ARGS"]);
  const filePath = getEventDetail(details, ["PROCESS_NAME", "FILE_PATH", "EXE"]);
  const eventType = node.events[0]?.event_type || "PROCESS_EVENT";
  const timestamp = node.events[0]?.timestamp 
    ? new Date(node.events[0].timestamp).toLocaleTimeString([], { hour12: false }) 
    : "--:--:--";

  const isSelected = node.pid === selectedPid;

  return (
    <div className="flex items-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative flex flex-col min-w-[300px] max-w-[340px] p-5 rounded-[1.5rem] border transition-all duration-500 shadow-2xl z-10
          ${isSelected ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]" : "bg-white/[0.02] border-white/5 backdrop-blur-md hover:border-cyan-500/30"}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-black animate-pulse" : "bg-cyan-500"}`} />
            <span className={`font-roboto-condensed text-[9px] font-bold uppercase tracking-widest ${isSelected ? "text-black" : "text-gray-400"}`}>{eventType}</span>
          </div>
          <span className={`font-roboto-condensed text-[9px] font-medium ${isSelected ? "text-black/60" : "text-gray-500"}`}>{timestamp}</span>
        </div>
        <div className="space-y-3">
          <p className={`font-inter text-xs font-bold uppercase tracking-tight break-all leading-tight ${isSelected ? "text-black" : "text-cyan-400"}`}>{filePath}</p>
          <div className={`${isSelected ? "bg-black/10" : "bg-black/40"} p-3 rounded-xl border ${isSelected ? "border-black/10" : "border-white/5"}`}>
            <p className={`font-jetbrains text-[10px] leading-relaxed line-clamp-2 ${isSelected ? "text-black/70" : "text-gray-400"}`}>{command || "No arguments"}</p>
          </div>
        </div>
      </motion.div>
      {node.children && node.children.length > 0 && (
        <>
          <div className="w-10 h-[1px] bg-white/10 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-500" />
          </div>
          <div className="flex flex-col gap-8 ml-2">
            {node.children.map((child, i) => (
              <HorizontalTreeNode key={i} node={child} selectedPid={selectedPid} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ProcessTree = ({ setLoading, setError }) => {
  const { hostname } = useParams();
  const [treeData, setTreeData] = useState([]);
  const [localSyncing, setLocalSyncing] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const navigate = useNavigate();
  const fetchTree = useCallback(async (isInitial = false) => {
    if (isInitial) { setLoading(true); setError(null); }
    setLocalSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/timeline-tree/${hostname}`);
      const data = await res.json();
      setTreeData(data.tree || []);
      if (isInitial) setLoading(false);
      setLocalSyncing(false);
    } catch (err) {
      if (isInitial) { setLoading(false); setError("Vault sync failed"); }
      setLocalSyncing(false);
    }
  }, [hostname, setLoading, setError]);

  useEffect(() => { fetchTree(true); }, [fetchTree]);

  const flatEvents = useMemo(() => {
    const uniquePids = new Map();
    const flatten = (nodes) => {
      nodes.forEach(node => {
        const latestEvent = node.events[node.events.length - 1];
        if (latestEvent && (!uniquePids.has(node.pid) || new Date(latestEvent.timestamp) > new Date(uniquePids.get(node.pid).timestamp))) {
          uniquePids.set(node.pid, { ...latestEvent, pid: node.pid, ppid: node.ppid, full_node: node });
        }
        if (node.children) flatten(node.children);
      });
    };
    flatten(treeData);
    return Array.from(uniquePids.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [treeData]);

  const focusedTreeBranch = useMemo(() => {
    if (!selectedNode) return [];
    const findTargetAndPrune = (nodes) => {
      for (let node of nodes) {
        if (node.pid === selectedNode.pid) return { ...node };
        if (node.children) {
          const matchingChild = findTargetAndPrune(node.children);
          if (matchingChild) return { ...node, children: [matchingChild] };
        }
      }
      return null;
    };
    const result = findTargetAndPrune(treeData);
    return result ? [result] : [];
  }, [treeData, selectedNode]);

  const filteredEvents = flatEvents.filter(ev => 
    ev.pid.toString().includes(searchTerm) || 
    (ev.details?.PROCESS_CMD || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ev.details?.PROCESS_NAME || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col overflow-hidden font-inter">
      {/* Integrated Header and Main Content */}
      <main className="flex-1 pt-8 pb-12 px-6 md:px-12 w-full flex flex-col lg:flex-row gap-8 overflow-hidden transition-all duration-500">
        
        {/* LEFT COLUMN: REGISTRY & LOCAL HEADER */}
        <div className={`flex flex-col space-y-6 transition-all duration-500 h-full ${selectedNode ? 'hidden lg:flex lg:w-[400px] shrink-0' : 'w-full'}`}>

{/* LEFT COLUMN: REGISTRY & LOCAL HEADER */}
<div className={`flex flex-col space-y-6 transition-all duration-500 h-full ${selectedNode ? 'hidden lg:flex lg:w-[400px] shrink-0' : 'w-full'}`}>

  {/* ================= MOBILE HEADER ================= */}
  <div className="md:hidden flex justify-center items-center mb-4">
    <h1 className="font-inter text-lg font-bold tracking-tight text-white text-center uppercase">
      Forensic Timeline
    </h1>
  </div>

  {/* ================= DESKTOP HEADER ================= */}
  <div className="hidden md:flex items-center gap-4 mb-2">
    <button 
      onClick={() => navigate(-1)} 
      className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
    >
      <ChevronLeft size={20} className="text-cyan-400" />
    </button>

    <div className="space-y-1">
      <h1 className="font-inter text-2xl font-bold tracking-tight text-white">
        Forensic Timeline
      </h1>
      <p className="font-roboto-condensed text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em]">
        Node_Analysis :: {hostname}
      </p>
    </div>
  </div>
   </div>

{/* MOBILE OPTIMIZED PROCESS REGISTRY */}
          <header className="bg-white/[0.02] border border-white/10 p-4 rounded-[1.8rem] flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
               <span className="font-roboto-condensed text-[9px] font-black text-cyan-400 uppercase tracking-widest">Process_Registry</span>
               <button onClick={() => fetchTree()} className="p-2 bg-white/5 rounded-lg active:scale-90 transition-transform">
                <RefreshCw size={14} className={localSyncing ? 'animate-spin text-cyan-400' : 'text-gray-600'}/>
               </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
              <input 
                type="text" 
                placeholder="FILTER PID / PROCESS..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="font-roboto-condensed bg-black/40 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-[10px] font-bold text-cyan-400 uppercase outline-none w-full focus:border-cyan-500/50 placeholder:text-gray-800" 
              />
            </div>
          </header>

          {/* TABLE REPLACED BY CARDS ON MOBILE FOR BETTER DENSITY */}
          <div className="flex-1 overflow-y-auto cyber-scroll space-y-3 pb-24">
            {filteredEvents.map((ev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedNode(ev)}
                className={`p-4 rounded-2xl border transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden
                  ${selectedNode?.pid === ev.pid ? 'bg-white text-black border-white' : 'bg-white/[0.03] border-white/5'}`}
              >
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1">
                    <p className={`font-roboto-condensed text-[11px] font-black uppercase ${selectedNode?.pid === ev.pid ? 'text-black' : 'text-cyan-400'}`}>
                      {ev.event_type}
                    </p>
                    <p className={`font-jetbrains text-[10px] ${selectedNode?.pid === ev.pid ? 'text-black/60' : 'text-gray-500'}`}>
                      PID: {ev.pid}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-roboto-condensed text-[9px] font-bold ${selectedNode?.pid === ev.pid ? 'text-black/40' : 'text-gray-600'}`}>
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: INVESTIGATION (MOBILE FULL-SCREEN OVERLAY) */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[2000] flex flex-col bg-[#020617] overflow-hidden shadow-2xl h-full"
            >
              {/* Tactical Overlay Header */}
              <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedNode(null)} 
                    className="p-2 bg-white/5 rounded-xl active:scale-90 transition-all"
                  >
                    <ChevronLeft size={20} className="text-cyan-400" />
                  </button>
                  
                  <div className="flex bg-black/60 border border-white/10 rounded-xl p-1">
                    <button 
                      onClick={() => setViewMode('table')} 
                      className={`px-4 py-1.5 text-[9px] font-black rounded-lg uppercase transition-all ${viewMode === 'table' ? 'bg-white text-black' : 'text-gray-600'}`}
                    >
                      Inspector
                    </button>
                    <button 
                      onClick={() => setViewMode('tree')} 
                      className={`px-4 py-1.5 text-[9px] font-black rounded-lg uppercase transition-all ${viewMode === 'tree' ? 'bg-white text-black' : 'text-gray-600'}`}
                    >
                      Ancestry
                    </button>
                  </div>
                </div>
                <button onClick={() => setSelectedNode(null)} className="p-2 bg-white/5 rounded-full">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              {/* Overlay Content */}
              <div className="flex-1 overflow-y-auto cyber-scroll p-4 space-y-6">
                {viewMode === 'table' ? (
                  <div className="space-y-6">
                    {/* Compact Mobile Stats */}
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 text-center">
                           <p className="font-roboto-condensed text-[7px] font-black text-gray-500 uppercase tracking-widest mb-1">PID</p>
                           <p className="font-jetbrains text-lg font-bold text-white">{selectedNode.pid}</p>
                        </div>
                        <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 text-center">
                           <p className="font-roboto-condensed text-[7px] font-black text-gray-500 uppercase tracking-widest mb-1">Parent</p>
                           <p className="font-jetbrains text-lg font-bold text-gray-400">{selectedNode.ppid || "0"}</p>
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        <h3 className="font-roboto-condensed text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] px-2">Node_Event_Payloads</h3>
                        {selectedNode.full_node.events.map((ev, idx) => (
                           <div key={idx} className="bg-black/60 rounded-2xl border border-white/5 p-5 shadow-inner relative group">
                              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                                 <span className="font-roboto-condensed text-cyan-400 text-[10px] font-black uppercase tracking-wider">{ev.event_type}</span>
                                 <span className="font-jetbrains text-gray-700 text-[8px]">#00{idx + 1}</span>
                              </div>
                              <pre className="font-jetbrains text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap overflow-x-auto">
                                 {JSON.stringify(ev.details, null, 2)}
                              </pre>
                           </div>
                        ))}
                     </div>
                  </div>
                ) : (
                  <div className="min-h-full flex items-center justify-center p-4 overflow-x-auto">
                    <div className="inline-flex py-10 scale-[0.75] origin-center">
                      {focusedTreeBranch.map((root, i) => (
                        <HorizontalTreeNode key={i} node={root} selectedPid={selectedNode?.pid} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ProcessTree;