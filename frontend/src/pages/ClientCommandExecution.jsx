import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, Send, Activity, Clock, Cpu, XOctagon, 
  FileText, Globe, Server, Hash, GitBranch, Search, Info, ChevronRight, Zap
} from "lucide-react";
import Topbar from "../components/Topbar";

const API_BASE = "http://172.24.16.81:8001/client";

const ClientCommandExecution = ({ setLoading, setError }) => {
  const { hostname } = useParams();
  const terminalEndRef = useRef(null);
  const isFirstRender = useRef(true);
  
  const [commands, setCommands] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [activeOutput, setActiveOutput] = useState({ 
    id: null, 
    action: null, 
    content: "AURORA_OS v4.0 - Secure Command Interface\nEstablishing encrypted gRPC tunnel...\nReady for instruction." 
  });

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (activeOutput.id || activeOutput.action) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeOutput.content]);

  const pollCommandResult = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE}/command-result/${id}`);
      if (res.ok) {
        const resultData = await res.json();
        if (Array.isArray(resultData) && resultData.length > 0) {
          const latest = resultData[0];
          if (latest.output?.trim()) {
            setActiveOutput({ id, action, content: latest.output });
            return true; 
          }
        }
      }
    } catch (err) { console.error("Poll Error:", err); }
    return false;
  };

  const fetchData = async () => {
    try {
      const [statRes, cmdRes] = await Promise.all([
        fetch(`${API_BASE}/status/${hostname}`),
        fetch(`${API_BASE}/commands/${hostname}`)
      ]);
      if (statRes.ok) setIsOnline((await statRes.json()).online);
      if (cmdRes.ok) setCommands(await cmdRes.json());
    } catch (err) { console.error("Fetch Error:", err); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
        fetchData();
        if (activeOutput.id && activeOutput.content.includes("Awaiting")) {
            pollCommandResult(activeOutput.id, activeOutput.action);
        }
    }, 3000);
    return () => clearInterval(interval);
  }, [hostname, activeOutput.id, activeOutput.content]);

  const handleCommand = async (action) => {
    let args = {};
    if (action === 'kill_process') {
      const pid = prompt("Enter PID to terminate:");
      if (!pid) return;
      args = { pid: parseInt(pid) };
    } else if (action === 'read_file') {
      const path = prompt("Enter full file path:", "/etc/hostname");
      if (!path) return;
      args = { path };
    }

    try {
        const res = await fetch(`${API_BASE}/command/${hostname}/${action}`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.detail || "Command failed");

        setActiveOutput({ 
          id: result.command_id, 
          action, 
          content: `> EXECUTING: ${action.toUpperCase()}\n> SEQUENCE_ID: ${result.command_id}\n> STATUS: Awaiting response from gRPC agent...` 
        });
      } catch (err) { alert(`Error: ${err.message}`); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-inter">
      <Topbar name={`Console: ${hostname}`} desc="Direct_System_Control_Interface" />

      <main className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-6 h-[calc(100vh-20px)] lg:h-screen">
        
        {/* Status Indicator: Roboto Condensed */}
        <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className={`w-3 h-3 rounded-full animate-pulse ${isOnline ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
             <span className="font-roboto-condensed text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">
               {isOnline ? 'Uplink_Established' : 'Uplink_Terminated'}
             </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
             <Terminal size={12} className="text-cyan-400" />
             <span className="font-jetbrains text-[9px] text-gray-500 uppercase tracking-tighter">gRPC_Channel_v4</span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          {/* 1. Terminal Area */}
          <div className="lg:col-span-8 bg-black rounded-[2.5rem] border border-white/10 flex flex-col overflow-hidden shadow-2xl relative">
              {/* Terminal Header: Roboto Condensed */}
              <div className="px-6 py-4 border-b border-white/5 bg-[#0a0c14] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Zap size={14} className="text-cyan-400 animate-pulse" />
                    <span className="font-roboto-condensed text-[10px] font-black text-gray-400 uppercase tracking-widest">Secure_Stream</span>
                  </div>
                  <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-500/20 border border-cyan-500/40" />
                  </div>
              </div>

              {/* Console Output: JetBrains Mono */}
              <div className="flex-1 p-6 font-jetbrains text-xs md:text-sm overflow-y-auto cyber-scroll bg-[#02040a]">
                  <div className="text-cyan-500 mb-4 font-bold flex items-center gap-2">
                    <ChevronRight size={14} />
                    aura@{hostname}:~# <span className="text-white">{activeOutput.action || 'sys_check'}</span>
                  </div>
                  <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                    {activeOutput.content}
                  </pre>
                  <motion.div 
                    animate={{ opacity: [1, 0] }} 
                    transition={{ repeat: Infinity, duration: 0.8 }} 
                    className="inline-block w-2 h-4 bg-cyan-500 ml-1 mt-4" 
                  />
                  <div ref={terminalEndRef} />
              </div>
          </div>

          {/* 2. Action Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
              <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 flex flex-col min-h-0 backdrop-blur-md shadow-xl">
                  {/* Labels: Roboto Condensed */}
                  <h3 className="font-roboto-condensed text-[10px] font-black text-gray-500 uppercase mb-6 tracking-[0.3em] border-b border-white/5 pb-3">Execution_Suite</h3>
                  
                  <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1 cyber-scroll">
                      <TacticalButton label="Ping" icon={<Activity size={16}/>} onClick={() => handleCommand('ping')} active={isOnline} />
                      <TacticalButton label="Uptime" icon={<Clock size={16}/>} onClick={() => handleCommand('uptime')} active={isOnline} />
                      <TacticalButton label="Processes" icon={<Hash size={16}/>} onClick={() => handleCommand('list_processes')} active={isOnline} />
                      <TacticalButton label="Top_Load" icon={<Cpu size={16}/>} onClick={() => handleCommand('top_processes')} active={isOnline} />
                      <TacticalButton label="Kill_PID" icon={<XOctagon size={16}/>} onClick={() => handleCommand('kill_process')} active={isOnline} color="text-red-500" border="border-red-500/20" />
                      {/* <TacticalButton label="Open_Ports" icon={<Globe size={16}/>} onClick={() => handleCommand('open_ports')} active={isOnline} /> */}
                  </div>
              </div>

              {/* Status Readout Panel: JetBrains Mono for Technical Info */}
              <div className="hidden lg:flex bg-cyan-500/5 border border-cyan-500/10 rounded-[2rem] p-6 flex-col justify-center gap-2">
                 <p className="font-roboto-condensed text-[8px] font-black text-cyan-500/60 uppercase tracking-widest">Protocol_Handshake</p>
                 <p className="font-jetbrains text-[10px] text-cyan-400">Link encrypted with AES-256-GCM. gRPC agent responding on port 50051.</p>
              </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Tactical Button Component: Roboto Condensed for Action Labels
const TacticalButton = ({ label, onClick, active, icon, color = "text-gray-200", border = "border-white/10" }) => (
    <button 
        disabled={!active} 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-white/[0.03] border ${border} hover:border-cyan-500/50 hover:bg-cyan-500/10 disabled:opacity-10 transition-all group shadow-inner`}
    >
        <span className="text-cyan-400 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_#06b6d4] transition-all">{icon}</span>
        <span className={`font-roboto-condensed text-[9px] font-black uppercase tracking-widest ${color} group-hover:text-white transition-colors`}>{label}</span>
    </button>
);

export default ClientCommandExecution;