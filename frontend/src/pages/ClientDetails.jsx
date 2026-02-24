import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Server, Globe, Clock, Terminal, Activity, Send, 
  Loader2, ChevronLeft, Hash, FileText, XOctagon, Cpu
} from "lucide-react";

const API_BASE = "http://172.24.16.81:8001/client";

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm py-1.5 border-b border-gray-800/50 last:border-0">
    <span className="text-gray-400 font-medium">{label}</span>
    <span className="text-gray-200 font-mono text-right max-w-[60%] truncate">{value}</span>
  </div>
);

const ClientDetails = () => {
  const { hostname } = useParams();
  const navigate = useNavigate();
  const terminalEndRef = useRef(null);

  const [data, setData] = useState(null);
  const [commands, setCommands] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [activeOutput, setActiveOutput] = useState({ 
    id: null, 
    action: null, 
    content: "Ready. Select a command to begin..." 
  });

  // Auto-scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeOutput.content]);

  // Robust Polling Logic
  const pollCommandResult = async (id, action) => {
    if (!id) return false;
    try {
      const res = await fetch(`${API_BASE}/command-result/${id}`);
      if (res.ok) {
        const resultData = await res.json();
        // Backend returns a list; check for first entry's output
        if (Array.isArray(resultData) && resultData.length > 0) {
          const latest = resultData[0];
          if (latest.output && latest.output.trim() !== "") {
            setActiveOutput({ id, action, content: latest.output });
            return true; 
          }
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
    return false;
  };

  const fetchHostData = async () => {
    try {
      const [sysRes, statRes, cmdRes] = await Promise.all([
        fetch(`${API_BASE}/system-info/${hostname}`),
        fetch(`${API_BASE}/status/${hostname}`),
        fetch(`${API_BASE}/commands/${hostname}`)
      ]);
      
      if (sysRes.ok) setData(await sysRes.json());
      if (statRes.ok) setIsOnline((await statRes.json()).online);
      if (cmdRes.ok) setCommands(await cmdRes.json());
    } catch (err) {
      console.error("Polling error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostData();
    const mainInterval = setInterval(fetchHostData, 3000);

    let termInterval;
    // Keep polling if we are in the "Awaiting response" state
    if (activeOutput.id && activeOutput.content.includes("Awaiting response")) {
      termInterval = setInterval(async () => {
        const received = await pollCommandResult(activeOutput.id, activeOutput.action);
        if (received) clearInterval(termInterval);
      }, 1500);
    }

    return () => {
      clearInterval(mainInterval);
      if (termInterval) clearInterval(termInterval);
    };
  }, [hostname, activeOutput.id, activeOutput.content]);

  const handleCommand = async (action, args = {}) => {
    let finalArgs = args;
    
    // Handle commands requiring user input
    if (action === 'kill_process') {
      const pid = prompt("Enter PID to terminate:");
      if (!pid) return;
      finalArgs = { pid: parseInt(pid) };
    } else if (action === 'read_file') {
      const path = prompt("Enter full file path:", "/etc/hostname");
      if (!path) return;
      finalArgs = { path };
    } else if (action === 'list_files') {
      const path = prompt("Enter directory path:", "/");
      if (!path) return;
      finalArgs = { path };
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/command/${hostname}/${action}`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalArgs)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || "Command failed");
      
      setActiveOutput({ 
        id: result.command_id, 
        action, 
        content: `> ${action.toUpperCase()} requested...\n> ID: ${result.command_id}\n> Awaiting response from gRPC agent...` 
      });
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-black">
      <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
      <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">Establishing Secure Link...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 pt-8">
      {/* Header */}
      <div className="flex flex-row md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-800 rounded-xl transition-all border border-gray-700 text-gray-400">
            <ChevronLeft />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tighter">{data?.hostname}</h1>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {isOnline ? 'Active' : 'Offline'}
            </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 shadow-inner">
              <div className="flex items-center gap-2 mb-4 text-cyan-500 font-bold text-xs uppercase">
                <Server size={14} /> System Details
              </div>
              <div className="space-y-1">
                <InfoRow label="CPU Model" value={data?.cpu_model} />
                <InfoRow label="Cores / Threads" value={`${data?.cpu_cores} / ${data?.cpu_threads}`} />
                <InfoRow label="Machine Type" value={data?.machine_type} />
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-gray-500 uppercase mb-2">
                    <span>Disk Space Usage</span>
                    <span>{data?.disk?.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-800 h-full" style={{ width: `${data?.disk}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 shadow-inner">
              <div className="flex items-center gap-2 mb-4 text-purple-400 font-bold text-xs uppercase">
                <Globe size={14} /> Network
              </div>
              <div className="space-y-1">
                <InfoRow label="Internal IP" value={data?.internal_ip} />
                <InfoRow label="Public IP" value={data?.public_ip} />
                <InfoRow label="Uptime" value={data?.uptime_human} />
                <InfoRow label="Last Seen" value={data?.last_alive ? new Date(data.last_alive).toLocaleTimeString() : 'N/A'} />
              </div>
            </div>
          </div>

          {/* TERMINAL DISPLAY */}
          <div className="bg-black border border-gray-800 rounded-3xl overflow-hidden shadow-2xl h-[550px] flex flex-col">
            <div className="bg-gray-900/90 px-5 py-3 border-b border-gray-800 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <Terminal size={14} className="text-cyan-500" />
                 <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Aura Console</span>
               </div>
               <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
               </div>
            </div>
            
            <div className="flex-1 p-6 font-mono text-sm overflow-y-auto bg-[#020202] scrollbar-thin scrollbar-thumb-gray-800">
               <div className="flex items-center gap-2 mb-3 text-gray-600">
                 <span className="text-green-500">aura@{hostname}:~#</span>
                 <span className="text-gray-400">{activeOutput.action || 'system-init'}</span>
               </div>
               {/* whitespace-pre-wrap is critical for formatting commands like top_processes */}
               <pre className="text-cyan-50/90 whitespace-pre-wrap font-mono leading-relaxed">
                 {activeOutput.content}
               </pre>
               <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 h-4 bg-cyan-500 ml-1" />
               <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* COMMAND SIDEBAR */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-gray-200 font-black text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Send size={16} className="text-cyan-500" /> Execution Suite
            </h3>
            
            <div className="grid grid-cols-1 gap-2">
              <ActionButton label="Ping" icon={<Activity size={14}/>} onClick={() => handleCommand('ping')} active={isOnline} />
              <ActionButton label="Uptime" icon={<Clock size={14}/>} onClick={() => handleCommand('uptime')} active={isOnline} />
              {/* <ActionButton label="Process List" icon={<Hash size={14}/>} onClick={() => handleCommand('list_processes')} active={isOnline} /> */}
              <ActionButton label="Top Processes" icon={<Cpu size={14}/>} onClick={() => handleCommand('top_processes')} active={isOnline} />
              <ActionButton label="Kill Process" icon={<XOctagon size={14}/>} onClick={() => handleCommand('kill_process')} active={isOnline} color="text-red-400" />
              <ActionButton label="List Files" icon={<FileText size={14}/>} onClick={() => handleCommand('list_files')} active={isOnline} />
              <ActionButton label="Read File" icon={<Terminal size={14}/>} onClick={() => handleCommand('read_file')} active={isOnline} />
              <ActionButton label="Open Ports" icon={<Globe size={14}/>} onClick={() => handleCommand('open_ports')} active={isOnline} />
              <ActionButton label="Agent Info" icon={<Server size={14}/>} onClick={() => handleCommand('agent_info')} active={isOnline} />
            </div>

            <div className="mt-8">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Command History</p>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-2 scrollbar-none">
                {commands.slice(0, 8).map((cmd) => (
                  <button 
                    key={cmd.id}
                    onClick={() => {
                      setActiveOutput({ id: cmd.id, action: cmd.action, content: "Reloading output..." });
                      pollCommandResult(cmd.id, cmd.action);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between ${activeOutput.id === cmd.id ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-black/20 border-gray-800 hover:border-gray-700'}`}
                  >
                    <span className="text-[10px] font-bold text-gray-300">{cmd.action}</span>
                    <span className={`text-[8px] font-bold uppercase ${cmd.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>{cmd.status}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ label, onClick, active, icon, color = "text-gray-300" }) => (
  <button 
    disabled={!active}
    onClick={onClick}
    className="group w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-800/20 border border-gray-800 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all disabled:opacity-20"
  >
    <div className="flex items-center gap-3">
        <span className="text-gray-500 group-hover:text-cyan-400 transition-colors">{icon}</span>
        <span className={`text-xs font-bold ${color} group-hover:text-white transition-colors`}>{label}</span>
    </div>
    <div className={`w-1 h-1 rounded-full ${active ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-gray-700'}`}></div>
  </button>
);

export default ClientDetails;