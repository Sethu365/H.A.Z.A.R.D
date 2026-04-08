import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useOutletContext } from "react-router-dom"; // Added useOutletContext
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, X, RefreshCw, ChevronRight
} from "lucide-react";

const API_BASE = "http://172.24.16.81:8001/client";

// --- Keep HorizontalTreeNode exactly as it was ---
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
        className={`relative flex flex-col min-w-[280px] max-w-[320px] p-5 rounded-[1.5rem] border transition-all duration-500 shadow-2xl z-10
          ${isSelected ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]" : "bg-white/[0.02] border-white/5 backdrop-blur-md hover:border-cyan-500/30"}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-black animate-pulse" : "bg-cyan-500"}`} />
            <span className={`font-roboto-condensed text-[9px] font-black uppercase tracking-widest ${isSelected ? "text-black" : "text-gray-400"}`}>{eventType}</span>
          </div>
          <span className={`font-jetbrains text-[9px] font-bold ${isSelected ? "text-black/60" : "text-gray-500"}`}>{timestamp}</span>
        </div>
        <div className="space-y-3">
          <p className={`font-inter text-xs font-black uppercase tracking-tight break-all leading-tight ${isSelected ? "text-black" : "text-cyan-400"}`}>{filePath}</p>
          <div className={`${isSelected ? "bg-black/10" : "bg-black/40"} p-3 rounded-xl border ${isSelected ? "border-black/10" : "border-white/5"}`}>
            <p className={`font-jetbrains text-[10px] leading-relaxed line-clamp-2 ${isSelected ? "text-black/70" : "text-gray-400"}`}>{command || "No arguments"}</p>
          </div>
        </div>
      </motion.div>
      {node.children && node.children.length > 0 && (
        <>
          <div className="w-8 h-[1px] bg-white/10 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-cyan-500" />
          </div>
          <div className="flex flex-col gap-6 ml-2">
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
  
  // 1. Neural Link: Safe Context Access
  const context = useOutletContext();
  const setHeaderData = context?.setHeaderData;

  const [treeData, setTreeData] = useState([]);
  const [localSyncing, setLocalSyncing] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");

  // 2. Sync Topbar Identity via Layout Context
  useEffect(() => {
    if (setHeaderData) {
      setHeaderData({
        name: "Forensic Timeline",
        desc: `Node_Analysis // Host: ${hostname}`
      });
    }
  }, [hostname, setHeaderData]);

  const fetchTree = useCallback(async (isInitial = false) => {
    if (isInitial) { 
      setLoading?.(true); 
      setError?.(null); 
    }
    setLocalSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/timeline-tree/${hostname}`);
      const data = await res.json();
      setTreeData(data.tree || []);
      if (isInitial) setLoading?.(false);
      setLocalSyncing(false);
    } catch (err) {
      if (isInitial) { 
        setLoading?.(false); 
        setError?.("Forensic Registry Link Failure"); 
      }
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
    // 3. Removed min-h-screen/pt-24 (handled by DashboardLayout)
    // Adjusted h-full to fit within the layout's viewport
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-160px)] h-full selection:bg-cyan-500/30">
        
        {/* LEFT COLUMN: REGISTRY */}
        <div className={`flex flex-col space-y-6 transition-all duration-500 ${selectedNode ? 'hidden lg:flex lg:w-1/3 xl:w-1/4' : 'w-full'}`}>
          <header className="bg-white/[0.02] border border-white/5 p-4 rounded-[2rem] flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
               <span className="font-roboto-condensed text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Process_Registry</span>
               <button onClick={() => fetchTree()} className="p-2 bg-white/5 rounded-lg">
                <RefreshCw size={14} className={localSyncing ? 'animate-spin text-cyan-400' : 'text-gray-500'}/>
               </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
              <input 
                type="text" 
                placeholder="Filter PID..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="font-roboto-condensed bg-black/40 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-[10px] font-black text-cyan-400 uppercase outline-none w-full focus:border-cyan-500/50" 
              />
            </div>
          </header>

          <div className="flex-1 bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-inner flex flex-col">
            <div className="overflow-y-auto cyber-scroll flex-1">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#0a0c14] z-20 border-b border-white/5">
                  <tr className="font-roboto-condensed text-[9px] font-black uppercase text-gray-700 tracking-widest">
                    <th className="px-6 py-4">Event</th>
                    <th className="px-4 py-4 text-right">PID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEvents.map((ev, i) => (
                    <tr key={i} onClick={() => setSelectedNode(ev)} className={`group cursor-pointer hover:bg-cyan-500/[0.05] transition-all ${selectedNode?.pid === ev.pid ? 'bg-white text-black' : ''}`}>
                      <td className="px-6 py-4">
                        <p className={`font-roboto-condensed text-[11px] font-black uppercase ${selectedNode?.pid === ev.pid ? 'text-black' : 'text-cyan-400'}`}>{ev.event_type}</p>
                        <p className={`font-jetbrains text-[9px] font-bold ${selectedNode?.pid === ev.pid ? 'text-black/60' : 'text-gray-500'}`}>{new Date(ev.timestamp).toLocaleTimeString([], { hour12: false })}</p>
                      </td>
                      <td className={`font-jetbrains px-4 py-4 text-right font-bold text-xs ${selectedNode?.pid === ev.pid ? 'text-black' : 'text-white'}`}>{ev.pid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INVESTIGATION */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 50 }}
              className="flex-1 flex flex-col bg-[#05070a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl h-full"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <div className="font-roboto-condensed flex bg-black/40 border border-white/10 rounded-2xl p-1.5">
                   <button onClick={() => setViewMode('table')} className={`px-6 py-2 text-[10px] font-black rounded-xl uppercase transition-all ${viewMode === 'table' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Inspector</button>
                   <button onClick={() => setViewMode('tree')} className={`px-6 py-2 text-[10px] font-black rounded-xl uppercase transition-all ${viewMode === 'tree' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Ancestry Tree</button>
                </div>
                <button onClick={() => setSelectedNode(null)} className="p-2 bg-white/5 hover:bg-red-500/20 rounded-full transition-colors"><X size={20} className="text-gray-500 hover:text-white"/></button>
              </div>

              <div className="flex-1 overflow-y-auto cyber-scroll bg-[radial-gradient(circle_at_center,_#ffffff03_1px,_transparent_1px)] bg-[size:24px_24px]">
                {viewMode === 'table' ? (
                  <div className="p-8 space-y-8">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] p-6 rounded-[1.5rem] border border-white/5">
                           <p className="font-roboto-condensed text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Process_PID</p>
                           <p className="font-jetbrains text-xl font-black text-white">{selectedNode.pid}</p>
                        </div>
                        <div className="bg-white/[0.02] p-6 rounded-[1.5rem] border border-white/5">
                           <p className="font-roboto-condensed text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Parent_PID</p>
                           <p className="font-jetbrains text-xl font-black text-gray-400">{selectedNode.ppid || "0"}</p>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h3 className="font-roboto-condensed text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] px-2">Node_Event_Stream</h3>
                        {selectedNode.full_node.events.map((ev, idx) => (
                           <div key={idx} className="bg-black/60 rounded-[2rem] border border-white/5 p-6 md:p-8 shadow-2xl relative overflow-hidden group">
                              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                                 <span className="font-roboto-condensed text-cyan-400 text-[10px] font-black uppercase tracking-widest">{ev.event_type}</span>
                                 <span className="font-jetbrains text-gray-600 text-[10px] font-bold">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <pre className="font-jetbrains text-xs text-gray-300 leading-relaxed whitespace-pre-wrap selection:bg-cyan-500/30">
                                 {JSON.stringify(ev.details, null, 2)}
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
    </div>
  );
};

export default ProcessTree;