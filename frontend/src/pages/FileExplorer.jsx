import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Folder, File, Search, HardDrive, 
  Download, Eye, Terminal, Info, X, RefreshCw, Loader2
} from "lucide-react";

const API_BASE = "http://172.24.16.81:8001/client";

const FileExplorer = () => {
  const { hostname } = useParams();
  const [currentPath, setCurrentPath] = useState("/");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [inspecting, setInspecting] = useState(false);

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pollResult = async (commandId) => {
    try {
      const res = await fetch(`${API_BASE}/command-result/${commandId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const latest = data[0];
          if (latest.output) {
            try {
              return JSON.parse(latest.output);
            } catch (e) {
              return latest.output;
            }
          }
        }
      }
    } catch (err) { console.error("Poll Error:", err); }
    return null;
  };

  const fetchDirectory = useCallback(async (path) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/filesystem/${hostname}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      const cmd = await res.json();
      
      let attempts = 0;
      const interval = setInterval(async () => {
        const result = await pollResult(cmd.command_id);
        if (result || attempts > 15) {
          clearInterval(interval);
          if (result?.items) {
            setItems(result.items);
            setCurrentPath(result.current_path);
          }
          setLoading(false);
        }
        attempts++;
      }, 2000);
    } catch (err) { setLoading(false); }
  }, [hostname]);

  const viewFile = async (item) => {
    setSelectedFile(item);
    setInspecting(true);
    setFileContent(" > INITIALIZING REMOTE STREAM...");
    try {
      const res = await fetch(`${API_BASE}/file-content/${hostname}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: item.path })
      });
      const cmd = await res.json();
      
      let attempts = 0;
      const interval = setInterval(async () => {
        const result = await pollResult(cmd.command_id);
        if (result || attempts > 15) {
          clearInterval(interval);
          // Handle Base64 preview if necessary, otherwise plain text
          setFileContent(result?.content || (typeof result === 'string' ? result : "Binary content hidden."));
        }
        attempts++;
      }, 2000);
    } catch (err) { setFileContent("!! AGENT_CONTENT_REQUEST_FAILED"); }
  };

  // INTEGRATED BASE64 DOWNLOAD LOGIC
  const handleDownload = async () => {
    if (!selectedFile) return;
    setDownloading(true);
    
    try {
      const res = await fetch(`${API_BASE}/file-content/${hostname}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile.path })
      });
      const cmd = await res.json();

      let attempts = 0;
      const interval = setInterval(async () => {
        const result = await pollResult(cmd.command_id);
        
        if (result || attempts > 20) {
          clearInterval(interval);
          setDownloading(false);

          if (result) {
            let blob;
            // CHECK FOR BASE64 ENCODING
            if (result.encoding === "base64") {
              const byteCharacters = atob(result.content);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              blob = new Blob([byteArray], { type: "application/octet-stream" });
            } else {
              // Standard text content
              blob = new Blob([result.content || result], { type: "application/octet-stream" });
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", selectedFile.name);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
          }
        }
        attempts++;
      }, 2000);

    } catch (err) {
      setDownloading(false);
      alert("Critical: Download handshake failed.");
    }
  };

  useEffect(() => { fetchDirectory("/"); }, [fetchDirectory]);

  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 overflow-hidden font-mono">
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
        <header className="px-8 py-6 border-b border-slate-800 bg-slate-900/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                <HardDrive className="text-cyan-500" /> Remote Explorer
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Node: {hostname}</span>
                <span className="text-slate-700">/</span>
                <span className="text-[10px] text-cyan-500 font-bold uppercase truncate max-w-[300px]">{currentPath}</span>
              </div>
            </div>
            <button onClick={() => fetchDirectory(currentPath)} className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 transition-all hover:bg-slate-700">
              <RefreshCw className={loading ? 'animate-spin border-cyan-500 text-cyan-400' : ''} size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 bg-black border border-slate-800 rounded-xl px-4 py-3 group focus-within:border-cyan-500/50 shadow-inner">
            <Terminal size={14} className="text-slate-600" />
            <input 
              value={currentPath}
              onChange={(e) => setCurrentPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDirectory(currentPath)}
              className="bg-transparent border-none outline-none text-cyan-400 text-sm w-full font-mono"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#020617] z-20">
              <tr className="text-[11px] font-black uppercase text-slate-500 border-b border-slate-800 bg-black/60">
                <th className="px-8 py-4">Resource Identity</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4 text-center">Protocol Attributes</th>
                <th className="px-6 py-4 text-right">Access</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const isDir = item.type === "directory";
                return (
                  <tr key={i} className="group hover:bg-cyan-500/[0.03] border-b border-slate-800/20 transition-all">
                    <td className="px-8 py-3.5">
                      <div className="flex items-center gap-3">
                        {isDir ? <Folder className="text-cyan-500" size={18} /> : <File className="text-slate-500" size={18} />}
                        <span 
                          onClick={() => isDir ? fetchDirectory(item.path) : viewFile(item)}
                          className={`text-sm font-semibold cursor-pointer hover:text-cyan-400 transition-colors ${isDir ? 'text-white' : 'text-slate-300'}`}
                        >
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500 font-mono italic">{formatSize(item.size)}</td>
                    <td className="px-6 py-3.5 text-center">
                       <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-black tracking-tighter ${isDir ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                         {item.type}
                       </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {!isDir && (
                        <button onClick={() => viewFile(item)} className="p-2 hover:bg-cyan-500/20 rounded-lg text-slate-600 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Eye size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {inspecting && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="w-[700px] bg-[#020617] border-l border-slate-800 flex flex-col shadow-2xl relative z-30">
            <div className="p-8 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                  <File size={24} />
                </div>
                <div>
                  <h2 className="text-white font-black text-xl uppercase tracking-tight truncate w-80 italic">{selectedFile?.name}</h2>
                  <p className="text-[10px] text-cyan-500/60 font-mono font-bold uppercase tracking-widest">{selectedFile?.path}</p>
                </div>
              </div>
              <button onClick={() => setInspecting(false)} className="p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-500 rounded-full transition-all">
                <X size={26} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-thin">
              <div className="bg-black/80 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative">
                <div className="flex items-center justify-between bg-slate-900/40 px-6 py-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <Terminal size={12} /> Data Buffer Preview
                  </div>
                  <span className="text-[9px] text-slate-700 font-mono">Size: {formatSize(selectedFile?.size)}</span>
                </div>
                <div className="p-8">
                   <pre className="text-xs text-slate-400 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto selection:bg-cyan-500/40 selection:text-white">
                     {fileContent}
                   </pre>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="p-5 rounded-2xl bg-slate-900/20 border border-slate-800 flex items-center gap-4">
                    <div className="p-2 bg-slate-800 rounded-lg text-cyan-600"><Info size={18} /></div>
                    <div>
                      <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Protocol</p>
                      <p className="text-xs text-slate-300 font-bold uppercase italic">A.U.R.O.R.A Secure Stream</p>
                    </div>
                 </div>
                 <button 
                  disabled={downloading}
                  onClick={handleDownload}
                  className="p-5 rounded-2xl bg-cyan-500 text-black font-black uppercase text-xs flex items-center justify-center gap-3 hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all group active:scale-95 disabled:bg-slate-700 disabled:text-slate-500"
                 >
                    {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />}
                    {downloading ? "Reconstructing..." : "Download Asset"}
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileExplorer;