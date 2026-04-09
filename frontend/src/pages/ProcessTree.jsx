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
          
          {/* HEADER SECTION WITH BACK BUTTON */}
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => navigate(-1)} 
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
            >
              <ChevronLeft size={20} className="text-cyan-400" />
            </button>
            <div className="space-y-1">
              <h1 className="font-inter text-2xl font-bold tracking-tight text-white">Forensic Timeline</h1>
              <p className="font-roboto-condensed text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em]">
                Node_Analysis :: {hostname}
              </p>
            </div>
          </div>

          {/* ... rest of your list/table ... */}
        </div>

          <header className="bg-white/[0.02] border border-white/5 p-4 rounded-[2rem] flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
               <span className="font-roboto-condensed text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Process_Registry</span>
               <button onClick={() => fetchTree()} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <RefreshCw size={14} className={localSyncing ? 'animate-spin text-cyan-400' : 'text-gray-500'}/>
               </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
              <input 
                type="text" 
                placeholder="FILTER PID OR PROCESS..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="font-roboto-condensed bg-black/40 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-[10px] font-bold text-cyan-400 uppercase outline-none w-full focus:border-cyan-500/50 placeholder:text-gray-700" 
              />
            </div>
          </header>

          <div className="flex-1 bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-inner flex flex-col">
            <div className="overflow-y-auto cyber-scroll flex-1">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#0a0c14] z-20 border-b border-white/5">
                  <tr className="font-roboto-condensed text-[9px] font-bold uppercase text-gray-500 tracking-widest">
                    <th className="px-6 py-4">Event</th>
                    <th className="px-4 py-4 text-right">PID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEvents.map((ev, i) => (
                    <tr key={i} onClick={() => setSelectedNode(ev)} className={`group cursor-pointer hover:bg-cyan-500/[0.05] transition-all ${selectedNode?.pid === ev.pid ? 'bg-white text-black' : ''}`}>
                      <td className="px-6 py-4">
                        <p className={`font-roboto-condensed text-[11px] font-bold uppercase ${selectedNode?.pid === ev.pid ? 'text-black' : 'text-cyan-400'}`}>{ev.event_type}</p>
                        <p className={`font-roboto-condensed text-[9px] font-medium ${selectedNode?.pid === ev.pid ? 'text-black/60' : 'text-gray-500'}`}>{new Date(ev.timestamp).toLocaleTimeString([], { hour12: false })}</p>
                      </td>
                      <td className={`font-jetbrains px-4 py-4 text-right font-bold text-xs ${selectedNode?.pid === ev.pid ? 'text-black' : 'text-white'}`}>{ev.pid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INVESTIGATION (WIDER) */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col bg-[#05070a] border border-white/10 lg:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl h-full"
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedNode(null)} 
                    className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <ChevronLeft size={18} className="text-cyan-400" />
                  </button>
                  
                  <div className="font-roboto-condensed flex bg-black/40 border border-white/10 rounded-2xl p-1">
                    <button onClick={() => setViewMode('table')} className={`px-6 py-2 text-[10px] font-bold rounded-xl uppercase transition-all ${viewMode === 'table' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Inspector</button>
                    <button onClick={() => setViewMode('tree')} className={`px-6 py-2 text-[10px] font-bold rounded-xl uppercase transition-all ${viewMode === 'tree' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Ancestry Tree</button>
                  </div>
                </div>
                
                <button onClick={() => setSelectedNode(null)} className="hidden lg:flex p-2 bg-white/5 hover:bg-red-500/20 rounded-full transition-colors">
                  <X size={18}/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto cyber-scroll bg-[radial-gradient(circle_at_center,_#ffffff03_1px,_transparent_1px)] bg-[size:32px_32px]">
                {viewMode === 'table' ? (
                  <div className="p-10 space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5">
                           <p className="font-roboto-condensed text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Process_PID</p>
                           <p className="font-jetbrains text-2xl font-bold text-white">{selectedNode.pid}</p>
                        </div>
                        <div className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5">
                           <p className="font-roboto-condensed text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Parent_PID</p>
                           <p className="font-jetbrains text-2xl font-bold text-gray-400">{selectedNode.ppid || "0"}</p>
                        </div>
                        <div className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 md:col-span-2 lg:col-span-1">
                           <p className="font-roboto-condensed text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Timestamp</p>
                           <p className="font-jetbrains text-2xl font-bold text-cyan-500">{new Date(selectedNode.timestamp).toLocaleTimeString()}</p>
                        </div>
                     </div>
                     
                     <div className="space-y-6">
                        <h3 className="font-roboto-condensed text-[10px] font-bold text-gray-500 uppercase tracking-[0.5em] px-4">Node_Event_Stream</h3>
                        {selectedNode.full_node.events.map((ev, idx) => (
                           <div key={idx} className="bg-black/40 rounded-[2.5rem] border border-white/5 p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                                 <span className="font-roboto-condensed text-cyan-400 text-[11px] font-bold uppercase tracking-[0.2em]">{ev.event_type}</span>
                                 <span className="font-roboto-condensed text-gray-600 text-[10px] font-medium">SEQ_00{idx + 1}</span>
                              </div>
                              <pre className="font-jetbrains text-[13px] text-gray-300 leading-relaxed whitespace-pre-wrap selection:bg-cyan-500/30">
                                 {JSON.stringify(ev.details, null, 3)}
                              </pre>
                           </div>
                        ))}
                     </div>
                  </div>
                ) : (
                  <div className="min-h-full flex items-center justify-center p-12 overflow-x-auto">
                    <div className="inline-flex py-10">
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