import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Folder, File, HardDrive, Download, Eye, Terminal, 
  Info, X, RefreshCw, Loader2, ChevronRight, Binary
} from "lucide-react";
import Topbar from "../components/Topbar";

const API_BASE = "http://172.24.16.81:8001/client";

const FileExplorer = ({ setLoading, setError }) => {
  const { hostname } = useParams();
  const [currentPath, setCurrentPath] = useState("/");
  const [items, setItems] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
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
            try { return JSON.parse(latest.output); } catch (e) { return latest.output; }
          }
        }
      }
    } catch (err) { console.error("Poll Error:", err); }
    return null;
  };

  const fetchDirectory = useCallback(async (path, isInitial = false) => {
    if (isInitial) { setLoading(true); setError(null); }
    setLocalLoading(true);
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
          if (isInitial) setLoading(false);
          setLocalLoading(false);
        }
        attempts++;
      }, 2000);
    } catch (err) { 
        if (isInitial) setLoading(false);
        setLocalLoading(false); 
    }
  }, [hostname, setLoading, setError]);

  const viewFile = async (item) => {
    setSelectedFile(item);
    setInspecting(true);
    setFileContent(" > SYNCHRONIZING REMOTE BUFFER...");
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
          setFileContent(result?.content || (typeof result === 'string' ? result : "// [ENCRYPTED_OR_BINARY_PAYLOAD_HIDDEN]"));
        }
        attempts++;
      }, 2000);
    } catch (err) { setFileContent("!! UPLINK_HANDSHAKE_FAILED"); }
  };

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
            if (result.encoding === "base64") {
              const byteCharacters = atob(result.content);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
              blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/octet-stream" });
            } else { blob = new Blob([result.content || result], { type: "application/octet-stream" }); }
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
    } catch (err) { setDownloading(false); alert("Critical Link Failure."); }
  };

  useEffect(() => { fetchDirectory("/", true); }, [fetchDirectory]);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-['Nunito']">
      <Topbar name="Filesystem" desc={`Remote_Explorer :: ${hostname}`} />

      <main className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-6 h-[calc(100vh-20px)] lg:h-screen">
        
        {/* PATH CONTROLLER */}
        <div className="bg-white/[0.02] border border-white/5 p-4 md:p-6 rounded-[2rem] backdrop-blur-md shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="text-cyan-500 animate-pulse" size={20} />
              <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.3em] italic">Node_Stream</h3>
            </div>
            <button 
              onClick={() => fetchDirectory(currentPath)} 
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all active:scale-95"
            >
              <RefreshCw className={localLoading ? 'animate-spin text-cyan-400' : 'text-gray-400'} size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl px-5 py-3 focus-within:border-cyan-500/50 transition-all">
            <Terminal size={14} className="text-gray-600" />
            <input 
              value={currentPath}
              onChange={(e) => setCurrentPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDirectory(currentPath)}
              className="bg-transparent border-none outline-none text-cyan-400 text-xs md:text-sm w-full font-mono uppercase font-bold tracking-widest"
            />
          </div>
        </div>

        {/* RESOURCE TABLE */}
        <div className="flex-1 bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-inner flex flex-col">
          <div className="overflow-x-auto cyber-scroll flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#0a0c14] z-20 shadow-xl">
                <tr className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] border-b border-white/5">
                  <th className="px-8 py-5">Asset_Identity</th>
                  <th className="px-6 py-5 hidden sm:table-cell">Size_Buffer</th>
                  <th className="px-6 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item, i) => {
                  const isDir = item.type === "directory";
                  return (
                    <tr key={i} className="group hover:bg-cyan-500/[0.03] transition-all">
                      <td className="px-8 py-4">
                        <div 
                          className="flex items-center gap-4 cursor-pointer"
                          onClick={() => isDir ? fetchDirectory(item.path) : viewFile(item)}
                        >
                          {isDir ? (
                             <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500"><Folder size={18} /></div>
                          ) : (
                             <div className="p-2 bg-white/5 rounded-lg text-gray-500"><File size={18} /></div>
                          )}
                          <div className="min-w-0">
                            <p className={`text-sm font-extrabold truncate italic uppercase tracking-tight ${isDir ? 'text-white' : 'text-gray-300'}`}>
                              {item.name}
                            </p>
                            <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest sm:hidden">
                                {formatSize(item.size)} // {item.type}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-[10px] font-mono font-bold text-gray-500 italic uppercase">
                          {item.type} // {formatSize(item.size)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isDir && (
                          <button onClick={() => viewFile(item)} className="p-2.5 bg-white/5 hover:bg-white text-gray-500 hover:text-black rounded-xl transition-all shadow-xl">
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
      </main>

      {/* INSPECTION MODAL (RESPONSIVE) */}
      <AnimatePresence>
        {inspecting && (
          <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-8 bg-black/80 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => setInspecting(false)} />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="w-full max-w-5xl h-[85vh] bg-[#05070a] border-t lg:border border-white/10 flex flex-col rounded-t-[2.5rem] lg:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,1)] relative z-[110] overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                    <Binary size={24} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-white font-black text-xl italic uppercase tracking-tighter truncate md:w-96">{selectedFile?.name}</h2>
                    <p className="text-[9px] text-gray-500 font-mono font-bold uppercase tracking-widest truncate">{selectedFile?.path}</p>
                  </div>
                </div>
                <button onClick={() => setInspecting(false)} className="p-3 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-full transition-all active:scale-90">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 cyber-scroll">
                <div className="bg-black/60 rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden relative">
                  <div className="flex items-center justify-between bg-white/[0.02] px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 text-[9px] font-extrabold uppercase tracking-widest">
                      <Terminal size={12} /> Buffer_Readout
                    </div>
                    <span className="text-[9px] font-bold text-cyan-500/60 uppercase">Vol: {formatSize(selectedFile?.size)}</span>
                  </div>
                  <div className="p-6 md:p-8">
                     <pre className="text-xs md:text-sm text-gray-400 font-mono leading-relaxed whitespace-pre-wrap selection:bg-cyan-500/40">
                       {fileContent}
                     </pre>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                      <div className="p-3 bg-white/5 rounded-xl text-cyan-500"><Info size={20} /></div>
                      <div>
                        <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Protocol</p>
                        <p className="text-xs text-gray-200 font-extrabold uppercase italic">A.U.R.O.R.A Secure Stream</p>
                      </div>
                   </div>
                   <button 
                    disabled={downloading}
                    onClick={handleDownload}
                    className="p-6 rounded-[1.5rem] bg-white text-black font-black uppercase text-xs flex items-center justify-center gap-3 hover:bg-cyan-400 transition-all group active:scale-95 disabled:bg-gray-800 disabled:text-gray-600"
                   >
                      {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      {downloading ? "Reconstructing..." : "Extract Asset"}
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileExplorer;