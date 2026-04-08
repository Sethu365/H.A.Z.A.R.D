import React, { useEffect, useState, useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom"; // Added useOutletContext
import { motion } from "framer-motion";
import { 
  Server, Globe, Activity, Cpu, 
  ShieldCheck, Zap, HardDrive, Radio, Hash,
  Network
} from "lucide-react";

const API_BASE = "http://172.24.16.81:8001/client";

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="group flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all px-2 rounded-xl">
    <div className="flex items-center gap-3 min-w-0">
      <div className="p-2 bg-white/5 rounded-lg border border-white/5 group-hover:border-cyan-500/20 group-hover:bg-cyan-500/5 transition-all">
        {Icon && <Icon size={14} className="text-gray-500 group-hover:text-cyan-400 transition-colors" />}
      </div>
      <span className="text-gray-400 text-[9px] font-black uppercase tracking-[0.2em] font-roboto-condensed">{label}</span>
    </div>
    <span className="text-white font-jetbrains text-sm font-bold tracking-tight truncate ml-4">
      {value || "N/A"}
    </span>
  </div>
);

const ClientDetails = ({ setLoading, setError }) => {
  const { hostname } = useParams();
  
  // 1. Neural Link: Safe Context Access from DashboardLayout
  const context = useOutletContext();
  const setHeaderData = context?.setHeaderData;

  const [data, setData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  // 2. Update Topbar Identity via Layout Context
  useEffect(() => {
    if (setHeaderData) {
      setHeaderData({
        name: `Node: ${hostname}`,
        desc: "Individual_Node_Diagnostics // Real-time Telemetry"
      });
    }
  }, [hostname, setHeaderData]);

  const fetchHostData = useCallback(async (isInitial = false) => {
    if (isInitial) {
        setLoading?.(true); // Optional chaining for safety
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
      setLocalLoading(false);
    } catch (err) {
      console.error("Telemetry Link Failure:", err);
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
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      });
    } catch (e) { return "INVALID_TS"; }
  };

  if (localLoading && !data) return null; // Let the global loader handle initial state

  return (
    // 3. Removed outer wrapper styles (bg, min-h, main) as they are handled by Layout
    <div className="space-y-8 relative selection:bg-cyan-500/30">
      
      {/* HEADER STATUS STRIP */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-6">
          <div className={`p-5 rounded-2xl border-2 transition-all duration-700 ${isOnline ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-red-500/10 border-red-500/30'}`}>
              <motion.div animate={isOnline ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }}>
                  <Radio size={28} className={isOnline ? 'text-green-400' : 'text-red-500'} />
              </motion.div>
          </div>
          <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase leading-none font-inter">{hostname}</h2>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mt-2 font-roboto-condensed">
                  {isOnline ? 'Encrypted_Uplink_Stable' : 'Uplink_Interrupted'}
              </p>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 text-[9px] font-jetbrains text-gray-500 uppercase tracking-widest">
           <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <Hash size={10} /> ID: {data?.sensor_id?.slice(0, 14) || "UNKNOWN"}
           </span>
           <span className="font-roboto-condensed">Poll_Rate: 5.0s // <span className="font-jetbrains">Proto: gRPC_v4</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CORE ARCHITECTURE */}
        <div className="lg:col-span-8 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl backdrop-blur-md"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Cpu size={180} />
            </div>
            
            <div className="flex items-center gap-4 mb-10">
              <div className="h-10 w-1.5 bg-cyan-500 rounded-full shadow-[0_0_15px_#06b6d4]" />
              <h3 className="text-white font-black text-sm uppercase tracking-[0.3em] font-roboto-condensed">Processor_Matrix</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
              <InfoRow label="Architecture" value={data?.cpu_model} icon={Cpu} />
              <InfoRow label="Logic Threads" value={data?.cpu_threads} icon={Zap} />
              <InfoRow label="Machine Core" value={data?.machine_type} icon={Server} />
              <InfoRow label="Physical MAC" value={data?.mac} icon={Network} />
            </div>

            {/* STORAGE METER */}
            <div className="mt-12 p-8 bg-black/40 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                <div className="flex justify-between items-end mb-5">
                    <div className="flex items-center gap-3">
                      <HardDrive size={18} className="text-cyan-400" />
                      <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] font-roboto-condensed">Disk_Volume_Analysis</span>
                    </div>
                    <span className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] font-jetbrains">
                      {typeof data?.disk === 'number' ? data.disk.toFixed(1) : "0.0"}%
                    </span>
                </div>
                <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden border border-white/5 p-1">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${data?.disk || 0}%` }}
                        transition={{ duration: 2, ease: "circOut" }}
                        className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full relative" 
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px:20px] animate-[pulse_3s_linear_infinite]" />
                    </motion.div>
                </div>
                <div className="flex justify-between mt-4 text-[8px] font-black text-gray-600 uppercase tracking-[0.3em] font-roboto-condensed">
                  <span>Sector_Head</span>
                  <span className="text-cyan-500/40">Optimizing_Data_Mesh</span>
                  <span>Sector_Tail</span>
                </div>
            </div>
          </motion.div>
        </div>

        {/* NETWORK & IDENTITY */}
        <div className="lg:col-span-4 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-b from-purple-500/10 to-transparent border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden backdrop-blur-md shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-10 w-1.5 bg-purple-500 rounded-full shadow-[0_0_15px_#a855f7]" />
              <h3 className="text-white font-black text-sm uppercase tracking-[0.3em] font-roboto-condensed">Identity_Vault</h3>
            </div>

            <div className="space-y-2">
              <InfoRow label="Internal_IP" value={data?.internal_ip} icon={Radio} />
              <InfoRow label="Public_Node" value={data?.public_ip} icon={Globe} />
              <InfoRow label="Sync_Time" value={data?.uptime_human} icon={Activity} />
              <InfoRow label="Last_Pulse" value={formatPulse(data?.last_alive)} icon={Zap} />
            </div>

            <div className="mt-10 p-5 rounded-2xl bg-green-500/5 border border-green-500/20 flex items-center gap-4 group">
                <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-all">
                  <ShieldCheck size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-green-400 font-roboto-condensed">Shield_Active</p>
                  <p className="text-[8px] font-jetbrains text-green-500/40 uppercase">AES-256-GCM_ENCRYPTED</p>
                </div>
            </div>
          </motion.div>
          
          {/* NEURAL HEALTH WIDGET */}
          <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-between shadow-xl backdrop-blur-md">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 font-roboto-condensed">Neural_Link</span>
            <div className="flex items-end gap-1.5 h-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                  key={i}
                  animate={isOnline ? { height: [4, 24, 4] } : { height: 2 }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
                  className={`w-1 rounded-full ${isOnline ? 'bg-cyan-400/60 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'bg-gray-800'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;