import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Server, Globe, Activity, Cpu, 
  ShieldCheck, Zap, HardDrive, Radio, Hash,
  Network, ArrowLeft
} from "lucide-react";

const API_BASE = "http://172.24.16.81:8001/client";

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="group flex items-center justify-between py-3 md:py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all px-2 rounded-xl">
    <div className="flex items-center gap-3 min-w-0">
      <div className="p-2 bg-white/5 rounded-lg border border-white/5 group-hover:border-cyan-500/20 group-hover:bg-cyan-500/5 transition-all shrink-0">
        {Icon && <Icon size={14} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />}
      </div>
      <span className="text-slate-500 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] font-roboto-condensed truncate">{label}</span>
    </div>
    <span className="text-white font-jetbrains text-[11px] md:text-sm font-bold tracking-tight truncate ml-4 text-right">
      {value || "N/A"}
    </span>
  </div>
);

const ClientDetails = ({ setLoading, setError }) => {
  const { hostname } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  const fetchHostData = useCallback(async (isInitial = false) => {
    if (isInitial) {
        setLoading?.(true);
        setError?.(null);
    }
    try {
      const [sysRes, statRes] = await Promise.all([
        fetch(`${API_BASE}/system-info/${hostname}`),
        fetch(`${API_BASE}/status/${hostname}`)
      ]);
      
      if (!sysRes.ok || !statRes.ok) throw new Error("Neural link disconnected");

      const sysData = await sysRes.json();
      const statData = await statRes.json();

      setData(sysData);
      setIsOnline(statData.online);
      if (isInitial) setLoading?.(false);
    } catch (err) {
      if (isInitial) {
        setLoading?.(false);
        setError?.(`Failed to establish uplink with node: ${hostname}`);
      }
    }
  }, [hostname, setLoading, setError]);

  useEffect(() => {
    fetchHostData(true);
    const interval = setInterval(() => fetchHostData(false), 5000);
    return () => clearInterval(interval);
  }, [fetchHostData]);

  const formatPulse = (timestamp) => {
    if (!timestamp) return "NEVER";
    try {
      const utcDate = new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z');
      return utcDate.toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
      });
    } catch (e) { return "INVALID_TS"; }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-inter p-3 md:p-6 pb-32">
      <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6 selection:bg-cyan-500/30">
        
        {/* HEADER: Removed bottom border line for cleaner look */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
          <div className="flex items-center justify-center md:justify-start gap-4 w-full md:w-auto">
            <button 
              onClick={() => navigate(-1)} 
              className="hidden md:flex p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2">
                {/* <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4] animate-pulse md:hidden" />
                <Server size={18} className="text-cyan-500 animate-pulse hidden md:block" /> */}
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase font-inter text-center md:text-left">
                   {hostname}
                </h1>
              </div>
              <p className="hidden md:block font-roboto-condensed text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">
                Diagnostic_Telemetry // neural_registry_v4
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md ${isOnline ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                <span className="font-roboto-condensed text-[10px] font-black uppercase tracking-widest text-slate-300">
                  {isOnline ? 'Uplink_Established' : 'Uplink_Interrupted'}
                </span>
             </div>
          </div>
        </header>

        {/* MAIN DATA GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          
          {/* CORE ARCHITECTURE */}
          <div className="lg:col-span-8 space-y-4 md:space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-white/[0.02] border border-white/10 rounded-[1.8rem] md:rounded-[2rem] p-5 md:p-8 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center gap-4 mb-6 md:mb-8 justify-center md:justify-start">
                <div className="h-4 md:h-6 w-1 bg-cyan-500 rounded-full shadow-[0_0_15px_#06b6d4] hidden md:block" />
                <h3 className="text-white font-black text-[10px] md:text-xs uppercase tracking-[0.3em] font-roboto-condensed">Processor_Matrix</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 gap-y-0.5">
                <InfoRow label="Architecture" value={data?.cpu_model} icon={Cpu} />
                <InfoRow label="Threads" value={data?.cpu_threads} icon={Zap} />
                <InfoRow label="Machine" value={data?.machine_type} icon={Server} />
                <InfoRow label="MAC" value={data?.mac} icon={Network} />
              </div>

              {/* STORAGE METER */}
              <div className="mt-6 md:mt-10 p-5 md:p-6 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden group">
                  <div className="flex justify-between items-end mb-3">
                      <div className="flex items-center gap-3">
                        <HardDrive size={14} className="text-cyan-400" />
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] font-roboto-condensed">Disk_Analysis</span>
                      </div>
                      <span className="text-lg md:text-2xl font-black text-white font-jetbrains">
                        {typeof data?.disk === 'number' ? data.disk.toFixed(1) : "0.0"}%
                      </span>
                  </div>
                  <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${data?.disk || 0}%` }}
                          transition={{ duration: 1.5, ease: "circOut" }}
                          className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full shadow-[0_0_10px_rgba(34,211,238,0.3)]" 
                      />
                  </div>
              </div>
            </motion.div>
          </div>

          {/* NETWORK & IDENTITY */}
          <div className="lg:col-span-4 space-y-4 md:space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.02] border border-white/10 rounded-[1.8rem] md:rounded-[2rem] p-5 md:p-6 relative overflow-hidden backdrop-blur-md shadow-xl"
            >
              <div className="flex items-center gap-4 mb-5 md:mb-6 justify-center md:justify-start">
                <div className="h-4 md:h-6 w-1 bg-purple-500 rounded-full shadow-[0_0_15px_#a855f7] hidden md:block" />
                <h3 className="text-white font-black text-[10px] md:text-xs uppercase tracking-[0.3em] font-roboto-condensed">Identity_Vault</h3>
              </div>

              <div className="space-y-0.5">
                <InfoRow label="Internal_IP" value={data?.internal_ip} icon={Radio} />
                <InfoRow label="Sync_Time" value={data?.uptime_human} icon={Activity} />
                <InfoRow label="Pulse" value={formatPulse(data?.last_alive)} icon={Zap} />
              </div>

              <div className="mt-6 p-4 rounded-xl bg-green-500/5 border border-green-500/10 flex items-center gap-3">
                  <ShieldCheck size={18} className="text-green-500" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.1em] text-green-500 font-roboto-condensed leading-none mb-1">Shield_Active</p>
                    <p className="text-[8px] font-jetbrains text-green-500/40 uppercase">AES-256-GCM_v4</p>
                  </div>
              </div>
            </motion.div>
            
            {/* NEURAL HEALTH WIDGET */}
            {/* <div className="p-5 md:p-6 bg-white/[0.01] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-between shadow-lg backdrop-blur-md">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 font-roboto-condensed">Neural_Link</span>
              <div className="flex items-end gap-1 h-5 px-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <motion.div
                    key={i}
                    animate={isOnline ? { height: [4, 20, 4] } : { height: 2 }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.1 }}
                    className={`w-1 rounded-full ${isOnline ? 'bg-cyan-500/50 shadow-[0_0_8px_rgba(34,211,238,0.3)]' : 'bg-slate-800'}`}
                  />
                ))}
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;