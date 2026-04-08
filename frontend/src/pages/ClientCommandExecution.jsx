import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom"; // Added useOutletContext
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Send, Activity, Clock, Cpu, XOctagon,
  FileText, Globe, Server, Hash, GitBranch, Search, Info,
  ChevronRight, Zap, Wifi, Package, Settings, List,
  FolderOpen, Trash2, FilePlus, Copy, Move, Shield,
  HardDrive, Eye, RefreshCw, Play, Square, Radio,
  Network, Database, AlertCircle, Layers, Code,
  ArrowUpRight, MoreHorizontal, Minus, X, ChevronDown,
  LayoutGrid, Slash
} from "lucide-react";

const API_BASE = "http://172.24.16.81:8001/client";

// ... [Keep COMMAND_GROUPS and COLOR map exactly as they were] ...

// ─── ARG MODAL ────────────────────────────────────────────────────────────────
const ArgModal = ({ cmd, group, onSubmit, onClose }) => {
  const [vals, setVals] = useState(
    Object.fromEntries((cmd.args || []).map(a => [a.key, ""]))
  );
  const firstRef = useRef(null);
  const c = COLOR[group?.color || "cyan"];

  useEffect(() => { firstRef.current?.focus(); }, []);
  const set = (k, v) => setVals(p => ({ ...p, [k]: v }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 16, opacity: 0 }}
        className="w-full max-w-md bg-[#070912] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className={`w-1 h-5 rounded-full ${c.dot}`} />
            <div>
              <p className="font-mono text-[11px] font-bold text-white tracking-widest uppercase">{cmd.action}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white"><X size={13} /></button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          {cmd.args.map((a, i) => (
            <div key={a.key} className="flex flex-col gap-2">
              <span className="font-mono text-[9px] font-bold uppercase text-gray-500">{a.label}</span>
              <input
                ref={i === 0 ? firstRef : null}
                value={vals[a.key]}
                onChange={e => set(a.key, e.target.value)}
                placeholder={a.placeholder}
                className="bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 font-mono text-xs text-gray-200 focus:outline-none focus:border-cyan-500/40"
              />
            </div>
          ))}
        </div>
        <div className="px-6 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 font-mono text-[10px]">Cancel</button>
          <button onClick={() => onSubmit(vals)} className={`px-5 py-2 rounded-xl border font-mono text-[10px] font-bold ${c.badge}`}>Execute</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ... [Keep CmdButton and QuickShell exactly as they were] ...

const ClientCommandExecution = ({ setLoading, setError }) => {
  const { hostname } = useParams();
  const terminalRef = useRef(null);
  
  // 1. Neural Link: Safe Context Access
  const context = useOutletContext();
  const setHeaderData = context?.setHeaderData;

  const [isOnline, setIsOnline] = useState(false);
  const [activeGroup, setActiveGroup] = useState(COMMAND_GROUPS[0].id);
  const [modal, setModal] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeIdx, setActiveIdx] = useState(null);
  const [runningCmds, setRunningCmds] = useState(new Set());

  // 2. Sync Topbar Identity
  useEffect(() => {
    if (setHeaderData) {
      setHeaderData({
        name: `Console: ${hostname}`,
        desc: "Direct_System_Control_Interface // Protocol: gRPC v4"
      });
    }
  }, [hostname, setHeaderData]);

  // 3. Polling for Online Status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const r = await fetch(`${API_BASE}/status/${hostname}`);
        if (r.ok) {
          const data = await r.json();
          setIsOnline(data.online);
        }
      } catch {}
    };
    checkStatus();
    const t = setInterval(checkStatus, 5000);
    return () => clearInterval(t);
  }, [hostname]);

  const addEntry = useCallback((id, action, content, status = "pending") => {
    const entry = { id, action, content, status, ts: new Date().toLocaleTimeString() };
    setHistory(h => [entry, ...h]);
    setActiveIdx(0);
    return entry;
  }, []);

  const updateEntry = useCallback((id, content, status) => {
    setHistory(h => h.map(e => e.id === id ? { ...e, content, status } : e));
    setRunningCmds(s => { const n = new Set(s); n.delete(id); return n; });
  }, []);

  const pollResult = useCallback(async (id) => {
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 1500));
      try {
        const res = await fetch(`${API_BASE}/command-result/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && data[0].output?.trim()) {
            updateEntry(id, data[0].output, "done");
            return;
          }
        }
      } catch {}
    }
    updateEntry(id, "⚠ No response after timeout.", "error");
  }, [updateEntry]);

  const dispatch = async (cmd, argsOverride = null) => {
    const args = argsOverride || {};
    try {
      const res = await fetch(`${API_BASE}/command/${hostname}/${cmd.action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Failed");

      const id = json.command_id;
      setRunningCmds(s => new Set(s).add(id));
      addEntry(id, cmd.action, `↳ dispatched [${id}]\n↳ awaiting response...`, "pending");
      pollResult(id);
    } catch (err) {
      addEntry(`err_${Date.now()}`, cmd.action, `✕ ${err.message}`, "error");
    }
  };

  const handleRun = (cmd, argsOverride = null) => {
    if (argsOverride) { dispatch(cmd, argsOverride); return; }
    if (!cmd.args || cmd.args.length === 0) { dispatch(cmd, {}); return; }
    const grp = COMMAND_GROUPS.find(g => g.commands.find(c => c.action === cmd.action));
    setModal({ cmd, group: grp });
  };

  const currentGroup = COMMAND_GROUPS.find(g => g.id === activeGroup);
  const activeEntry = activeIdx !== null && history[activeIdx];

  return (
    // FIX 3: Removed h-screen and fixed background. 
    // This allows the DashboardLayout's scrollbar to manage the page.
    <div className="flex flex-col gap-3 min-h-[calc(100vh-160px)]">
      
      {/* Dynamic Status Bar */}
      <div className="shrink-0 flex items-center justify-between bg-white/[0.018] border border-white/[0.06] px-5 py-2.5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500"}`} />
          <span className="font-mono text-[10px] font-bold text-white/80">{hostname}</span>
          <span className={`font-mono text-[9px] font-bold uppercase ${isOnline ? "text-emerald-500" : "text-rose-500"}`}>
            {isOnline ? "online" : "offline"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] text-gray-500 tracking-wider">gRPC v4 Tunnel</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[200px_1fr_280px] gap-3 min-h-0">
        
        {/* Col 1: Groups */}
        <aside className="hidden lg:flex flex-col bg-white/[0.012] border border-white/[0.05] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.05]">
            <p className="font-mono text-[8px] font-bold uppercase tracking-widest text-gray-600">Groups</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
            {COMMAND_GROUPS.map(g => {
              const active = activeGroup === g.id;
              const c = COLOR[g.color];
              return (
                <button
                  key={g.id}
                  onClick={() => setActiveGroup(g.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${active ? `bg-white/[0.06] ring-1 ${c.ring}` : "hover:bg-white/[0.03]"}`}
                >
                  <g.icon size={11} className={active ? c.tab : "text-gray-600"} />
                  <span className={`font-mono text-[10px] ${active ? "text-white" : "text-gray-500"}`}>{g.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Col 2: Terminal Output */}
        <div className="flex flex-col gap-3 min-h-[500px]">
          <QuickShell active={isOnline} onRun={handleRun} />
          
          <div className="flex-1 bg-[#01030b] border border-white/[0.05] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-white/[0.05] flex justify-between items-center">
              <span className="font-mono text-[9px] text-gray-600">session@{hostname}</span>
              {activeEntry && <StatusBadge status={activeEntry.status} />}
            </div>
            
            <div ref={terminalRef} className="flex-1 p-5 font-mono text-xs leading-relaxed overflow-y-auto scrollbar-thin">
              {!activeEntry ? (
                <div className="text-gray-700">Awaiting input... Select a command to begin.</div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4 text-white/50 border-b border-white/5 pb-2">
                    <ChevronRight size={11} /> <span>{activeEntry.action}</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-gray-300">{activeEntry.content}</pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Col 3: Commands */}
        <aside className="flex flex-col gap-3">
          <div className="flex-1 bg-white/[0.012] border border-white/[0.05] rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/[0.05] font-mono text-[9px] uppercase text-gray-500">
              {currentGroup?.label}
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
              {currentGroup?.commands.map(cmd => (
                <CmdButton
                  key={cmd.action}
                  cmd={cmd}
                  group={currentGroup}
                  active={isOnline}
                  onRun={handleRun}
                  isRunning={[...runningCmds].some(id => id.includes(cmd.action))}
                />
              ))}
            </div>
          </div>

          {/* Mini History */}
          {history.length > 0 && (
            <div className="h-48 bg-black/20 border border-white/5 rounded-2xl overflow-y-auto">
              {history.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => setActiveIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2 border-b border-white/5 font-mono text-[10px] ${activeIdx === i ? "bg-white/5" : ""}`}
                >
                  <span className={e.status === "done" ? "text-emerald-400" : "text-amber-400"}>·</span>
                  <span className="text-gray-400 truncate">{e.action}</span>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>

      <AnimatePresence>
        {modal && (
          <ArgModal
            cmd={modal.cmd}
            group={modal.group}
            onSubmit={args => { dispatch(modal.cmd, args); setModal(null); }}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientCommandExecution;