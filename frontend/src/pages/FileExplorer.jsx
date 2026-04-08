import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useOutletContext } from "react-router-dom"; // Added useOutletContext
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder, File, HardDrive, Download, Eye, Terminal,
  X, RefreshCw, Loader2, ChevronRight, Binary,
  ArrowLeft, Search, SortAsc, SortDesc, Copy, Check,
  FileText, FileImage, FileCode, FileArchive, Database,
  Shield, Grid3X3, List, CheckSquare, Square,
  Home, BarChart2, Zap, Lock,
  ChevronDown, Star, Clock, Filter,
  Maximize2, Minimize2, Layers
} from "lucide-react";

const API_BASE = "http://172.24.16.81:8001/client";

// ... [Keep helpers, formatSize, formatDate, getFileType, getFileIcon exactly as they were] ...

const parseBreadcrumbs = (path) => {
  if (!path) return [{ label:"root", path:"/" }];
  const parts = path.replace(/\/+$/, "").split("/").filter(Boolean);
  return [{ label:"root", path:"/" }, ...parts.map((p, i) => ({
    label: p, path: "/" + parts.slice(0, i + 1).join("/"),
  }))];
};

const adaptivePoll = (fetchFn, onResult, onTimeout) => {
  let attempts = 0;
  let timer;
  const tick = async () => {
    const result = await fetchFn();
    attempts++;
    if (result !== null && result !== undefined) { onResult(result); return; }
    if (attempts >= 25) { onTimeout?.(); return; }
    timer = setTimeout(tick, attempts < 5 ? 600 : 1500);
  };
  timer = setTimeout(tick, 600);
  return () => clearTimeout(timer);
};

const NavBtn = ({ children, onClick, disabled, title, active }) => (
  <button onClick={onClick} disabled={disabled} title={title}
    className={`p-2 rounded-lg border transition-all active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed
      ${active
        ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
        : "bg-white/[0.04] border-white/[0.07] text-gray-500 hover:text-white hover:bg-white/[0.08] hover:border-white/15"}`}>
    {children}
  </button>
);

const FileExplorer = ({ setLoading, setError }) => {
  const { hostname } = useParams();
  
  // 1. Neural Link: Layout Context
  const context = useOutletContext();
  const setHeaderData = context?.setHeaderData;

  const [pathHistory,  setPathHistory]  = useState(["/"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const currentPath = pathHistory[historyIndex] ?? "/";

  const [items,        setItems]        = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [downloading,  setDownloading]  = useState(false);
  const [online,       setOnline]       = useState(true);

  const [selectedFile,     setSelectedFile]     = useState(null);
  const [fileContent,      setFileContent]      = useState("");
  const [inspecting,       setInspecting]       = useState(false);
  const [lineWrap,         setLineWrap]         = useState(true);
  const [viewerFullscreen, setViewerFullscreen] = useState(false);

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

  const [copiedPath,    copyPath]    = useState(false); // Simplified for integration
  const [copiedContent, copyContent] = useState(false);

  const cancelPollRef = useRef(null);
  const searchRef     = useRef(null);

  // 2. Sync Topbar Title
  useEffect(() => {
    if (setHeaderData) {
      setHeaderData({
        name: "Filesystem",
        desc: `Remote_Explorer // Node: ${hostname}`
      });
    }
  }, [hostname, setHeaderData]);

  // Keyboard and Poll Cleanup
  useEffect(() => () => cancelPollRef.current?.(), []);
  
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

  const pushRecent = useCallback((path) => {
    setRecentPaths(prev => {
      const next = [path, ...prev.filter(p => p !== path)].slice(0, 12);
      localStorage.setItem("fe_recent", JSON.stringify(next));
      return next;
    });
  }, []);

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
            setHistoryIndex(prev => prev + 1);
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
  }, [hostname, historyIndex, pollResult, pushRecent, setLoading, setError]);

  useEffect(() => { navigateTo("/", true); }, []);

  const refreshPath = (path) => navigateTo(path);

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
        (result) => setFileContent(result?.content || (typeof result === "string" ? result : "// [BINARY OR ENCRYPTED]")),
        () => setFileContent("!! UPLINK TIMEOUT")
      );
    } catch { setFileContent("!! HANDSHAKE FAILED"); }
  }, [hostname, pollResult]);

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
          const blob = new Blob([result.content || result], { type:"application/octet-stream" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = fileItem.name;
          document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        },
        () => setDownloading(false)
      );
    } catch { setDownloading(false); }
  }, [hostname, selectedFile, pollResult]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const processed = useMemo(() => [...items]
    .filter(item => {
      const ms = item.name.toLowerCase().includes(search.toLowerCase());
      const mt = typeFilter === "all" ? true : typeFilter === "dir" ? item.type === "directory" : true;
      return ms && mt;
    })
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }), [items, search, typeFilter, sortDir]);

  const stats = useMemo(() => ({
    total: items.length, dirs: items.filter(i => i.type === "directory").length,
    files: items.filter(i => i.type !== "directory").length,
    totalSize: items.reduce((a, i) => a + (i.size || 0), 0),
  }), [items]);

  const breadcrumbs = parseBreadcrumbs(currentPath);

  return (
    // FIX 3: Removed pt-24 and h-screen from the main div.
    // This allows the page to expand and scroll correctly within DashboardLayout.
    <div className="space-y-4 relative selection:bg-cyan-500/30 font-mono text-[11px]">
      
      {/* ── TOOLBAR ── */}
      <div className="bg-[#0b0f1a] border border-white/[0.06] p-3 rounded-2xl shadow-xl flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <NavBtn onClick={() => historyIndex > 0 && navigateTo(pathHistory[historyIndex-1])} disabled={historyIndex <= 0}><ArrowLeft size={14} /></NavBtn>
            <NavBtn onClick={() => navigateTo("/")}><Home size={14} /></NavBtn>
          </div>

          <div className="flex-1 relative">
            <div onClick={() => { setPathInput(currentPath); setEditingPath(true); }}
              className="flex items-center gap-2 bg-black/40 border border-white/[0.07] hover:border-white/20 rounded-xl px-3 py-2 cursor-text transition-all">
              <Terminal size={11} className="text-gray-700 shrink-0" />
              <span className="text-cyan-400 tracking-widest uppercase font-bold truncate flex-1">{currentPath}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[8px] font-bold uppercase ${online ? "border-green-500/20 text-green-500" : "border-red-500/20 text-red-500"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${online ? "bg-green-500" : "bg-red-500"}`} />
              <span>{online ? "LIVE" : "OFFLINE"}</span>
            </div>
            <NavBtn onClick={() => refreshPath(currentPath)}><RefreshCw size={14} className={localLoading ? "animate-spin text-cyan-400" : ""} /></NavBtn>
          </div>
        </div>

        <div className="flex items-center gap-0.5 flex-wrap px-1">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.path}>
              <button onClick={() => navigateTo(crumb.path)}
                className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg hover:bg-white/5 ${i === breadcrumbs.length-1 ? "text-cyan-400" : "text-gray-600"}`}>
                {crumb.label}
              </button>
              {i < breadcrumbs.length-1 && <ChevronRight size={8} className="text-gray-800" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── FILE LISTING ── */}
      <div className="bg-[#080c15] border border-white/[0.05] rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#080c15] z-20 border-b border-white/[0.04]">
              <tr className="text-[8px] font-black uppercase text-gray-700 tracking-widest">
                <th className="px-5 py-3">Name</th>
                <th className="px-3 py-3 hidden md:table-cell">Type</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.025]">
              {items.map((item, i) => (
                <tr key={i} onClick={() => item.type === "directory" ? navigateTo(item.path) : viewFile(item)} 
                    className="hover:bg-white/[0.018] cursor-pointer group">
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-3">
                      {item.type === "directory" ? <Folder size={14} className="text-cyan-400" /> : <File size={14} className="text-gray-500" />}
                      <span className={item.type === "directory" ? "text-white" : "text-gray-400"}>{item.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell text-gray-600 uppercase text-[9px]">{item.type}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.type !== "directory" && <button onClick={(e) => { e.stopPropagation(); handleDownload(item); }} className="p-1 hover:text-cyan-400"><Download size={14}/></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── VIEWER MODAL ── */}
      <AnimatePresence>
        {inspecting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#060a12] border border-white/10 w-full max-w-5xl h-[80vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
              <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                <span className="text-white font-bold uppercase">{selectedFile?.name}</span>
                <button onClick={() => setInspecting(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-auto p-6 bg-black/40">
                <pre className="text-cyan-400/80 text-[10px] leading-relaxed whitespace-pre-wrap">{fileContent}</pre>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #22d3ee22; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default FileExplorer;