import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams,useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Send, Activity, Clock, Cpu, XOctagon,
  FileText, Globe, Server, Hash, GitBranch, Search, Info,
  ChevronRight, Zap, Wifi, Package, Settings, List,
  FolderOpen, Trash2, FilePlus, Copy, Move, Shield,
  HardDrive, Eye, RefreshCw, Play, Square, Radio,
  Network, Database, AlertCircle, Layers, Code,
  ArrowUpRight, MoreHorizontal, Minus, X, ChevronDown,
  LayoutGrid, Slash, ArrowLeft
} from "lucide-react";
import { use } from "react";


const API_BASE = "http://172.24.16.81:8001/client";

// ─── COMMAND CATALOGUE (chmod, pkg_install, pkg_remove removed) ───────────────
const COMMAND_GROUPS = [
  {
    id: "shell",
    label: "Shell",
    icon: Terminal,
    color: "cyan",
    commands: [
      { action: "shell",               label: "Run Command",    icon: Terminal, args: [{ key: "command", label: "Shell Command", placeholder: "ls -la /etc" }, { key: "cwd", label: "Working Dir (optional)", placeholder: "/tmp" }] },
      { action: "shell_session_start", label: "Start Session",  icon: Play,     args: [{ key: "session_id", label: "Session ID (optional)", placeholder: "sess_1" }, { key: "cwd", label: "Working Dir", placeholder: "/" }] },
      { action: "shell_session_run",   label: "Session Exec",   icon: Code,     args: [{ key: "session_id", label: "Session ID", placeholder: "sess_1" }, { key: "command", label: "Command", placeholder: "cd /tmp && ls" }] },
      { action: "shell_session_kill",  label: "Kill Session",   icon: Square,   args: [{ key: "session_id", label: "Session ID", placeholder: "sess_1" }] },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: Cpu,
    color: "violet",
    commands: [
      { action: "ping",    label: "Ping",        icon: Activity, args: [] },
      { action: "uptime",  label: "Uptime",      icon: Clock,    args: [] },
      { action: "sysinfo", label: "System Info", icon: Server,   args: [] },
    ],
  },
  {
    id: "network",
    label: "Network",
    icon: Globe,
    color: "sky",
    commands: [
      { action: "netstat",        label: "Netstat",     icon: Network,      args: [] },
      { action: "ping_host",      label: "Ping Host",   icon: Radio,        args: [{ key: "host", label: "Host", placeholder: "8.8.8.8" }, { key: "count", label: "Count", placeholder: "4" }] },
      { action: "traceroute",     label: "Traceroute",  icon: ArrowUpRight, args: [{ key: "host", label: "Host", placeholder: "8.8.8.8" }] },
      { action: "dns_lookup",     label: "DNS Lookup",  icon: Search,       args: [{ key: "host", label: "Hostname", placeholder: "example.com" }] },
      { action: "port_scan",      label: "Port Scan",   icon: Shield,       args: [{ key: "host", label: "Host", placeholder: "127.0.0.1" }, { key: "ports", label: "Port Range", placeholder: "1-1024" }] },
      { action: "bandwidth_test", label: "Bandwidth",   icon: Zap,          args: [{ key: "interface", label: "Interface", placeholder: "eth0" }, { key: "interval", label: "Interval (s)", placeholder: "2" }] },
    ],
  },
  {
    id: "processes",
    label: "Processes",
    icon: Hash,
    color: "amber",
    commands: [
      { action: "list_processes", label: "List All",     icon: List,      args: [] },
      { action: "top_processes",  label: "Top Load",     icon: Cpu,       args: [{ key: "n", label: "Count", placeholder: "20" }, { key: "sort", label: "Sort By (%cpu/%mem)", placeholder: "%cpu" }] },
      { action: "kill_process",   label: "Kill PID",     icon: XOctagon,  args: [{ key: "pid", label: "PID", placeholder: "1234" }, { key: "signal", label: "Signal", placeholder: "TERM" }] },
      { action: "process_tree",   label: "Process Tree", icon: GitBranch, args: [] },
      { action: "process_info",   label: "Process Info", icon: Info,      args: [{ key: "pid", label: "PID", placeholder: "1234" }] },
      { action: "watch_process",  label: "Watch PID",    icon: Eye,       args: [{ key: "pid", label: "PID", placeholder: "1234" }, { key: "samples", label: "Samples", placeholder: "5" }] },
    ],
  },
  {
    id: "files",
    label: "Files",
    icon: FolderOpen,
    color: "emerald",
    commands: [
      { action: "list_files",   label: "List Files",  icon: FolderOpen, args: [{ key: "path", label: "Path", placeholder: "/" }] },
      { action: "read_file",    label: "Read File",   icon: FileText,   args: [{ key: "path", label: "File Path", placeholder: "/etc/hostname" }] },
      { action: "write_file",   label: "Write File",  icon: FilePlus,   args: [{ key: "path", label: "File Path", placeholder: "/tmp/test.txt" }, { key: "content", label: "Content", placeholder: "Hello world", multiline: true }, { key: "mode", label: "Mode (w/a)", placeholder: "w" }] },
      { action: "delete_file",  label: "Delete",      icon: Trash2,     args: [{ key: "path", label: "Path", placeholder: "/tmp/test.txt" }] },
      { action: "move_file",    label: "Move",        icon: Move,       args: [{ key: "src", label: "Source", placeholder: "/tmp/a.txt" }, { key: "dst", label: "Destination", placeholder: "/tmp/b.txt" }] },
      { action: "copy_file",    label: "Copy",        icon: Copy,       args: [{ key: "src", label: "Source", placeholder: "/tmp/a.txt" }, { key: "dst", label: "Destination", placeholder: "/tmp/b_copy.txt" }] },
      { action: "mkdir",        label: "Make Dir",    icon: FolderOpen, args: [{ key: "path", label: "Path", placeholder: "/tmp/newdir" }] },
      { action: "file_info",    label: "File Info",   icon: Info,       args: [{ key: "path", label: "Path", placeholder: "/etc/passwd" }] },
      { action: "file_hash",    label: "File Hash",   icon: Hash,       args: [{ key: "path", label: "Path", placeholder: "/etc/passwd" }, { key: "algo", label: "Algorithm", placeholder: "sha256" }] },
      { action: "search_files", label: "Search",      icon: Search,     args: [{ key: "path", label: "Root Path", placeholder: "/" }, { key: "pattern", label: "Filename Pattern", placeholder: "*.log" }, { key: "content", label: "Content Search (optional)", placeholder: "error" }] },
      { action: "tail_file",    label: "Tail File",   icon: List,       args: [{ key: "path", label: "File Path", placeholder: "/var/log/syslog" }, { key: "lines", label: "Lines", placeholder: "50" }] },
      { action: "disk_usage",   label: "Disk Usage",  icon: HardDrive,  args: [{ key: "path", label: "Path", placeholder: "/" }, { key: "depth", label: "Depth", placeholder: "1" }] },
    ],
  },
  {
    id: "logs",
    label: "Logs",
    icon: FileText,
    color: "rose",
    commands: [
      { action: "journal", label: "Journal", icon: FileText, args: [{ key: "unit", label: "Unit (optional)", placeholder: "nginx.service" }, { key: "since", label: "Since", placeholder: "1 hour ago" }, { key: "priority", label: "Priority (optional)", placeholder: "err" }, { key: "lines", label: "Lines", placeholder: "100" }] },
      { action: "syslog",  label: "Syslog",  icon: List,     args: [{ key: "lines", label: "Lines", placeholder: "100" }] },
    ],
  },
  {
    id: "services",
    label: "Services",
    icon: Settings,
    color: "indigo",
    commands: [
      { action: "list_services",  label: "List Services", icon: List,     args: [] },
      { action: "service_status", label: "Status",        icon: Activity, args: [{ key: "service", label: "Service Name", placeholder: "nginx" }] },
      { action: "service_action", label: "Control",       icon: Play,     args: [{ key: "service", label: "Service Name", placeholder: "nginx" }, { key: "action", label: "Action (start/stop/restart)", placeholder: "restart" }] },
    ],
  },
  {
    id: "env",
    label: "Env",
    icon: Code,
    color: "orange",
    commands: [
      { action: "env_get",   label: "Get Env",   icon: Eye,      args: [{ key: "key", label: "Key (blank = all)", placeholder: "PATH" }] },
      { action: "env_set",   label: "Set Env",   icon: Settings, args: [{ key: "key", label: "Key", placeholder: "MY_VAR" }, { key: "value", label: "Value", placeholder: "hello" }] },
      { action: "cron_list", label: "Cron List", icon: Clock,    args: [{ key: "user", label: "User (optional)", placeholder: "root" }] },
    ],
  },
  {
    id: "packages",
    label: "Packages",
    icon: Package,
    color: "teal",
    commands: [
      { action: "pkg_list", label: "List Pkgs", icon: List, args: [] },
    ],
  },
];

// ─── COLOUR MAP ───────────────────────────────────────────────────────────────
const COLOR = {
  cyan:    { tab: "text-cyan-400",    ring: "ring-cyan-500/40",    btn: "hover:border-cyan-500/50 hover:bg-cyan-500/10",     icon: "text-cyan-400",    dot: "bg-cyan-500",    glow: "shadow-cyan-500/20",    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"    },
  violet:  { tab: "text-violet-400",  ring: "ring-violet-500/40",  btn: "hover:border-violet-500/50 hover:bg-violet-500/10", icon: "text-violet-400",  dot: "bg-violet-500",  glow: "shadow-violet-500/20",  badge: "bg-violet-500/10 text-violet-400 border-violet-500/20"  },
  sky:     { tab: "text-sky-400",     ring: "ring-sky-500/40",     btn: "hover:border-sky-500/50 hover:bg-sky-500/10",       icon: "text-sky-400",     dot: "bg-sky-500",     glow: "shadow-sky-500/20",     badge: "bg-sky-500/10 text-sky-400 border-sky-500/20"     },
  amber:   { tab: "text-amber-400",   ring: "ring-amber-500/40",   btn: "hover:border-amber-500/50 hover:bg-amber-500/10",   icon: "text-amber-400",   dot: "bg-amber-500",   glow: "shadow-amber-500/20",   badge: "bg-amber-500/10 text-amber-400 border-amber-500/20"   },
  emerald: { tab: "text-emerald-400", ring: "ring-emerald-500/40", btn: "hover:border-emerald-500/50 hover:bg-emerald-500/10",icon: "text-emerald-400", dot: "bg-emerald-500", glow: "shadow-emerald-500/20", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rose:    { tab: "text-rose-400",    ring: "ring-rose-500/40",    btn: "hover:border-rose-500/50 hover:bg-rose-500/10",     icon: "text-rose-400",    dot: "bg-rose-500",    glow: "shadow-rose-500/20",    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20"    },
  indigo:  { tab: "text-indigo-400",  ring: "ring-indigo-500/40",  btn: "hover:border-indigo-500/50 hover:bg-indigo-500/10", icon: "text-indigo-400",  dot: "bg-indigo-500",  glow: "shadow-indigo-500/20",  badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"  },
  orange:  { tab: "text-orange-400",  ring: "ring-orange-500/40",  btn: "hover:border-orange-500/50 hover:bg-orange-500/10", icon: "text-orange-400",  dot: "bg-orange-500",  glow: "shadow-orange-500/20",  badge: "bg-orange-500/10 text-orange-400 border-orange-500/20"  },
  teal:    { tab: "text-teal-400",    ring: "ring-teal-500/40",    btn: "hover:border-teal-500/50 hover:bg-teal-500/10",     icon: "text-teal-400",    dot: "bg-teal-500",    glow: "shadow-teal-500/20",    badge: "bg-teal-500/10 text-teal-400 border-teal-500/20"    },
};

const TOTAL_CMDS = COMMAND_GROUPS.reduce((n, g) => n + g.commands.length, 0);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 16, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="w-full max-w-md bg-[#07091280] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
        style={{ backdropFilter: "blur(24px)" }}
      >
        {/* header */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex items-center gap-3">
            <div className={`w-1 h-5 rounded-full ${c.dot}`} />
            <div>
              <p className="font-mono text-[11px] font-bold text-white tracking-widest uppercase">{cmd.action}</p>
              <p className="font-mono text-[9px] text-gray-600 mt-0.5">{cmd.args.length} parameter{cmd.args.length !== 1 ? "s" : ""} required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X size={13} />
          </button>
        </div>

        {/* fields */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {cmd.args.map((a, i) => (
            <div key={a.key} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">{a.label}</span>
                {a.placeholder && (
                  <span className="font-mono text-[9px] text-gray-700">e.g. {a.placeholder}</span>
                )}
              </div>
              {a.multiline ? (
                <textarea
                  rows={4}
                  ref={i === 0 ? firstRef : null}
                  value={vals[a.key]}
                  onChange={e => set(a.key, e.target.value)}
                  placeholder={a.placeholder}
                  className="bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 font-mono text-xs text-gray-200 placeholder-gray-700 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 resize-none transition"
                />
              ) : (
                <input
                  ref={i === 0 ? firstRef : null}
                  value={vals[a.key]}
                  onChange={e => set(a.key, e.target.value)}
                  placeholder={a.placeholder}
                  onKeyDown={e => e.key === "Enter" && onSubmit(vals)}
                  className="bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 font-mono text-xs text-gray-200 placeholder-gray-700 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition"
                />
              )}
            </div>
          ))}
        </div>

        {/* footer */}
        <div className="px-6 pb-5 flex items-center justify-between gap-3">
          <p className="font-mono text-[9px] text-gray-700">Enter to execute</p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/[0.08] text-gray-500 font-mono text-[10px] hover:border-white/[0.14] hover:text-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onSubmit(vals)}
              className={`px-5 py-2 rounded-xl border font-mono text-[10px] font-bold transition flex items-center gap-2 ${c.badge} hover:opacity-80`}
            >
              <Zap size={11} /> Execute
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── COMMAND BUTTON ───────────────────────────────────────────────────────────
const CmdButton = ({ cmd, group, active, onRun, isRunning }) => {
  const c = COLOR[group.color];
  const Icon = cmd.icon;
  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      disabled={!active}
      onClick={() => onRun(cmd)}
      className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] ${c.btn} disabled:opacity-20 disabled:cursor-not-allowed transition-all group text-left w-full overflow-hidden`}
    >
      {isRunning && (
        <motion.div
          className={`absolute inset-0 ${c.dot} opacity-5`}
          animate={{ opacity: [0.05, 0.12, 0.05] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      )}
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/[0.06] group-hover:border-white/[0.12] transition shrink-0`}>
        <Icon size={11} className={c.icon} />
      </div>
      <span className="font-mono text-[10px] font-semibold text-gray-400 group-hover:text-white transition-colors truncate">{cmd.label}</span>
      {isRunning && (
        <motion.div
          className={`ml-auto w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`}
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        />
      )}
    </motion.button>
  );
};

// ─── QUICK SHELL BAR ──────────────────────────────────────────────────────────
const QuickShell = ({ active, onRun }) => {
  const [val, setVal] = useState("");
  const submit = () => {
    if (!val.trim()) return;
    onRun({ action: "shell", args: [{ key: "command", label: "Command", placeholder: "" }] }, { command: val });
    setVal("");
  };
  return (
    <div className="relative flex items-center gap-3 bg-black/50 border border-white/[0.07] rounded-xl px-4 py-3 focus-within:border-cyan-500/30 focus-within:ring-1 focus-within:ring-cyan-500/15 transition group">
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/60" />
        <span className="font-mono text-[10px] text-cyan-500/70 font-bold select-none">$</span>
      </div>
      <input
        disabled={!active}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()}
        placeholder="type any shell command and press Enter…"
        className="flex-1 bg-transparent font-mono text-[11px] text-gray-300 placeholder-gray-700 focus:outline-none disabled:opacity-30 tracking-wide"
      />
      <motion.button
        whileTap={{ scale: 0.9 }}
        disabled={!active || !val.trim()}
        onClick={submit}
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-20 disabled:cursor-not-allowed transition"
      >
        <Send size={11} />
      </motion.button>
    </div>
  );
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    done:    { cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: "✓", label: "Done"    },
    error:   { cls: "text-rose-400 bg-rose-500/10 border-rose-500/20",          icon: "✕", label: "Error"   },
    pending: { cls: "text-amber-400 bg-amber-500/10 border-amber-500/20",       icon: "…", label: "Running" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono text-[9px] font-bold uppercase tracking-wider ${s.cls}`}>
      {status === "pending"
        ? <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>{s.icon}</motion.span>
        : <span>{s.icon}</span>
      }
      {s.label}
    </span>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const ClientCommandExecution = ({ setLoading, setError }) => {
  const { hostname } = useParams();
  const terminalRef = useRef(null);
  const isFirstRender = useRef(true);
  const navigate = useNavigate();
  const [isOnline, setIsOnline]     = useState(false);
  const [activeGroup, setActiveGroup] = useState(COMMAND_GROUPS[0].id);
  const [modal, setModal]           = useState(null);
  const [history, setHistory]       = useState([]);
  const [activeIdx, setActiveIdx]   = useState(null);
  const [runningCmds, setRunningCmds] = useState(new Set());

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
    updateEntry(id, "⚠  No response after timeout.", "error");
  }, [updateEntry]);

  useEffect(() => {
    const go = async () => {
      try {
        const r = await fetch(`${API_BASE}/status/${hostname}`);
        if (r.ok) setIsOnline((await r.json()).online);
      } catch {}
    };
    go();
    const t = setInterval(go, 5000);
    return () => clearInterval(t);
  }, [hostname]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    terminalRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeIdx]);

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
      addEntry(id, cmd.action, `↳ dispatched  [${id}]\n↳ awaiting gRPC response…`, "pending");
      pollResult(id);
    } catch (err) {
      addEntry(`err_${Date.now()}`, cmd.action, `✕  ${err.message}`, "error");
    }
  };

  const handleRun = (cmd, argsOverride = null) => {
    if (argsOverride) { dispatch(cmd, argsOverride); return; }
    if (!cmd.args || cmd.args.length === 0) { dispatch(cmd, {}); return; }
    const grp = COMMAND_GROUPS.find(g => g.commands.find(c => c.action === cmd.action));
    setModal({ cmd, group: grp });
  };

  const currentGroup = COMMAND_GROUPS.find(g => g.id === activeGroup);
  const activeEntry  = activeIdx !== null && history[activeIdx];

  return (
    <div className="min-h-screen bg-[#020617] text-white font-inter">
              {/* HEADER: Inter (Navigation / Title) */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Server size={18} className="text-cyan-500 animate-pulse" />
                <h1 className="text-2xl font-black text-white tracking-tighter uppercase font-inter">
                  Node: {hostname}
                </h1>
              </div>
              {/* Labels: Roboto Condensed */}
              <p className="font-roboto-condensed text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">
                Diagnostic_Telemetry // neural_registry_v4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md ${isOnline ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                <span className="font-roboto-condensed text-[10px] font-black uppercase tracking-widest text-slate-300">
                  {isOnline ? 'Uplink_Established' : 'Uplink_Interrupted'}
                </span>
             </div>
          </div>
        </header>

      <main className=" pb-6 px-4 md:px-6 max-w-[1680px] mx-auto h-screen flex flex-col gap-3">

        {/* ── Status Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="shrink-0 flex items-center justify-between bg-white/[0.018] border border-white/[0.06] px-5 py-2.5 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500"}`} />
              {isOnline && (
                <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-white/80 tracking-wide">{hostname}</span>
              <span className="font-mono text-[9px] text-gray-600">·</span>
              <span className={`font-mono text-[9px] font-bold uppercase tracking-widest ${isOnline ? "text-emerald-500" : "text-rose-500"}`}>
                {isOnline ? "online" : "offline"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 pr-3 border-r border-white/[0.06]">
              {[
                { label: "Groups",   val: COMMAND_GROUPS.length },
                { label: "Commands", val: TOTAL_CMDS },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-bold text-white/60">{val}</span>
                  <span className="font-mono text-[9px] text-gray-600 uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] rounded-lg border border-white/[0.06]">
              <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-[9px] text-gray-500 tracking-wider">gRPC v4</span>
            </div>
          </div>
        </motion.div>

        {/* ── Body ── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[200px_1fr_280px] gap-3">

          {/* ── Col 1: Group sidebar ── */}
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="hidden lg:flex flex-col bg-white/[0.012] border border-white/[0.05] rounded-2xl overflow-hidden"
          >
            <div className="px-4 pt-4 pb-2 border-b border-white/[0.05]">
              <p className="font-mono text-[8px] font-bold uppercase tracking-[0.35em] text-gray-600">Groups</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
              {COMMAND_GROUPS.map((g, i) => {
                const Icon = g.icon;
                const c = COLOR[g.color];
                const active = activeGroup === g.id;
                return (
                  <motion.button
                    key={g.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setActiveGroup(g.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left group ${
                      active
                        ? `bg-white/[0.06] ring-1 ${c.ring}`
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition ${active ? `bg-white/[0.08]` : "bg-transparent"}`}>
                      <Icon size={11} className={active ? c.tab : "text-gray-600 group-hover:text-gray-400"} />
                    </div>
                    <span className={`font-mono text-[10px] font-semibold transition-colors ${active ? "text-white" : "text-gray-500 group-hover:text-gray-300"}`}>
                      {g.label}
                    </span>
                    <span className={`ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded-md border transition ${active ? c.badge : "text-gray-700 bg-transparent border-transparent"}`}>
                      {g.commands.length}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.aside>

          {/* ── Col 2: Terminal ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex flex-col gap-3 min-h-0"
          >
            <div className="shrink-0">
              <QuickShell active={isOnline} onRun={handleRun} />
            </div>

            <div className="flex-1 min-h-0 bg-[#01030b] border border-white/[0.05] rounded-2xl flex flex-col overflow-hidden">
              {/* terminal chrome */}
              <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/[0.05] bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/30 hover:bg-rose-500/40 transition cursor-pointer" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/40 transition cursor-pointer" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/40 transition cursor-pointer" />
                  </div>
                  <div className="h-3 w-px bg-white/[0.06]" />
                  <span className="font-mono text-[9px] text-gray-600">aura@{hostname}</span>
                </div>
                <div className="flex items-center gap-3">
                  {activeEntry && <StatusBadge status={activeEntry.status} />}
                  {activeEntry && (
                    <span className="font-mono text-[9px] text-gray-600">{activeEntry.ts}</span>
                  )}
                </div>
              </div>

              {/* output area */}
              <div
                ref={terminalRef}
                className="flex-1 min-h-0 overflow-y-auto p-5 font-mono text-xs leading-relaxed scrollbar-thin scrollbar-thumb-white/[0.06] scrollbar-track-transparent"
              >
                {!activeEntry ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-700 select-none"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-cyan-500/50" />
                      <p className="text-cyan-600/80 font-bold tracking-wide">AURORA_OS v4.0</p>
                      <span className="text-gray-700">—</span>
                      <span className="text-gray-600">Secure Command Interface</span>
                    </div>
                    <div className="space-y-1 text-gray-700 pl-4 border-l border-white/[0.04]">
                      <p>gRPC tunnel established</p>
                      <p>{TOTAL_CMDS} commands across {COMMAND_GROUPS.length} groups loaded</p>
                      <p>Host: <span className="text-gray-500">{hostname}</span></p>
                    </div>
                    <p className="mt-4 text-gray-700">Select a group → click a command, or type in the shell bar above.</p>
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.9 }}
                      className="inline-block w-2 h-3.5 bg-cyan-500/70 ml-0.5 mt-3 align-middle rounded-sm"
                    />
                  </motion.div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeEntry.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* command header */}
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.04]">
                        <ChevronRight size={11} className="text-gray-600" />
                        <span className="font-bold text-white/80">{activeEntry.action}</span>
                        <StatusBadge status={activeEntry.status} />
                      </div>

                      {/* output */}
                      <pre className="whitespace-pre-wrap break-words text-gray-400 leading-relaxed">
                        {activeEntry.content}
                      </pre>

                      {activeEntry.status === "pending" && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 0.9 }}
                          className="inline-block w-2 h-3.5 bg-cyan-500/70 ml-0.5 mt-2 align-middle rounded-sm"
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Col 3: Commands + History ── */}
          <motion.aside
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-3 min-h-0 overflow-hidden"
          >
            {/* mobile tabs */}
            <div className="flex lg:hidden gap-1 overflow-x-auto pb-1">
              {COMMAND_GROUPS.map(g => {
                const Icon = g.icon;
                const c = COLOR[g.color];
                return (
                  <button
                    key={g.id}
                    onClick={() => setActiveGroup(g.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition border ${
                      activeGroup === g.id
                        ? `border-white/20 bg-white/[0.06] text-white`
                        : "border-white/[0.05] text-gray-600 hover:text-gray-400"
                    }`}
                  >
                    <Icon size={10} className={activeGroup === g.id ? c.tab : ""} />
                    {g.label}
                  </button>
                );
              })}
            </div>

            {/* command list */}
            {currentGroup && (
              <div className="flex-1 min-h-0 bg-white/[0.012] border border-white/[0.05] rounded-2xl flex flex-col overflow-hidden">
                {/* group header */}
                <div className="shrink-0 flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.05]">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center bg-white/[0.05] border border-white/[0.08]`}>
                    {React.createElement(currentGroup.icon, { size: 10, className: COLOR[currentGroup.color].tab })}
                  </div>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-gray-500">
                    {currentGroup.label}
                  </span>
                  <span className={`ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded border ${COLOR[currentGroup.color].badge}`}>
                    {currentGroup.commands.length}
                  </span>
                </div>

                {/* buttons */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-1 scrollbar-thin scrollbar-thumb-white/[0.06]">
                  {currentGroup.commands.map((cmd, i) => (
                    <motion.div
                      key={cmd.action}
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.025 }}
                    >
                      <CmdButton
                        cmd={cmd}
                        group={currentGroup}
                        active={isOnline}
                        onRun={handleRun}
                        isRunning={[...runningCmds].some(id => id.includes(cmd.action))}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* history */}
            {history.length > 0 && (
              <div className="shrink-0 bg-white/[0.012] border border-white/[0.05] rounded-2xl overflow-hidden max-h-56 flex flex-col">
                <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05]">
                  <p className="font-mono text-[8px] font-bold uppercase tracking-[0.35em] text-gray-600">History</p>
                  <span className="font-mono text-[9px] text-gray-700">{history.length}</span>
                </div>
                <div className="overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-white/[0.06]">
                  {history.map((e, i) => {
                    const isActive = i === activeIdx;
                    const statusCls = e.status === "done" ? "text-emerald-400" : e.status === "error" ? "text-rose-400" : "text-amber-400";
                    const statusIcon = e.status === "done" ? "✓" : e.status === "error" ? "✕" : "·";
                    return (
                      <button
                        key={e.id}
                        onClick={() => setActiveIdx(i)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 transition text-left border-b border-white/[0.03] last:border-0 ${
                          isActive ? "bg-white/[0.05]" : "hover:bg-white/[0.025]"
                        }`}
                      >
                        <span className={`font-mono text-[10px] ${statusCls} shrink-0 w-3`}>
                          {e.status === "pending"
                            ? <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>{statusIcon}</motion.span>
                            : statusIcon
                          }
                        </span>
                        <span className="font-mono text-[10px] text-gray-400 truncate">{e.action}</span>
                        <span className="ml-auto font-mono text-[9px] text-gray-700 shrink-0">{e.ts}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      </main>

      {/* ── Arg Modal ── */}
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