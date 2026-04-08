import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Plus, Monitor, Terminal, Download, ChevronDown, Radio, ChevronRight, X } from "lucide-react";
import Gauge from "../components/Gauge";

const API_BASE = "http://172.24.16.81:8001"; 
const BASE_URL = `${API_BASE}/client`;
const POLL_INTERVAL_MS = 1500;

const Clients = ({ setLoading, setError }) => {
  const context = useOutletContext();
  const setHeaderData = context?.setHeaderData;

  const [clients, setClients] = useState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const navigate = useNavigate();
  const hasMounted = useRef(false);
  const menuRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (setHeaderData) {
      setHeaderData({
        name: "Client Registry",
        desc: "Global_Sensor_Network_Monitoring // Active gRPC Nodes"
      });
    }
  }, [setHeaderData]);

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

      setClients(mergedClients.sort((a, b) => (a.isOnline === b.isOnline ? a.hostname.localeCompare(b.hostname) : a.isOnline ? -1 : 1)));
      if (isInitial) setLoading?.(false);
    } catch (err) {
      if (isInitial) {
        setLoading?.(false);
        setError?.("Neural link to global client registry interrupted.");
      }
    } finally {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => loadData(false), POLL_INTERVAL_MS);
    }
  }, [setLoading, setError]);

  useEffect(() => {
    loadData(true);
    hasMounted.current = true;
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [loadData]);

  return (
    <div className="space-y-10 pb-20 relative">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="p-3 rounded-2xl bg-indigo-500/10 dark:bg-cyan-500/10 border border-indigo-500/20 dark:border-cyan-500/20">
              <Radio size={20} className="text-indigo-600 dark:text-cyan-400 animate-pulse" />
           </div>
           <div>
              <span className="font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Node_Status</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">Client Buffer</h3>
           </div>
        </div>

        <div className="relative w-full sm:w-auto" ref={menuRef}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-full sm:w-auto flex items-center justify-center gap-4 px-8 py-4 rounded-3xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/20"
          >
            <Plus size={18} /> Deploy Agent
            <ChevronDown size={14} className={`transition-transform duration-300 ${showAddMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showAddMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute right-0 mt-4 w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-[2rem] shadow-2xl z-50 p-3 overflow-hidden"
              >
                <div className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 mb-2">Platform Selector</div>
                
                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-indigo-50 dark:hover:bg-white/5 rounded-2xl transition-all group">
                  <div className="flex items-center gap-3">
                    <Terminal size={18} className="text-indigo-600 dark:text-cyan-400" /> 
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Linux (.deb)</span>
                  </div>
                  <Download size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </button>

                <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-blue-50 dark:hover:bg-white/5 rounded-2xl transition-all group">
                  <div className="flex items-center gap-3">
                    <Monitor size={18} className="text-blue-500" /> 
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Windows (.exe)</span>
                  </div>
                  <Download size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CLIENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clients.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/20 dark:bg-white/5 border border-dashed border-white/40 dark:border-white/10 rounded-[3rem] backdrop-blur-md">
            <p className="text-slate-400 font-bold uppercase tracking-widest">No nodes found in registry</p>
          </div>
        )}
        
        {clients.map(client => (
          <motion.div
            key={client.hostname}
            initial={hasMounted.current ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              relative overflow-hidden rounded-[3rem] p-8 flex flex-col transition-all duration-500 backdrop-blur-3xl saturate-[1.8] border
              ${client.isOnline 
                ? 'bg-white/40 dark:bg-white/[0.03] border-white/60 dark:border-white/10 shadow-xl' 
                : 'bg-slate-200/50 dark:bg-black/40 border-slate-200 dark:border-white/5 opacity-60 grayscale'}
            `}
          >
            {/* Liquid Shine Overlay */}
            {client.isOnline && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
            )}

            <div className="mb-10 flex justify-between items-start relative z-10">
              <div className="min-w-0">
                <h2 className={`text-2xl font-black tracking-tighter uppercase truncate ${client.isOnline ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                  {client.hostname}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`h-1 w-3 rounded-full ${client.isOnline ? 'bg-indigo-500' : 'bg-slate-400'}`} />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sensor_ID: {client.hostname.slice(0, 8)}</p>
                </div>
              </div>

              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm ${
                client.isOnline 
                  ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}>
                <Radio size={10} className={client.isOnline ? "animate-pulse" : ""} /> {client.isOnline ? 'Online' : 'Offline'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 relative z-10">
              <Gauge label="Core_Load" value={client.isOnline ? client.cpu : NaN} glossy />
              <Gauge label="Buffer_Usage" value={client.isOnline ? client.ram : NaN} glossy />
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between relative z-10">
              <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last_Pulse</span>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {client.isOnline ? new Date(client.timestamp).toLocaleTimeString() : 'TERMINATED'}
                  </p>
              </div>
              <button
                onClick={() => client.isOnline && navigate(`/clients/${client.hostname}`)}
                disabled={!client.isOnline}
                className={`
                  flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all
                  ${client.isOnline 
                    ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95' 
                    : 'text-slate-400 bg-slate-100 dark:bg-white/5 cursor-not-allowed opacity-20'}
                `}
              >
                Inspect <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Clients;