import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Server, Globe, Activity, Loader2, Cpu, 
  ShieldCheck, Zap, HardDrive, LayoutGrid, Radio, Hash
} from "lucide-react";

const API_BASE = "http://172.24.16.81:8001/client";

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="group flex items-center justify-between py-3.5 border-b border-gray-800/40 last:border-0 hover:bg-white/[0.02] transition-colors px-2 rounded-lg">
    <div className="flex items-center gap-3">
      {Icon && <Icon size={14} className="text-gray-500 group-hover:text-cyan-400 transition-colors" />}
      <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-gray-100 font-mono text-sm font-semibold tracking-tight truncate ml-4">
      {value || "N/A"}
    </span>
  </div>
);

const ClientDetails = () => {
  const { hostname } = useParams();
  const [data, setData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchHostData = useCallback(async () => {
    try {
      const [sysRes, statRes] = await Promise.all([
        fetch(`${API_BASE}/system-info/${hostname}`),
        fetch(`${API_BASE}/status/${hostname}`)
      ]);
      
      if (!sysRes.ok || !statRes.ok) throw new Error("Node unreachable");

      const sysData = await sysRes.json();
      const statData = await statRes.json();

      setData(sysData);
      setIsOnline(statData.online);
      setError(false);
    } catch (err) {
      console.error("Telemetry Link Failure:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [hostname]);

  useEffect(() => {
    fetchHostData();
    const interval = setInterval(fetchHostData, 5000); // This is where the "often" fetching happens
    return () => clearInterval(interval);
  }, [fetchHostData]);

  // Formatter for the Last Pulse timestamp from SQLite
// Formatter for the Last Pulse timestamp from SQLite to IST
const formatPulse = (timestamp) => {
  if (!timestamp) return "NEVER";
  
  try {
    // We append 'Z' to the timestamp if it's missing to ensure 
    // the JS Date object treats the input as UTC.
    const utcDate = new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z');
    
    return utcDate.toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  } catch (e) {
    console.error("Date conversion error", e);
    return "INVALID_TS";
  }
};
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] bg-[#020617]">
      <div className="relative">
        <Loader2 className="w-16 h-16 text-cyan-500 animate-spin" />
        <div className="absolute inset-0 blur-3xl bg-cyan-500/20 rounded-full animate-pulse" />
      </div>
      <p className="text-cyan-500/60 font-mono text-xs mt-8 uppercase tracking-[0.4em] animate-pulse">
        Synchronizing Neural Link...
      </p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 p-4 md:p-8"
    >
      {/* HEADER */}
      <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-gray-800">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <Server className="text-cyan-400" size={24} />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
              {hostname}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-500 font-mono text-[10px] uppercase tracking-widest md:pl-14">
            <span className="flex items-center gap-2">
              <span className="text-gray-600">ID:</span> 
              <span className="text-gray-300" >{data?.sensor_id?.slice(0, 18) || "UNKNOWN"}...</span>
            </span>
            <span className="hidden md:block w-1 h-1 bg-gray-700 rounded-full" />
            <span className="flex items-center gap-2">
              <span className="text-gray-600">Arch:</span> 
              <span className="text-gray-300">{data?.machine_type || "GENERIC_X64"}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-3">
          <div className={`flex items-center gap-3 px-6 py-2 rounded-full border-2 transition-all duration-500 ${
            isOnline && !error
              ? 'bg-green-500/5 border-green-500/20 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
              : 'bg-red-500/5 border-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
          }`}>
            <motion.div 
              animate={isOnline ? { scale: [1, 1.2, 1], opacity: [1, 0.6, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} 
            />
            <span className="text-xs font-black uppercase tracking-[0.2em]">
              {isOnline ? 'Telemetry Active' : 'Node Offline'}
            </span>
          </div>
          <p className="text-[9px] text-gray-600 font-mono mr-2 uppercase tracking-tighter">
            Polling Frequency: 5.0s // Status: {error ? "Err_Reconnecting" : "Stable"}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CENTER COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          <div className="relative overflow-hidden bg-gray-900/40 border border-gray-800 rounded-[2rem] p-6 md:p-8 group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Cpu size={120} />
            </div>
            
            <div className="flex items-center gap-3 mb-8">
              <div className="h-8 w-1 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
              <h3 className="text-white font-black text-sm uppercase tracking-[0.2em]">Core Architecture</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
              <InfoRow label="Processor" value={data?.cpu_model} icon={Cpu} />
              <InfoRow label="Logic Threads" value={data?.cpu_threads} icon={Zap} />
              <InfoRow label="Physical Cores" value={data?.cpu_cores} icon={LayoutGrid} />
              <InfoRow label="Machine Type" value={data?.machine_type} icon={Server} />
              {/* Added MAC Address here as requested */}
              <InfoRow label="Physical MAC" value={data?.mac} icon={Hash} />
            </div>

            {/* STORAGE METER */}
            <div className="mt-10 p-6 bg-black/40 rounded-3xl border border-gray-800/50 relative overflow-hidden">
                <div className="flex justify-between items-end mb-4">
                    <div className="flex items-center gap-2">
                      <HardDrive size={16} className="text-cyan-400" />
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Disk Intelligence</span>
                    </div>
                    <span className="text-2xl font-mono font-black text-cyan-400">
                      {typeof data?.disk === 'number' ? data.disk.toFixed(1) : "0.0"}%
                    </span>
                </div>
                <div className="w-full bg-gray-900 h-3 rounded-full overflow-hidden border border-gray-800">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${data?.disk || 0}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full relative" 
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[pulse_2s_linear_infinite]" />
                    </motion.div>
                </div>
                <div className="flex justify-between mt-3 text-[9px] font-mono text-gray-600 uppercase tracking-tighter">
                  <span>Sect_0</span>
                  <span>Optimization: Active</span>
                  <span>Sect_End</span>
                </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR COLUMN */}
        <div className="space-y-8">
          <div className="bg-gradient-to-b from-purple-500/5 to-transparent border border-gray-800 rounded-[2rem] p-8 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-8 w-1 bg-purple-500 rounded-full" />
              <h3 className="text-white font-black text-sm uppercase tracking-[0.2em]">Network Identity</h3>
            </div>

            <div className="space-y-2">
              <InfoRow label="Internal Address" value={data?.internal_ip} icon={Radio} />
              <InfoRow label="Public Gateway" value={data?.public_ip} icon={Globe} />
              <InfoRow label="Session Time" value={data?.uptime_human} icon={Activity} />
              <InfoRow label="Last Pulse" value={formatPulse(data?.last_alive)} icon={Zap} />
            </div>

            <div className="mt-8 relative group">
              <div className="absolute inset-0 bg-green-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative flex items-center gap-4 text-[10px] text-green-400 font-bold bg-green-500/5 p-4 rounded-2xl border border-green-500/20">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="tracking-[0.1em] uppercase">G-RPC Shield</p>
                    <p className="text-green-500/40 font-mono font-normal">AES-256-GCM_ACTIVE</p>
                  </div>
              </div>
            </div>
          </div>
          
          {/* HEALTH WIDGET */}
          <div className="p-6 bg-gray-900/20 border border-gray-800/40 rounded-[2rem] flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Neural Health</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  animate={isOnline ? { height: [8, 16, 8] } : { height: 4 }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                  className={`w-1 rounded-full ${isOnline ? 'bg-cyan-500/40' : 'bg-gray-800'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClientDetails;