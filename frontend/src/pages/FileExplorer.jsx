import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder, File, HardDrive, Download, Eye, Terminal,
  X, RefreshCw, Loader2, ChevronRight, Binary,
  ArrowLeft, Search, SortAsc, SortDesc, Copy, Check,
  FileText, FileImage, FileCode, FileArchive, Database,
  Shield, Grid3X3, List, CheckSquare, Square,
  FolderOpen, Home, BarChart2, Zap, Lock,
  ChevronDown, Star, Clock, Filter,
  Maximize2, Minimize2, Layers
} from "lucide-react";
import Topbar from "../components/Topbar";

const API_BASE = "http://172.24.16.81:8001/client";

/* ─── ADAPTIVE POLLING CONFIG ─────────────────────────────────────────── */
// Polls fast first (600ms), backs off to 1500ms after 5 misses
const POLL_FAST = 600;
const POLL_SLOW = 1500;
const POLL_MAX  = 25;

/* ─── helpers ─────────────────────────────────────────────────────────── */
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024, sizes = ["B","KB","MB","GB","TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (ts) => {
  if (!ts) return "—";
  try {
    return new Date(ts * 1000).toLocaleString("en-US", {
      month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit"
    });
  } catch { return "—"; }
};

const getExt = (name = "") => name.includes(".") ? name.split(".").pop().toLowerCase() : "";

const FILE_TYPES = {
  img:     { exts:["png","jpg","jpeg","gif","svg","webp","ico","bmp"],  color:"text-pink-400",   bg:"bg-pink-500/10",   label:"Image"   },
  code:    { exts:["js","jsx","ts","tsx","py","sh","bash","rb","go","rs","c","cpp","h","java","php","css","html","xml","json","yaml","yml","toml","conf","cfg"], color:"text-green-400", bg:"bg-green-500/10", label:"Code" },
  archive: { exts:["zip","tar","gz","bz2","xz","7z","rar"],            color:"text-orange-400", bg:"bg-orange-500/10", label:"Archive" },
  db:      { exts:["db","sqlite","sql","csv","parquet"],                color:"text-purple-400", bg:"bg-purple-500/10", label:"Data"    },
  text:    { exts:["txt","md","log","env","ini"],                       color:"text-blue-300",   bg:"bg-blue-500/10",   label:"Text"    },
  lock:    { exts:["pem","crt","key","cert","p12","pfx","gpg"],         color:"text-yellow-400", bg:"bg-yellow-500/10", label:"Key"     },
};

const getFileType = (name = "") => {
  const ext = getExt(name);
  for (const t of Object.values(FILE_TYPES)) if (t.exts.includes(ext)) return t;
  return { color:"text-gray-500", bg:"bg-white/5", label:"File" };
};

const getFileIcon = (name = "", size = 20) => {
  const ext = getExt(name);
  const t = getFileType(name);
  if (FILE_TYPES.lock.exts.includes(ext))    return <Lock size={size} className={t.color} />;
  if (FILE_TYPES.img.exts.includes(ext))     return <FileImage size={size} className={t.color} />;
  if (FILE_TYPES.code.exts.includes(ext))    return <FileCode size={size} className={t.color} />;
  if (FILE_TYPES.archive.exts.includes(ext)) return <FileArchive size={size} className={t.color} />;
  if (FILE_TYPES.db.exts.includes(ext))      return <Database size={size} className={t.color} />;
  if (FILE_TYPES.text.exts.includes(ext))    return <FileText size={size} className={t.color} />;
  return <File size={size} className="text-gray-500" />;
};

const parseBreadcrumbs = (path) => {
  if (!path) return [{ label:"root", path:"/" }];
  const parts = path.replace(/\/+$/, "").split("/").filter(Boolean);
  return [{ label:"root", path:"/" }, ...parts.map((p, i) => ({
    label: p, path: "/" + parts.slice(0, i + 1).join("/"),
  }))];
};

/* ─── useCopy ─────────────────────────────────────────────────────────── */
const useCopy = () => {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((text) => {
    navigator.clipboard.writeText(text ?? "").then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    });
  }, []);
  return [copied, copy];
};

/* ─── adaptivePoll — fast first, slow later ───────────────────────────── */
const adaptivePoll = (fetchFn, onResult, onTimeout) => {
  let attempts = 0;
  let timer;
  const tick = async () => {
    const result = await fetchFn();
    attempts++;
    if (result !== null && result !== undefined) { onResult(result); return; }
    if (attempts >= POLL_MAX) { onTimeout?.(); return; }
    timer = setTimeout(tick, attempts < 5 ? POLL_FAST : POLL_SLOW);
  };
  timer = setTimeout(tick, POLL_FAST);
  return () => clearTimeout(timer);
};

