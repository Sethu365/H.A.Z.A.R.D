import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Gauge from "../components/Gauge";
import { useNavigate } from "react-router-dom";
import { Plus, Monitor, Terminal, Download, ChevronDown, Radio, ChevronRight, AlertCircle } from "lucide-react";
import Topbar from "../components/Topbar";

const BASE_URL = "http://172.24.16.81:8001/client";
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
    console.log(`Downloading agent for: ${platform}`);
    setShowAddMenu(false);
  };

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setError(null);
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
      if (isInitial) setLoading(false);
    } catch (err) {
      console.error("❌ Data Sync Error:", err);
      if (isInitial) {
        setLoading(false);
        setError("Neural link to global client registry interrupted.");
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
    <div className="min-h-screen bg-[#020617] text-slate-200 font-inter">
      <Topbar name="Client Registry" desc="Global_Sensor_Network_Monitoring" />

      <main className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto space-y-8 overflow-x-hidden">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="h-3 w-3 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#06b6d4]" />
             {/* Labels: Roboto Condensed */}
             <span className="font-roboto-condensed text-[10px] font-black text-cyan-400 uppercase tracking-[0.6em]">Active_Nodes</span>
          </div>

          <div className="relative w-full sm:w-auto" ref={menuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-black px-6 py-3 rounded-2xl font-roboto-condensed font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl hover:bg-cyan-400"
            >
              <Plus size={18} /> Deploy Agent
              <ChevronDown size={14} className={`transition-transform duration-300 ${showAddMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showAddMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-64 bg-[#0a0c14] border border-white/10 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 p-2 overflow-hidden backdrop-blur-xl"
                >
                  <div className="font-roboto-condensed px-4 py-3 text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5 mb-1">Protocol_Selection</div>
                  
                  <button onClick={() => handleDownload("linux")} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-all group">
                    <div className="flex items-center gap-3">
                      <Terminal size={16} className="text-cyan-400" /> 
                      {/* Technical Options: JetBrains Mono */}
                      <span className="font-jetbrains text-[11px] font-bold text-gray-200">Linux_gRPC</span>
                    </div>
                    <Download size={14} className="text-gray-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                  </button>

                  <button onClick={() => handleDownload("windows")} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-all group">
                    <div className="flex items-center gap-3">
                      <Monitor size={16} className="text-blue-400" /> 
                      <span className="font-jetbrains text-[11px] font-bold text-gray-200">Win_Sensor</span>
                    </div>
                    <Download size={14} className="text-gray-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CLIENTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(client => (
            <motion.div
              key={client.hostname}
              initial={hasMounted.current ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                relative overflow-hidden border rounded-[2.5rem] p-6 flex flex-col transition-all duration-700 backdrop-blur-md shadow-2xl
                ${client.isOnline 
                  ? 'bg-white/[0.02] border-white/5 hover:border-cyan-500/20 shadow-cyan-500/5' 
                  : 'bg-black/40 border-white/5 opacity-50 grayscale'}
              `}
            >
              {client.isOnline && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
              )}

              {/* CARD HEADER */}
              <div className="mb-8 flex justify-between items-start">
                <div className="min-w-0">
                  {/* Headers: Inter (or Roboto Condensed for brand uniformity) */}
                  <h2 className={`font-inter text-2xl font-black tracking-tighter uppercase truncate ${client.isOnline ? 'text-white' : 'text-gray-600'}`}>
                    {client.hostname}
                  </h2>
                  <p className="font-roboto-condensed text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Status_Registry</p>
                </div>

                <div className={`font-roboto-condensed flex items-center gap-2 px-3 py-1 rounded-full border-2 text-[8px] font-black uppercase tracking-widest ${
                  client.isOnline 
                    ? 'bg-green-500/5 text-green-400 border-green-500/20 animate-pulse' 
                    : 'bg-red-500/5 text-red-400 border-red-500/20'
                }`}>
                  <Radio size={10} /> {client.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>

              {/* GAUGES */}
              <div className="grid grid-cols-2 gap-4">
                <Gauge label="Core_Load" value={client.isOnline ? client.cpu : NaN} />
                <Gauge label="Buffer_Usage" value={client.isOnline ? client.ram : NaN} />
              </div>

              {/* ACTION FOOTER */}
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="font-roboto-condensed text-[7px] font-black text-gray-600 uppercase tracking-widest mb-1">Last_Pulse</span>
                    {/* Timestamps: JetBrains Mono */}
                    <p className="font-jetbrains text-[10px] font-bold text-gray-400">
                        {client.isOnline ? new Date(client.timestamp).toLocaleTimeString() : 'TERMINATED'}
                    </p>
                </div>
                <button
                  onClick={() => client.isOnline && navigate(`/clients/${client.hostname}`)}
                  disabled={!client.isOnline}
                  className={`
                    font-roboto-condensed flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
                    ${client.isOnline 
                      ? 'text-black bg-white hover:bg-cyan-400 shadow-lg' 
                      : 'text-gray-700 bg-white/5 cursor-not-allowed opacity-20'}
                  `}
                >
                  Inspect <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Clients;