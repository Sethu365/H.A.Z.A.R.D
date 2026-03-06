import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, Activity, Search, X, List, 
  Clock, Shield, Cpu, GitBranch, Download, RefreshCw
} from "lucide-react";

const API_BASE = "http://172.24.16.81:8001/client";

const HorizontalTreeNode = ({ node, selectedPid }) => {
  const getEventDetail = (details, keys) => {
    for (const key of keys) {
      if (details[key]) return details[key];
    }
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
        className={`
          relative flex flex-col min-w-[300px] max-w-[350px] p-4 rounded-xl border shadow-2xl z-10 transition-all duration-300
          ${isSelected 
            ? "bg-cyan-950/40 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400" 
            : "bg-slate-900/90 border-slate-700 hover:border-slate-500"}
        `}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-cyan-400 animate-pulse shadow-[0_0_8px_cyan]" : "bg-slate-500"}`} />
            <span className="text-[10px] font-black uppercase text-white tracking-widest">{eventType}</span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono font-bold">{timestamp}</span>
        </div>
        
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-cyan-400 font-mono break-all leading-tight">{filePath}</p>
          <div className="bg-black/60 p-2 rounded border border-slate-800/50">
            <p className="text-[10px] text-slate-400 font-mono leading-relaxed line-clamp-2 italic">
              {command || "No arguments available"}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/50 flex justify-between text-[9px] font-mono">
          <span className="text-slate-500 uppercase tracking-tighter">pid: <span className="text-white">{node.pid}</span></span>
          <span className="text-slate-500 uppercase tracking-tighter">ppid: <span className="text-slate-400">{node.ppid || "0"}</span></span>
        </div>
      </motion.div>

      {node.children && node.children.length > 0 && (
        <>
          <div className="w-16 h-[2px] bg-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.5)] relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_cyan]" />
          </div>
          <div className="flex flex-col gap-12 ml-2">
            {node.children.map((child, i) => (
              <HorizontalTreeNode key={i} node={child} selectedPid={selectedPid} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ProcessTree = () => {
  const { hostname } = useParams();
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/timeline-tree/${hostname}`);
      if (res.ok) {
        const data = await res.json();
        setTreeData(data.tree || []);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [hostname]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // FIXED DE-DUPLICATION LOGIC
  const flatEvents = useMemo(() => {
    const uniquePids = new Map(); // Use a Map to keep track of unique PIDs

    const flatten = (nodes) => {
      nodes.forEach(node => {
        // Find the latest event for this node to display in the table
        const latestEvent = node.events[node.events.length - 1];
        
        // If we haven't seen this PID yet, or this event is newer, add/update it
        if (latestEvent && (!uniquePids.has(node.pid) || new Date(latestEvent.timestamp) > new Date(uniquePids.get(node.pid).timestamp))) {
          uniquePids.set(node.pid, { 
            ...latestEvent, 
            pid: node.pid, 
            ppid: node.ppid, 
            full_node: node 
          });
        }
        
        if (node.children) flatten(node.children);
      });
    };

    flatten(treeData);
    
    // Convert Map back to array and sort by time descending
    return Array.from(uniquePids.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [treeData]);

  const focusedTreeBranch = useMemo(() => {
    if (!selectedNode || viewMode === 'table') return [];
    
    const findTargetAndPrune = (nodes) => {
      for (let node of nodes) {
        if (node.pid === selectedNode.pid) {
          return { ...node };
        }
        if (node.children && node.children.length > 0) {
          const matchingChild = findTargetAndPrune(node.children);
          if (matchingChild) {
            return { ...node, children: [matchingChild] };
          }
        }
      }
      return null;
    };
    
    const result = findTargetAndPrune(treeData);
    return result ? [result] : [];
  }, [treeData, selectedNode, viewMode]);

  const filteredEvents = flatEvents.filter(ev => 
    ev.pid.toString().includes(searchTerm) || 
    (ev.details?.PROCESS_CMD || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ev.details?.PROCESS_NAME || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 overflow-hidden font-mono">
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
        <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/10">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">Timeline</h1>
            <div className="flex bg-black border border-slate-800 rounded-lg p-1">
               <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 text-[10px] font-bold rounded uppercase transition-all ${viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'}`}>Table</button>
               <button onClick={() => setViewMode('tree')} disabled={!selectedNode} className={`px-4 py-1.5 text-[10px] font-bold rounded uppercase transition-all ${viewMode === 'tree' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white disabled:opacity-30'}`}>Ancestry Tree</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchTree} className="p-2 hover:bg-white/5 text-slate-400 border border-slate-800 rounded-lg"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/></button>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="FILTER PID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-black border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-[11px] text-cyan-500 outline-none w-64" />
            </div>
          </div>
        </header>

        {viewMode === "table" ? (
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            <table className="w-full border-separate border-spacing-0 text-left">
              <thead className="sticky top-0 bg-[#020617] z-20">
                <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-widest bg-black/60">
                  <th className="px-6 py-4 w-40">Timestamp</th>
                  <th className="px-6 py-4 w-48 text-cyan-500">Event</th>
                  <th className="px-6 py-4 w-32">Identifier</th>
                  <th className="px-6 py-4">Arguments</th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                {filteredEvents.map((ev, i) => (
                  <tr key={i} onClick={() => setSelectedNode(ev)} className={`border-b border-slate-800/40 cursor-pointer transition-colors ${selectedNode?.pid === ev.pid ? 'bg-cyan-500/10' : 'hover:bg-white/5'}`}>
                    <td className="px-6 py-3 text-slate-500">{new Date(ev.timestamp).toLocaleTimeString([], { hour12: false })}</td>
                    <td className="px-6 py-3 font-black text-cyan-400 uppercase tracking-tighter">{ev.event_type}</td>
                    <td className="px-6 py-3 font-bold text-gray-400">PID: {ev.pid}</td>
                    <td className="px-6 py-3 text-slate-400 truncate max-w-md italic">{ev.details?.PROCESS_CMD || ev.details?.PROCESS_NAME || "---"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-12 bg-black bg-[radial-gradient(circle_at_center,_#111_1px,_transparent_1px)] bg-[size:32px_32px]">
             <div className="inline-flex py-10">
               {focusedTreeBranch.map((root, i) => (
                 <HorizontalTreeNode key={i} node={root} selectedPid={selectedNode?.pid} />
               ))}
             </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="w-[500px] bg-[#020617] border-l border-slate-800 flex flex-col shadow-2xl relative z-30">
             <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
                <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Forensic Inspector</h2>
                <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-black/50 p-4 rounded border border-slate-800">
                     <p className="text-[8px] text-slate-500 uppercase mb-1">Process PID</p>
                     <p className="text-xs font-bold text-white tracking-tighter">{selectedNode.pid}</p>
                   </div>
                   <div className="bg-black/50 p-4 rounded border border-slate-800">
                     <p className="text-[8px] text-slate-500 uppercase mb-1">Parent PID</p>
                     <p className="text-xs font-bold text-white tracking-tighter">{selectedNode.ppid || "0"}</p>
                   </div>
                </div>
                {/* LIST ALL EVENTS FOR THIS SPECIFIC PID HERE */}
                <div className="space-y-4">
                  <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Node Event Stream</h3>
                  {selectedNode.full_node.events.map((ev, idx) => (
                    <div key={idx} className="bg-black/80 rounded-xl border border-slate-800 p-4">
                       <div className="flex justify-between items-center mb-2 border-b border-slate-800/50 pb-2">
                          <span className="text-cyan-500 text-[10px] font-black uppercase">{ev.event_type}</span>
                          <span className="text-slate-600 text-[9px] font-mono">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                       </div>
                       <pre className="text-[10px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap">{JSON.stringify(ev.details, null, 2)}</pre>
                    </div>
                  ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProcessTree;