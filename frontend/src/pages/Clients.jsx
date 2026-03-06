import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Gauge from "../components/Gauge";
import { useNavigate } from "react-router-dom";
import { Plus, Monitor, Terminal, Download, ChevronDown, Radar, Orbit } from "lucide-react"; // Added icons

const BASE_URL = "http://172.24.16.81:8001/client";
const POLL_INTERVAL_MS = 1500;

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false); // Toggle for Add Menu
  const navigate = useNavigate();
  const hasMounted = useRef(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = (platform) => {
    console.log(`Downloading agent for: ${platform}`);
    setShowAddMenu(false);
    
    // Future Implementation:
    // window.open(`${BASE_URL}/download-agent?platform=${platform}`, "_blank");
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const metricsRes = await fetch(`${BASE_URL}/metrics`);
        if (!metricsRes.ok) throw new Error("Metrics fetch failed");
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
            } catch {
              return { hostname: name, online: false };
            }
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
      } catch (err) {
        console.error("❌ Data Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER WITH ADD CLIENT BUTTON */}
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-3">
             <Orbit size={14} className="text-cyan-500 animate-pulse" />
             <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.6em]">A.U.R.O.R.A</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">CLIENTS</h1>
        </motion.div>

        {/* ADD CLIENT DROPDOWN */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-2 bg-cyan-900 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-cyan-900/20"
          >
            <Plus size={18} />
            Add Client
            <ChevronDown size={14} className={`transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showAddMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden"
              >
                <div className="px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 mb-1">
                  Select OS Platform
                </div>
                <button
                  onClick={() => handleDownload("linux")}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-800 rounded-lg text-sm text-gray-200 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-cyan-400" />
                    Linux Agent
                  </div>
                  <Download size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button
                  onClick={() => handleDownload("windows")}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-800 rounded-lg text-sm text-gray-200 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Monitor size={16} className="text-blue-400" />
                    Windows Agent
                  </div>
                  <Download size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {clients.map(client => (
          <motion.div
            key={client.hostname}
            initial={hasMounted.current ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              border rounded-2xl p-6 flex flex-col transition-all duration-500
              ${client.isOnline 
                ? 'bg-gray-900/60 border-gray-800 shadow-lg' 
                : 'bg-black/40 border-gray-900 opacity-60 grayscale-[0.5]'}
            `}
          >
            {/* HEADER */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className={`text-lg font-bold tracking-tight ${client.isOnline ? 'text-white' : 'text-gray-500'}`}>
                  {client.hostname}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)] ${
                  client.isOnline 
                    ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                  {client.isOnline ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>

            {/* GAUGES */}
            <div className="grid grid-cols-2 gap-4">
              <Gauge label="CPU" value={client.isOnline ? client.cpu : "--"} />
              <Gauge label="Memory" value={client.isOnline ? client.ram : "--"} />
            </div>

            {/* ACTION */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-[10px] font-mono text-gray-600">
                {client.isOnline ? `SYNC: ${new Date(client.timestamp).toLocaleTimeString()}` : 'CONNECTION LOST'}
              </p>
              <button
                onClick={() => client.isOnline && navigate(`/clients/${client.hostname}`)}
                disabled={!client.isOnline}
                className={`
                  text-xs font-bold px-4 py-2 rounded-xl transition-all
                  ${client.isOnline 
                    ? 'text-cyan-400 bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-400' 
                    : 'text-gray-700 bg-transparent border border-gray-900 cursor-not-allowed'}
                `}
              >
                Inspect Node →
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Clients;