/* ─── small reusable button ───────────────────────────────────────────── */
const NavBtn = ({ children, onClick, disabled, title, active }) => (
  <button onClick={onClick} disabled={disabled} title={title}
    className={`p-2 rounded-lg border transition-all active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed
      ${active
        ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
        : "bg-white/[0.04] border-white/[0.07] text-gray-500 hover:text-white hover:bg-white/[0.08] hover:border-white/15"}`}>
    {children}
  </button>
);

/* ═══════════════════════════════════════════════════════════════════════ */
const FileExplorer = ({ setLoading, setError }) => {
  const { hostname } = useParams();
  const navigate = useNavigate();
  /* history */
  const [pathHistory,  setPathHistory]  = useState(["/"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const currentPath = pathHistory[historyIndex] ?? "/";

  /* data */
  const [items,        setItems]        = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [downloading,  setDownloading]  = useState(false);
  const [online,       setOnline]       = useState(true);

  /* viewer */
  const [selectedFile,     setSelectedFile]     = useState(null);
  const [fileContent,      setFileContent]      = useState("");
  const [inspecting,       setInspecting]       = useState(false);
  const [lineWrap,         setLineWrap]         = useState(true);
  const [viewerFullscreen, setViewerFullscreen] = useState(false);

  /* ui */
  const [search,       setSearch]       = useState("");
  const [sortField,    setSortField]    = useState("name");
  const [sortDir,      setSortDir]      = useState("asc");
  const [viewMode,     setViewMode]     = useState("list");
  const [selected,     setSelected]     = useState(new Set());
  const [showStats,    setShowStats]    = useState(false);
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showRecent,   setShowRecent]   = useState(false);
  const [editingPath,  setEditingPath]  = useState(false);
  const [pathInput,    setPathInput]    = useState("");

  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fe_favs")   || "[]"); } catch { return []; }
  });
  const [recentPaths, setRecentPaths] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fe_recent") || "[]"); } catch { return []; }
  });

  const [copiedPath,    copyPath]    = useCopy();
  const [copiedContent, copyContent] = useCopy();

  const cancelPollRef = useRef(null);
  const searchRef     = useRef(null);

  useEffect(() => () => cancelPollRef.current?.(), []);

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setInspecting(false); setViewerFullscreen(false);
        setShowTypeMenu(false); setShowRecent(false); setEditingPath(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") { e.preventDefault(); searchRef.current?.focus(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "r") { e.preventDefault(); refreshPath(currentPath); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentPath]);

  /* ── poll helper ─────────────────────────────────────────────────── */
  const pollResult = useCallback(async (commandId) => {
    try {
      const res = await fetch(`${API_BASE}/command-result/${commandId}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].output) {
        try { return JSON.parse(data[0].output); } catch { return data[0].output; }
      }
    } catch {}
    return null;
  }, []);

  /* ── recent paths ────────────────────────────────────────────────── */
  const pushRecent = useCallback((path) => {
    setRecentPaths(prev => {
      const next = [path, ...prev.filter(p => p !== path)].slice(0, 12);
      localStorage.setItem("fe_recent", JSON.stringify(next));
      return next;
    });
  }, []);

  /* ── navigate ────────────────────────────────────────────────────── */
  const navigateTo = useCallback(async (path, isInitial = false) => {
    if (!path) return;
    cancelPollRef.current?.();
    if (isInitial) { setLoading?.(true); setError?.(null); }
    setLocalLoading(true); setSelected(new Set()); setSearch(""); setOnline(true);
    try {
      const res = await fetch(`${API_BASE}/filesystem/${hostname}`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ path }),
      });
      const cmd = await res.json();
      cancelPollRef.current = adaptivePoll(
        () => pollResult(cmd.command_id),
        (result) => {
          setOnline(true);
          if (result?.items) {
            setItems(result.items);
            const resolved = result.current_path || path;
            pushRecent(resolved);
            setPathHistory(prev => {
              const trimmed = prev.slice(0, historyIndex + 1);
              if (trimmed[trimmed.length - 1] === resolved) return trimmed;
              return [...trimmed, resolved];
            });
            setHistoryIndex(prev => {
              const trimmed = pathHistory.slice(0, prev + 1);
              return trimmed[trimmed.length - 1] === (result.current_path || path) ? prev : prev + 1;
            });
          }
          if (isInitial) setLoading?.(false);
          setLocalLoading(false);
        },
        () => { setOnline(false); if (isInitial) setLoading?.(false); setLocalLoading(false); }
      );
    } catch {
      setOnline(false);
      if (isInitial) setLoading?.(false);
      setLocalLoading(false);
    }
  }, [hostname, setLoading, setError, historyIndex, pathHistory, pollResult, pushRecent]);

  const goBack = () => {
    if (historyIndex > 0) { const pi = historyIndex - 1; setHistoryIndex(pi); refreshPath(pathHistory[pi]); }
  };
  const goForward = () => {
    if (historyIndex < pathHistory.length - 1) { const ni = historyIndex + 1; setHistoryIndex(ni); refreshPath(pathHistory[ni]); }
  };

  /* ── refresh ─────────────────────────────────────────────────────── */
  const refreshPath = useCallback(async (path) => {
    if (!path) return;
    cancelPollRef.current?.();
    setLocalLoading(true); setSelected(new Set());
    try {
      const res = await fetch(`${API_BASE}/filesystem/${hostname}`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ path }),
      });
      const cmd = await res.json();
      cancelPollRef.current = adaptivePoll(
        () => pollResult(cmd.command_id),
        (result) => { if (result?.items) setItems(result.items); setLocalLoading(false); },
        () => setLocalLoading(false)
      );
    } catch { setLocalLoading(false); }
  }, [hostname, pollResult]);

  /* ── view file ───────────────────────────────────────────────────── */
  const viewFile = useCallback(async (item) => {
    setSelectedFile(item); setInspecting(true);
    setFileContent("// ▶ SYNCHRONIZING REMOTE BUFFER...");
    try {
      const res = await fetch(`${API_BASE}/file-content/${hostname}`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ path: item.path }),
      });
      const cmd = await res.json();
      adaptivePoll(
        () => pollResult(cmd.command_id),
        (result) => setFileContent(result?.content || (typeof result === "string" ? result : "// [BINARY OR ENCRYPTED — CANNOT RENDER]")),
        () => setFileContent("!! UPLINK TIMEOUT — NO DATA RECEIVED")
      );
    } catch { setFileContent("!! HANDSHAKE FAILED"); }
  }, [hostname, pollResult]);

  /* ── download ────────────────────────────────────────────────────── */
  const handleDownload = useCallback(async (fileItem = selectedFile) => {
    if (!fileItem) return;
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/file-content/${hostname}`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ path: fileItem.path }),
      });
      const cmd = await res.json();
      adaptivePoll(
        () => pollResult(cmd.command_id),
        (result) => {
          setDownloading(false);
          if (!result) return;
          let blob;
          if (result.encoding === "base64") {
            const bc = atob(result.content); const bn = new Uint8Array(bc.length);
            for (let i = 0; i < bc.length; i++) bn[i] = bc.charCodeAt(i);
            blob = new Blob([bn], { type:"application/octet-stream" });
          } else {
            blob = new Blob([result.content || result], { type:"application/octet-stream" });
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = fileItem.name;
          document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        },
        () => setDownloading(false)
      );
    } catch { setDownloading(false); }
  }, [hostname, selectedFile, pollResult]);

  /* ── favorites ───────────────────────────────────────────────────── */
  const toggleFavorite = (path) => {
    setFavorites(prev => {
      const next = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path];
      localStorage.setItem("fe_favs", JSON.stringify(next));
      return next;
    });
  };

  /* ── sort + filter ───────────────────────────────────────────────── */
  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const processed = useMemo(() => [...items]
    .filter(item => {
      const ms = item.name.toLowerCase().includes(search.toLowerCase());
      const mt = typeFilter === "all" ? true
        : typeFilter === "dir" ? item.type === "directory"
        : item.type !== "directory" && FILE_TYPES[typeFilter]?.exts.includes(getExt(item.name));
      return ms && mt;
    })
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      let cmp = 0;
      if (sortField === "name")     cmp = a.name.localeCompare(b.name);
      else if (sortField === "size")     cmp = (a.size || 0) - (b.size || 0);
      else if (sortField === "type")     cmp = getExt(a.name).localeCompare(getExt(b.name));
      else if (sortField === "modified") cmp = (a.modified || 0) - (b.modified || 0);
      return sortDir === "asc" ? cmp : -cmp;
    }), [items, search, typeFilter, sortField, sortDir]);

  const stats = useMemo(() => ({
    total: items.length, dirs: items.filter(i => i.type === "directory").length,
    files: items.filter(i => i.type !== "directory").length,
    totalSize: items.reduce((a, i) => a + (i.size || 0), 0),
    avgSize: items.filter(i => i.size).length
      ? items.filter(i => i.size).reduce((a, i) => a + i.size, 0) / items.filter(i => i.size).length : 0,
  }), [items]);

  const toggleSelect = (e, name) => {
    e.stopPropagation();
    setSelected(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
  };
  const selectAll = () => setSelected(new Set(processed.map(i => i.name)));
  const clearSel  = () => setSelected(new Set());

  const lineCount   = useMemo(() => fileContent.split("\n").length, [fileContent]);
  const SortIcon    = sortDir === "asc" ? SortAsc : SortDesc;
  const breadcrumbs = parseBreadcrumbs(currentPath);

  useEffect(() => { navigateTo("/", true); }, []);

  /* ════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#020617] text-white" style={{ fontFamily:"'JetBrains Mono','Fira Code',monospace" }}>
{/* NATIVE INTEGRATED HEADER (Replaces Topbar) */}
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
                <HardDrive size={18} className="text-cyan-500 animate-pulse" />
                <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
                  Filesystem: {hostname}
                </h1>
              </div>
              <p className="font-roboto-condensed text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">
                Forensic_Explorer // remote_node_v4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md ${online ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                <span className="font-roboto-condensed text-[10px] font-black uppercase tracking-widest text-slate-300">
                  {localLoading ? 'Scanning...' : online ? 'Link_Live' : 'Link_Lost'}
                </span>
             </div>
             <NavBtn onClick={() => navigateTo(currentPath)} title="Sync Buffer">
                <RefreshCw size={14} className={localLoading ? "animate-spin text-cyan-400" : ""} />
             </NavBtn>
          </div>
        </header>
      <main className=" pb-6 px-4 md:px-6 max-w-[1680px] mx-auto h-screen flex flex-col gap-3">
        

        {/* ── TOOLBAR ────────────────────────────────────────────────── */}
        <div className="bg-[#0b0f1a] border border-white/[0.06] p-3 rounded-2xl shadow-xl flex flex-col gap-2 shrink-0">

          {/* Row 1 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <NavBtn onClick={goBack}    disabled={historyIndex <= 0}                    title="Back (Alt+←)"><ArrowLeft size={14} /></NavBtn>
              <NavBtn onClick={goForward} disabled={historyIndex >= pathHistory.length-1} title="Forward"><ChevronRight size={14} /></NavBtn>
              <NavBtn onClick={() => navigateTo("/")} title="Home"><Home size={14} /></NavBtn>
            </div>

            {/* Path bar */}
            <div className="flex-1 relative">
              {editingPath ? (
                <div className="flex items-center gap-2 bg-black/60 border border-cyan-500/50 rounded-xl px-3 py-2">
                  <Terminal size={11} className="text-cyan-600 shrink-0" />
                  <input autoFocus value={pathInput} onChange={e => setPathInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") { navigateTo(pathInput); setEditingPath(false); }
                      if (e.key === "Escape") setEditingPath(false);
                    }}
                    onBlur={() => setEditingPath(false)}
                    className="bg-transparent outline-none text-cyan-400 text-[11px] w-full uppercase tracking-widest"
                  />
                </div>
              ) : (
                <div onClick={() => { setPathInput(currentPath); setEditingPath(true); }}
                  className="flex items-center gap-2 bg-black/40 border border-white/[0.07] hover:border-white/20 rounded-xl px-3 py-2 cursor-text transition-all group">
                  <Terminal size={11} className="text-gray-700 shrink-0" />
                  <span className="text-cyan-400 text-[11px] tracking-widest uppercase font-bold truncate flex-1 select-none">{currentPath}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={e => { e.stopPropagation(); setShowRecent(r => !r); }} title="Recent"
                      className="p-0.5 text-gray-700 hover:text-white transition-colors"><Clock size={10} /></button>
                    <button onClick={e => { e.stopPropagation(); copyPath(currentPath); }}
                      className="p-0.5 text-gray-700 hover:text-cyan-400 transition-colors">
                      {copiedPath ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); toggleFavorite(currentPath); }}
                      className={`p-0.5 transition-colors ${favorites.includes(currentPath) ? "text-yellow-400" : "text-gray-700 hover:text-yellow-400"}`}>
                      <Star size={10} fill={favorites.includes(currentPath) ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              )}

              {/* Recent/Favorites dropdown */}
              <AnimatePresence>
                {showRecent && (
                  <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
                    className="absolute top-full mt-1 left-0 right-0 bg-[#0d1120] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl max-h-64 overflow-y-auto custom-scroll">
                    {recentPaths.length === 0 && favorites.length === 0 && (
                      <p className="px-4 py-3 text-[9px] text-gray-600 uppercase tracking-widest">No history yet</p>
                    )}
                    {recentPaths.length > 0 && (
                      <div>
                        <div className="px-4 py-1.5 text-[8px] text-gray-700 uppercase tracking-widest border-b border-white/5">Recent</div>
                        {recentPaths.map(p => (
                          <button key={p} onClick={() => { navigateTo(p); setShowRecent(false); }}
                            className="w-full text-left px-4 py-2 text-[10px] text-gray-400 hover:bg-white/5 hover:text-cyan-400 transition-colors uppercase font-mono truncate flex items-center gap-2">
                            <Clock size={9} className="text-gray-700 shrink-0" />{p}
                          </button>
                        ))}
                      </div>
                    )}
                    {favorites.length > 0 && (
                      <div>
                        <div className="px-4 py-1.5 text-[8px] text-gray-700 uppercase tracking-widest border-b border-white/5 border-t">Favorites</div>
                        {favorites.map(p => (
                          <button key={p} onClick={() => { navigateTo(p); setShowRecent(false); }}
                            className="w-full text-left px-4 py-2 text-[10px] text-yellow-500/80 hover:bg-white/5 hover:text-yellow-400 transition-colors uppercase font-mono truncate flex items-center gap-2">
                            <Star size={9} fill="currentColor" className="shrink-0" />{p}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[8px] font-bold uppercase tracking-widest transition-all ${online ? "border-green-500/20 text-green-500 bg-green-500/5" : "border-red-500/20 text-red-500 bg-red-500/5"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${online ? "bg-green-500" : "bg-red-500"} ${localLoading ? "animate-pulse" : ""}`} />
                <span className="hidden sm:inline">{localLoading ? "SYNC" : online ? "LIVE" : "OFFLINE"}</span>
              </div>
              <NavBtn onClick={() => setShowStats(s => !s)} active={showStats} title="Stats"><BarChart2 size={14} /></NavBtn>
              <NavBtn onClick={() => refreshPath(currentPath)} title="Refresh (Ctrl+R)">
                <RefreshCw size={14} className={localLoading ? "animate-spin text-cyan-400" : ""} />
              </NavBtn>
            </div>
          </div>

          {/* Row 2: breadcrumbs */}
          <div className="flex items-center gap-0.5 flex-wrap px-1">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.path}>
                <button onClick={() => navigateTo(crumb.path)}
                  className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all hover:bg-white/5 ${i === breadcrumbs.length-1 ? "text-cyan-400" : "text-gray-600 hover:text-white"}`}>
                  {i === 0 ? <span className="flex items-center gap-1"><HardDrive size={8} /> root</span> : crumb.label}
                </button>
                {i < breadcrumbs.length-1 && <ChevronRight size={8} className="text-gray-800" />}
              </React.Fragment>
            ))}
          </div>

          {/* Row 3: search + filters + sort + view */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/[0.07] focus-within:border-cyan-500/40 rounded-xl px-3 py-2 transition-all">
              <Search size={11} className="text-gray-600 shrink-0" />
              <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search files...  Ctrl+F"
                className="bg-transparent outline-none text-gray-300 text-[11px] w-full placeholder:text-gray-700 font-mono" />
              {search && <button onClick={() => setSearch("")} className="text-gray-600 hover:text-gray-300 shrink-0"><X size={10} /></button>}
            </div>

            {/* Type filter dropdown */}
            <div className="relative">
              <button onClick={() => setShowTypeMenu(m => !m)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${typeFilter !== "all" ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-white/[0.04] border-white/10 text-gray-600 hover:text-white"}`}>
                <Filter size={11} />
                <span className="hidden sm:inline">{typeFilter === "all" ? "TYPE" : typeFilter.toUpperCase()}</span>
                <ChevronDown size={9} />
              </button>
              <AnimatePresence>
                {showTypeMenu && (
                  <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
                    className="absolute top-full mt-1 right-0 bg-[#0d1120] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl min-w-[120px]">
                    {[["all","All Files"],["dir","Folders"],...Object.entries(FILE_TYPES).map(([k,v])=>[k,v.label])].map(([val,label])=>(
                      <button key={val} onClick={() => { setTypeFilter(val); setShowTypeMenu(false); }}
                        className={`w-full text-left px-4 py-2 text-[9px] uppercase tracking-widest transition-colors font-mono ${typeFilter===val ? "text-cyan-400 bg-cyan-500/10" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort buttons */}
            {[["name","NAME"],["size","SIZE"],["type","EXT"],["modified","DATE"]].map(([field,label])=>(
              <button key={field} onClick={() => toggleSort(field)}
                className={`hidden lg:flex items-center gap-1 px-2.5 py-2 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${sortField===field ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-white/[0.04] border-white/10 text-gray-600 hover:text-white"}`}>
                {label}{sortField===field && <SortIcon size={8} />}
              </button>
            ))}

            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              <button onClick={() => setViewMode("list")} className={`p-2 transition-all ${viewMode==="list" ? "bg-cyan-500/20 text-cyan-400" : "bg-white/[0.04] text-gray-600 hover:text-white"}`}><List size={13} /></button>
              <button onClick={() => setViewMode("grid")} className={`p-2 transition-all ${viewMode==="grid" ? "bg-cyan-500/20 text-cyan-400" : "bg-white/[0.04] text-gray-600 hover:text-white"}`}><Grid3X3 size={13} /></button>
            </div>
          </div>
        </div>

        {/* ── STATS ──────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showStats && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-2 overflow-hidden shrink-0">
              {[
                { l:"TOTAL",  v:stats.total,              icon:<Layers size={12} className="text-cyan-500" /> },
                { l:"DIRS",   v:stats.dirs,               icon:<Folder size={12} className="text-cyan-400" /> },
                { l:"FILES",  v:stats.files,              icon:<File   size={12} className="text-gray-400" /> },
                { l:"VOLUME", v:formatSize(stats.totalSize), icon:<HardDrive size={12} className="text-cyan-500" /> },
                { l:"AVG",    v:formatSize(stats.avgSize),   icon:<BarChart2 size={12} className="text-cyan-400" /> },
              ].map(s => (
                <div key={s.l} className="bg-[#0b0f1a] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-2.5">
                  <div className="p-1.5 bg-white/5 rounded-lg">{s.icon}</div>
                  <div>
                    <p className="text-[7px] text-gray-600 uppercase tracking-widest">{s.l}</p>
                    <p className="text-sm font-black text-white">{s.v}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SELECTION BAR ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
              className="bg-cyan-500/[0.07] border border-cyan-500/20 rounded-xl px-4 py-2 flex items-center gap-3 shrink-0">
              <Zap size={12} className="text-cyan-400" />
              <span className="text-[9px] text-cyan-400 font-black uppercase tracking-widest flex-1">{selected.size} SELECTED</span>
              <button onClick={clearSel} className="text-[8px] text-gray-500 hover:text-white uppercase tracking-widest">Clear</button>
              <button onClick={selectAll} className="text-[8px] text-cyan-500 hover:text-cyan-300 uppercase tracking-widest">All</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FILE TABLE ─────────────────────────────────────────────────── */}
        <div className="flex-1 bg-[#080c15] border border-white/[0.05] rounded-2xl overflow-hidden flex flex-col min-h-0">
          {viewMode === "list" ? (
            <div className="overflow-auto flex-1 custom-scroll">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#080c15] z-20">
                  <tr className="text-[8px] font-black uppercase text-gray-700 tracking-[0.18em] border-b border-white/[0.04]">
                    <th className="px-5 py-3 w-8">
                      <button onClick={selected.size===processed.length&&processed.length>0 ? clearSel : selectAll}
                        className="text-gray-700 hover:text-cyan-400 transition-colors">
                        {selected.size===processed.length&&processed.length>0
                          ? <CheckSquare size={12} className="text-cyan-400" /> : <Square size={12} />}
                      </button>
                    </th>
                    <th className="px-3 py-3 cursor-pointer hover:text-white transition-colors" onClick={()=>toggleSort("name")}>
                      <span className="flex items-center gap-1">Name {sortField==="name"&&<SortIcon size={8}/>}</span>
                    </th>
                    <th className="px-3 py-3 hidden md:table-cell cursor-pointer hover:text-white transition-colors" onClick={()=>toggleSort("type")}>
                      <span className="flex items-center gap-1">Type {sortField==="type"&&<SortIcon size={8}/>}</span>
                    </th>
                    <th className="px-3 py-3 hidden sm:table-cell cursor-pointer hover:text-white transition-colors" onClick={()=>toggleSort("size")}>
                      <span className="flex items-center gap-1">Size {sortField==="size"&&<SortIcon size={8}/>}</span>
                    </th>
                    <th className="px-3 py-3 hidden xl:table-cell cursor-pointer hover:text-white transition-colors" onClick={()=>toggleSort("modified")}>
                      <span className="flex items-center gap-1">Modified {sortField==="modified"&&<SortIcon size={8}/>}</span>
                    </th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.025]">
                  {processed.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-20 text-[9px] text-gray-700 uppercase tracking-widest">
                      {localLoading ? "▶  SCANNING REMOTE NODE..." : "DIRECTORY EMPTY"}
                    </td></tr>
                  )}
                  {processed.map((item, i) => {
                    const isDir = item.type === "directory";
                    const isSel = selected.has(item.name);
                    const isFav = favorites.includes(item.path);
                    const ft    = getFileType(item.name);
                    return (
                      <motion.tr key={item.name+i}
                        initial={{ opacity:0 }} animate={{ opacity:1 }}
                        transition={{ delay: Math.min(i*0.012, 0.25) }}
                        className={`group transition-colors cursor-pointer ${isSel ? "bg-cyan-500/[0.05]" : "hover:bg-white/[0.018]"}`}>

                        <td className="px-5 py-2.5">
                          <button onClick={e=>toggleSelect(e,item.name)} className="text-gray-700 hover:text-cyan-400 transition-colors">
                            {isSel ? <CheckSquare size={12} className="text-cyan-400" /> : <Square size={12} />}
                          </button>
                        </td>

                        <td className="px-3 py-2.5" onClick={()=> isDir ? navigateTo(item.path) : viewFile(item)}>
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg shrink-0 ${isDir ? "bg-cyan-500/10" : ft.bg}`}>
                              {isDir ? <Folder size={14} className="text-cyan-400" /> : getFileIcon(item.name, 14)}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-[11px] font-bold truncate uppercase tracking-tight leading-tight ${isDir ? "text-white" : "text-gray-300"} group-hover:text-white transition-colors`}>
                                {item.name}
                              </p>
                              <p className="text-[8px] text-gray-700 sm:hidden">{formatSize(item.size)}</p>
                            </div>
                            {isFav && <Star size={8} className="text-yellow-500/50 shrink-0" fill="currentColor" />}
                            {isDir && <ChevronRight size={10} className="text-gray-800 group-hover:text-cyan-500 ml-auto mr-1 transition-colors shrink-0" />}
                          </div>
                        </td>

                        <td className="px-3 py-2.5 hidden md:table-cell">
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md uppercase ${isDir ? "text-cyan-600 bg-cyan-500/10" : `${ft.color} ${ft.bg}`}`}>
                            {isDir ? "DIR" : (getExt(item.name).toUpperCase() || "FILE")}
                          </span>
                        </td>

                        <td className="px-3 py-2.5 hidden sm:table-cell">
                          <span className="text-[10px] text-gray-600 font-mono">{formatSize(item.size)}</span>
                        </td>

                        <td className="px-3 py-2.5 hidden xl:table-cell">
                          <span className="text-[9px] text-gray-700 font-mono">{formatDate(item.modified)}</span>
                        </td>

                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={e=>{e.stopPropagation();toggleFavorite(item.path);}}
                              className={`p-1.5 rounded-lg transition-all ${isFav ? "text-yellow-400 bg-yellow-500/10" : "text-gray-600 hover:text-yellow-400 bg-white/5"}`}>
                              <Star size={11} fill={isFav?"currentColor":"none"} />
                            </button>
                            <button onClick={e=>{e.stopPropagation();copyPath(item.path);}}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-600 hover:text-white rounded-lg transition-all">
                              <Copy size={11} />
                            </button>
                            {!isDir && <>
                              <button onClick={e=>{e.stopPropagation();viewFile(item);}}
                                className="p-1.5 bg-white/5 hover:bg-white hover:text-black text-gray-600 rounded-lg transition-all">
                                <Eye size={11} />
                              </button>
                              <button onClick={e=>{e.stopPropagation();handleDownload(item);}}
                                className="p-1.5 bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 text-gray-600 rounded-lg transition-all">
                                <Download size={11} />
                              </button>
                            </>}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (

<div className="overflow-auto flex-1 custom-scroll p-4">
  {processed.length === 0 && (
    <div className="text-center py-20 text-[9px] text-gray-700 uppercase tracking-widest">
      {localLoading ? "▶  SCANNING..." : "DIRECTORY EMPTY"}
    </div>
  )}

  {/* ✅ FIXED GRID */}
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
    {processed.map((item, i) => {
      const isDir = item.type === "directory";
      const isSel = selected.has(item.name);
      const ft    = getFileType(item.name);

      return (
        <motion.div
          key={item.name + i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: Math.min(i * 0.02, 0.2) }}
          onClick={() => isDir ? navigateTo(item.path) : viewFile(item)}
          className={`group relative rounded-2xl border cursor-pointer p-5 flex flex-col items-center gap-3 transition-all hover:scale-[1.05]
          ${isSel
            ? "bg-cyan-500/10 border-cyan-500/25"
            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/15"
          }`}
        >

          {/* Select */}
          <button
            onClick={(e) => toggleSelect(e, item.name)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-cyan-400"
          >
            {isSel
              ? <CheckSquare size={14} className="text-cyan-400" />
              : <Square size={14} />}
          </button>

          {/* Icon */}
          <div className={`p-3 rounded-xl ${isDir ? "bg-cyan-500/10" : ft.bg}`}>
            {isDir
              ? <Folder size={30} className="text-cyan-400" />
              : getFileIcon(item.name, 30)}
          </div>

          {/* Name */}
          <p className={`text-[11px] font-bold uppercase tracking-tight text-center leading-tight line-clamp-2
            ${isDir ? "text-white" : "text-gray-400"} group-hover:text-white`}>
            {item.name}
          </p>

          {/* Size */}
          {!isDir && (
            <p className="text-[10px] text-gray-600">
              {formatSize(item.size)}
            </p>
          )}
        </motion.div>
      );
    })}
  </div>
</div>
          )}

          {/* Status bar */}
          <div className="border-t border-white/[0.04] bg-[#060a12] px-5 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-[8px] text-gray-700 uppercase tracking-widest">
                {localLoading ? "SCANNING..." : `${processed.length}/${items.length} NODES`}
              </span>
              {search && <span className="text-[8px] text-cyan-700 uppercase">FILTER: "{search}"</span>}
              {typeFilter !== "all" && <span className="text-[8px] text-cyan-700 uppercase">TYPE: {typeFilter}</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[8px] text-gray-800 hidden sm:block">{formatSize(stats.totalSize)} total</span>
              <span className="text-[8px] text-gray-800 hidden md:block">{hostname} :: AURORA</span>
            </div>
          </div>
        </div>
      </main>

      {/* ══ FILE VIEWER MODAL ════════════════════════════════════════════ */}
      <AnimatePresence>
        {inspecting && (
          <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-6 bg-black/85 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => { setInspecting(false); setViewerFullscreen(false); }} />
            <motion.div
              initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
              transition={{ type:"spring", damping:28, stiffness:260 }}
              className={`relative z-[110] w-full bg-[#060a12] border-t lg:border border-white/[0.08] flex flex-col shadow-2xl overflow-hidden transition-all duration-300
                ${viewerFullscreen ? "max-w-full h-screen rounded-none" : "max-w-5xl h-[90vh] rounded-t-2xl lg:rounded-2xl"}`}>

              {/* Header */}
              <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-3 shrink-0 bg-white/[0.01]">
                <div className={`p-2 rounded-xl border border-white/[0.08] ${getFileType(selectedFile?.name||"").bg}`}>
                  {getFileIcon(selectedFile?.name||"", 16)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-white font-black text-sm uppercase tracking-tight truncate">{selectedFile?.name}</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-[8px] text-gray-600 uppercase truncate max-w-[200px]">{selectedFile?.path}</p>
                    <button onClick={() => copyPath(selectedFile?.path)} className="text-gray-700 hover:text-cyan-400 transition-colors shrink-0">
                      {copiedPath ? <Check size={9} className="text-green-400"/> : <Copy size={9}/>}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setLineWrap(w=>!w)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all ${lineWrap ? "bg-cyan-500/15 border-cyan-500/25 text-cyan-400" : "bg-white/5 border-white/10 text-gray-600 hover:text-white"}`}>
                    WRAP
                  </button>
                  <button onClick={() => setViewerFullscreen(f=>!f)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-600 hover:text-white rounded-lg transition-all">
                    {viewerFullscreen ? <Minimize2 size={13}/> : <Maximize2 size={13}/>}
                  </button>
                  <button onClick={() => { setInspecting(false); setViewerFullscreen(false); }}
                    className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-600 hover:text-red-400 rounded-lg transition-all">
                    <X size={13}/>
                  </button>
                </div>
              </div>

              {/* Code area */}
              <div className="flex-1 bg-black/50 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] text-gray-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Terminal size={9}/> BUFFER
                    </span>
                    <span className="text-[8px] text-gray-700">{lineCount} LINES</span>
                    <span className="text-[8px] text-gray-700">{formatSize(selectedFile?.size)}</span>
                  </div>
                  <button onClick={() => copyContent(fileContent)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all text-[8px] uppercase tracking-widest">
                    {copiedContent ? <><Check size={9} className="text-green-400"/> COPIED</> : <><Copy size={9}/> COPY</>}
                  </button>
                </div>

                <div className="flex flex-1 overflow-auto custom-scroll">
                  <div className="select-none py-4 px-3 bg-black/30 border-r border-white/[0.03] text-right shrink-0 hidden md:block">
                    {Array.from({ length: lineCount }, (_, li) => (
                      <div key={li} className="text-[8px] text-gray-800 leading-[1.65rem]">{li + 1}</div>
                    ))}
                  </div>
                  <div className="flex-1 overflow-auto p-4 custom-scroll">
                    <pre className={`text-[11px] text-gray-400 leading-[1.65rem] selection:bg-cyan-500/30 ${lineWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"}`}>
                      {fileContent}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Footer: meta + download */}
              <div className="px-4 py-3 border-t border-white/[0.04] flex flex-col sm:flex-row gap-3 shrink-0">
                <div className="grid grid-cols-3 gap-2 flex-1">
                  {[
                    { l:"PROTOCOL", v:"AURORA STREAM", icon:<Shield size={12} className="text-cyan-500"/> },
                    { l:"ENCODING", v:"UTF-8 / AUTO",  icon:<Binary size={12} className="text-cyan-500"/> },
                    { l:"SIZE",     v:formatSize(selectedFile?.size), icon:<HardDrive size={12} className="text-cyan-500"/> },
                  ].map(m => (
                    <div key={m.l} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-2">
                      <div className="p-1 bg-white/5 rounded-lg shrink-0">{m.icon}</div>
                      <div className="min-w-0">
                        <p className="text-[7px] text-gray-700 uppercase tracking-widest">{m.l}</p>
                        <p className="text-[9px] text-gray-300 font-bold uppercase truncate">{m.v}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button disabled={downloading} onClick={() => handleDownload()}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-black uppercase text-[10px] hover:bg-cyan-400 transition-all active:scale-[0.98] disabled:bg-gray-800 disabled:text-gray-600 tracking-widest shrink-0 sm:w-44">
                  {downloading ? <><Loader2 size={13} className="animate-spin"/> EXTRACTING...</> : <><Download size={13}/> DOWNLOAD</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
        .custom-scroll::-webkit-scrollbar { width: 3px; height: 3px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.12); border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.3); }
      `}</style>
    </div>
  );
};

export default FileExplorer;