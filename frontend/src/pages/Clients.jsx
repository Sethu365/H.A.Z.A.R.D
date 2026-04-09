import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Gauge from "../components/Gauge";
import { useNavigate } from "react-router-dom";
import { Plus, Monitor, Terminal, Download, ChevronDown, Radio, ChevronRight, ArrowLeft, X, WifiOff } from "lucide-react";

const API_BASE = "http://172.24.16.81:8001"; 
const BASE_URL = `${API_BASE}/client`;
const POLL_INTERVAL_MS = 1500;

const Clients = ({ setLoading, setError }) => {
  const [clients, setClients] = useState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const timerRef = useRef(null);

  // Filter for online clients only to determine if we show the empty state
  const onlineClients = clients.filter(c => c.isOnline);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowAddMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = (platform) => {
    window.location.href = `${BASE_URL}/download/${platform}`;
    setShowAddMenu(false);
  };

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) { setLoading?.(true); setError?.(null); }
    try {
      const metricsRes = await fetch(`${BASE_URL}/metrics`);
      const metricsData = await metricsRes.json();

      const latestByHost = {};
      metricsData.forEach(m => {
        if (!latestByHost[m.hostname] || new Date(m.timestamp) > new Date(latestByHost[m.hostname].timestamp)) {
          latestByHost[m.hostname] = m;
        }
      });

      const hostnames = Object.keys(latestByHost);
      const statusResults = await Promise.all(
        hostnames.map(async (name) => {
          try {
            const statusRes = await fetch(`${BASE_URL}/status/${name}`);
            return await statusRes.json();
          } catch { return { hostname: name, online: false }; }
        })
      );

      const mergedClients = hostnames.map(name => {
        const status = statusResults.find(s => s.hostname === name);
        return { ...latestByHost[name], isOnline: status?.online || false };
      });

      setClients(mergedClients.sort((a, b) => (a.isOnline === b.isOnline ? a.hostname.localeCompare(b.hostname) : a.isOnline ? -1 : 1)));
      if (isInitial) setLoading?.(false);
    } catch (err) {
      if (isInitial) { setLoading?.(false); setError?.("Neural link interrupted."); }
    } finally {
      timerRef.current = setTimeout(() => loadData(false), POLL_INTERVAL_MS);
    }
  }, [setLoading, setError]);

  useEffect(() => {
    loadData(true);
    return () => clearTimeout(timerRef.current);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-inter p-4 md:p-8 pb-24">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 md:pb-6 md:border-b border-white/5">
          <div className="flex items-center gap-4 flex-1 justify-center md:justify-start">
            <button 
              onClick={() => navigate(-1)} 
              className="hidden md:flex p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3">
                <div className="hidden md:block w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_15px_#06b6d4]" />
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase font-inter">
                  Connected Clients
                </h1>
              </div>
              <p className="hidden md:block font-roboto-condensed text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1.5 opacity-60">
                Global_Telemetry_Mesh // nodes_active
              </p>
            </div>
          </div>

          <div className="hidden md:block relative" ref={menuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-3 bg-white text-slate-950 px-6 py-3 rounded-2xl font-roboto-condensed font-black text-[11px] uppercase tracking-widest hover:bg-cyan-400 transition-all"
            >
              <Plus size={16} strokeWidth={3} /> Deploy_Agent
              <ChevronDown size={14} className={showAddMenu ? 'rotate-180' : ''} />
            </button>
            <AnimatePresence>
              {showAddMenu && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-3 w-64 bg-[#0a0c14]/95 border border-white/10 rounded-2xl shadow-2xl z-50 p-2 backdrop-blur-xl"
                >
                   <div className="font-roboto-condensed px-4 py-2 text-[8px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">Select_Architecture</div>
                   <button onClick={() => handleDownload("linux")} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-all">
                      <span className="font-jetbrains text-[10px] text-slate-200">LINUX_X64</span>
                      <Download size={14} className="text-slate-600" />
                   </button>
                   <button onClick={() => handleDownload("windows")} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-all">
                      <span className="font-jetbrains text-[10px] text-slate-200">WIN_X64</span>
                      <Download size={14} className="text-slate-600" />
                   </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* CLIENTS GRID / EMPTY STATE */}
        {onlineClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(client => (
              client.isOnline && (
                <motion.div
                  key={client.hostname}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  layout
                  className="relative overflow-hidden border border-white/10 rounded-[2.5rem] p-6 md:p-8 flex flex-col bg-white/[0.02] hover:border-cyan-500/40 shadow-2xl transition-all duration-700 backdrop-blur-xl"
                >
                  <div className="mb-8 flex justify-between items-start">
                    <div className="min-w-0">
                      <h2 className="font-inter text-xl md:text-2xl font-black tracking-tighter uppercase truncate text-white">
                        {client.hostname}
                      </h2>
                      <p className="font-roboto-condensed text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Forensic_Node</p>
                    </div>
                    <div className="font-roboto-condensed flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/20 bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-tighter">
                      <Radio size={8} className="animate-pulse" /> Active
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:gap-8">
                    <div className="flex flex-col items-center"><Gauge label="CPU" value={client.cpu} /></div>
                    <div className="flex flex-col items-center"><Gauge label="RAM" value={client.ram} /></div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-roboto-condensed text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">Node_Sync</span>
                      <p className="font-jetbrains text-[10px] font-bold text-slate-400 uppercase tabular-nums">
                        {new Date(client.timestamp).toLocaleTimeString([], {hour12: false})}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/clients/${client.hostname}`)}
                      className="font-roboto-condensed flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all text-slate-950 bg-white hover:bg-cyan-400 active:scale-95"
                    >
                      Inspect <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )
            ))}
          </div>
        ) : (
          /* Stylized Empty State */
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4"
          >
            <div className="p-6 rounded-full bg-white/[0.02] border border-white/5 shadow-inner">
              <WifiOff size={48} className="text-slate-700 opacity-20" />
            </div>
            <h3 className="font-roboto-condensed text-lg md:text-xl font-black uppercase tracking-[0.5em] text-slate-600">
              ~ No Connected Clients ~
            </h3>
            <p className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest">
              Awaiting neural handshake from remote agents...
            </p>
          </motion.div>
        )}
      </div>

      {/* MOBILE FLOATING ACTION BUBBLE */}
      <div className="md:hidden fixed bottom-32 right-6 z-[2000]" ref={menuRef}>
        <AnimatePresence>
          {showAddMenu && (
            <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-20 right-0 w-64 bg-[#0a0c14]/95 border border-white/10 rounded-[2rem] shadow-2xl p-2 backdrop-blur-2xl overflow-hidden"
            >
              <div className="font-roboto-condensed px-4 py-3 text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5 mb-1 text-center">Deploy_Architecture</div>
              <button onClick={() => handleDownload("linux")} className="w-full flex items-center justify-between px-4 py-4 hover:bg-cyan-500/10 rounded-2xl transition-all">
                <div className="flex items-center gap-3"><Terminal size={18} className="text-cyan-400" /><span className="font-jetbrains text-[11px] font-bold text-slate-200">LINUX_X64</span></div>
                <Download size={16} className="text-slate-600" />
              </button>
              <button onClick={() => handleDownload("windows")} className="w-full flex items-center justify-between px-4 py-4 hover:bg-cyan-500/10 rounded-2xl transition-all">
                <div className="flex items-center gap-3"><Monitor size={18} className="text-blue-400" /><span className="font-jetbrains text-[11px] font-bold text-slate-200">WIN_X64</span></div>
                <Download size={16} className="text-slate-600" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className={`w-16 h-16 flex items-center justify-center rounded-full shadow-2xl transition-all active:scale-90 relative overflow-hidden ${showAddMenu ? 'bg-red-500 text-white' : 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-black'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50" />
          <motion.div animate={{ rotate: showAddMenu ? 45 : 0 }}>
            {showAddMenu ? <X size={28} strokeWidth={3} /> : <Plus size={28} strokeWidth={3} />}
          </motion.div>
        </button>
      </div>
    </div>
  );
};

export default Clients;