import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Gauge from "../components/Gauge";
import { useNavigate } from "react-router-dom";
import { Plus, Monitor, Terminal, Download, ChevronDown, Radio, ChevronRight, ArrowLeft } from "lucide-react";

const API_BASE = "http://172.24.16.81:8001"; 
const BASE_URL = `${API_BASE}/client`;
const POLL_INTERVAL_MS = 1500;

const Clients = ({ setLoading, setError }) => {
  const [clients, setClients] = useState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const navigate = useNavigate();
  const hasMounted = useRef(false);
  const menuRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowAddMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = (platform) => {
    const downloadUrl = `${BASE_URL}/download/${platform}`;
    window.location.href = downloadUrl;
    setShowAddMenu(false);
  };

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading?.(true);
      setError?.(null);
    }
    
    try {
      const metricsRes = await fetch(`${BASE_URL}/metrics`);
      if (!metricsRes.ok) throw new Error("Metrics link failure");
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

      const sortedClients = mergedClients.sort((a, b) => {
        if (a.isOnline === b.isOnline) return a.hostname.localeCompare(b.hostname);
        return a.isOnline ? -1 : 1;
      });

      setClients(sortedClients);
      if (isInitial) setLoading?.(false);
    } catch (err) {
      if (isInitial) {
        setLoading?.(false);
        setError?.("Neural link to global client registry interrupted.");
      }
    } finally {
      timerRef.current = setTimeout(() => loadData(false), POLL_INTERVAL_MS);
    }
  }, [setLoading, setError]);

  useEffect(() => {
    loadData(true);
    hasMounted.current = true;
    return () => clearTimeout(timerRef.current);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-inter p-4 md:p-6">
      {/* Container max-width adjusted to 1400px to keep 3-column layout comfortable */}
      <div className="max-w-[1400px] mx-auto space-y-6 selection:bg-cyan-500/30">
        
        {/* HEADER */}
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
                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
                <h1 className="text-2xl font-black text-white tracking-tighter uppercase font-inter">
                  Client Registry
                </h1>
              </div>
              <p className="font-roboto-condensed text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">
                Global_Sensor_Network_Monitoring // nodes_active
              </p>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-3 bg-white text-slate-950 px-5 py-2 rounded-xl font-roboto-condensed font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg hover:bg-cyan-400"
            >
              <Plus size={14} strokeWidth={3} /> Deploy Agent
              <ChevronDown size={12} className={`transition-transform duration-300 ${showAddMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showAddMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-56 bg-[#0a0c14] border border-white/10 rounded-xl shadow-2xl z-50 p-1 backdrop-blur-xl"
                >
                  <div className="font-roboto-condensed px-3 py-2 text-[8px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">Architecture_Select</div>
                  
                  <button onClick={() => handleDownload("linux")} className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-lg transition-all group">
                    <div className="flex items-center gap-2">
                      <Terminal size={14} className="text-cyan-400" /> 
                      <span className="font-jetbrains text-[10px] font-bold text-slate-200">Linux_x64 (.deb)</span>
                    </div>
                    <Download size={12} className="text-slate-600 group-hover:text-white" />
                  </button>

                  <button onClick={() => handleDownload("windows")} className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-lg transition-all group">
                    <div className="flex items-center gap-2">
                      <Monitor size={14} className="text-blue-400" /> 
                      <span className="font-jetbrains text-[10px] font-bold text-slate-200">Win_x64 (.exe)</span>
                    </div>
                    <Download size={12} className="text-slate-600 group-hover:text-white" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* CLIENTS GRID: Changed xl:grid-cols-4 to xl:grid-cols-3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {clients.map(client => (
            <motion.div
              key={client.hostname}
              className={`
                relative overflow-hidden border rounded-3xl p-6 flex flex-col transition-all duration-500 backdrop-blur-md
                ${client.isOnline 
                  ? 'bg-white/[0.02] border-white/5 hover:border-cyan-500/30' 
                  : 'bg-black/40 border-white/5 opacity-40 grayscale'}
              `}
            >
              <div className="mb-6 flex justify-between items-start">
                <div className="min-w-0">
                  <h2 className="font-inter text-xl font-black tracking-tighter uppercase truncate text-white">
                    {client.hostname}
                  </h2>
                  <p className="font-roboto-condensed text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Telemetry_Node</p>
                </div>

                <div className={`font-roboto-condensed flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest ${
                  client.isOnline 
                    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  <Radio size={8} /> {client.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Gauge label="Core_Load" value={client.isOnline ? client.cpu : NaN} />
                <Gauge label="RAM_Usage" value={client.isOnline ? client.ram : NaN} />
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="font-roboto-condensed text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">Pulse_Log</span>
                    <p className="font-jetbrains text-[9px] font-bold text-slate-400 uppercase">
                        {client.isOnline ? new Date(client.timestamp).toLocaleTimeString() : 'Offline'}
                    </p>
                </div>
                <button
                  onClick={() => client.isOnline && navigate(`/clients/${client.hostname}`)}
                  disabled={!client.isOnline}
                  className={`
                    font-roboto-condensed flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
                    ${client.isOnline 
                      ? 'text-slate-950 bg-white hover:bg-cyan-400' 
                      : 'text-slate-700 bg-white/5 cursor-not-allowed'}
                  `}
                >
                  Inspect <ChevronRight size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Clients;