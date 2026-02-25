import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Terminal, Send, Activity, Clock, Cpu, XOctagon, 
  FileText, Globe, Server, Hash, GitBranch, Search, Info 
} from "lucide-react";

const API_BASE = "http://172.24.16.81:8001/client";

const ClientCommandExecution = () => {
  const { hostname } = useParams();
  const terminalEndRef = useRef(null);
  const isFirstRender = useRef(true); // Ref to prevent initial scroll jump
  
  const [commands, setCommands] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [activeOutput, setActiveOutput] = useState({ 
    id: null, 
    action: null, 
    content: "AURORA v4.0 - Secure Terminal\nInitialising protocol suite...\nType or select a command to begin execution." 
  });

  // Auto-scroll logic with "jump" prevention
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // Skip scrolling on initial component mount
    }

    // Only auto-scroll if we are actively executing a command
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
    } else if (action === 'list_files') {
      const path = prompt("Enter directory path:", "/");
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
    <div className="flex flex-col h-screen p-6 gap-6 bg-[#020617]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Terminal className="text-cyan-500" />
            <h2 className="text-xl font-black text-white italic uppercase tracking-widest">Command Console: {hostname}</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 border border-gray-800 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{isOnline ? 'Session Active' : 'Session Terminated'}</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Terminal Area */}
        <div className="col-span-12 lg:col-span-8 bg-black rounded-3xl border border-gray-800 flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">A.U.R.O.R.A Secure Stream</span>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
                </div>
            </div>
            <div className="flex-1 p-6 font-mono text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
                <div className="text-cyan-500 mb-2 font-bold italic">aura@{hostname}:~# <span className="text-white not-italic">{activeOutput.action || 'system-check'}</span></div>
                <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">{activeOutput.content}</pre>
                <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 h-4 bg-cyan-500 ml-1 mt-2" />
                <div ref={terminalEndRef} />
            </div>
        </div>

        {/* Action Sidebar */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-hidden">
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-5 flex flex-col min-h-0 shadow-xl">
                <p className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-[0.2em]">Execution Suite</p>
                
                <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-800">
                    <SmallActionButton label="Ping" icon={<Activity size={14}/>} onClick={() => handleCommand('ping')} active={isOnline} />
                    <SmallActionButton label="Uptime" icon={<Clock size={14}/>} onClick={() => handleCommand('uptime')} active={isOnline} />
                    <SmallActionButton label="Processes" icon={<Hash size={14}/>} onClick={() => handleCommand('list_processes')} active={isOnline} />
                    <SmallActionButton label="Top Procs" icon={<Cpu size={14}/>} onClick={() => handleCommand('top_processes')} active={isOnline} />
                    <SmallActionButton label="Kill PID" icon={<XOctagon size={14}/>} onClick={() => handleCommand('kill_process')} active={isOnline} color="text-red-400" />
                    {/* <SmallActionButton label="Read File" icon={<FileText size={14}/>} onClick={() => handleCommand('read_file')} active={isOnline} />
                    <SmallActionButton label="List Files" icon={<Search size={14}/>} onClick={() => handleCommand('list_files')} active={isOnline} /> */}
                    <SmallActionButton label="Ports" icon={<Globe size={14}/>} onClick={() => handleCommand('open_ports')} active={isOnline} />
                    <SmallActionButton label="Agent Info" icon={<Info size={14}/>} onClick={() => handleCommand('agent_info')} active={isOnline} />
                    <SmallActionButton label="Tree" icon={<GitBranch size={14}/>} onClick={() => handleCommand('process_tree')} active={isOnline} />
                </div>
            </div>

            {/* History Section - Re-enabled and styled for high-density info */}
            {/* <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-5 flex-1 flex flex-col min-h-0">
                <p className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-[0.2em]">Sequence History</p>
                <div className="space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-800">
                    {commands.length === 0 && <p className="text-[10px] text-gray-600 italic">No historical data...</p>}
                    {commands.slice(0, 15).map(cmd => (
                        <button 
                            key={cmd.id} 
                            onClick={() => {
                                setActiveOutput({ id: cmd.id, action: cmd.action, content: "Reloading buffer..." });
                                pollCommandResult(cmd.id, cmd.action);
                            }} 
                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group
                                ${activeOutput.id === cmd.id ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-black/40 border-gray-800 hover:border-gray-600'}`}
                        >
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-300 uppercase group-hover:text-cyan-400">{cmd.action}</span>
                                <span className="text-[8px] text-gray-600 font-mono">{cmd.id.split('-')[0]}</span>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border 
                                ${cmd.status === 'completed' ? 'text-green-500 border-green-500/30' : 'text-yellow-500 border-yellow-500/30'}`}>
                                {cmd.status}
                            </span>
                        </button>
                    ))}
                </div>
            </div> */}
        </div>
      </div>
    </div>
  );
};

const SmallActionButton = ({ label, onClick, active, icon, color = "text-gray-300" }) => (
    <button 
        disabled={!active} 
        onClick={onClick} 
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-800/30 border border-gray-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 disabled:opacity-20 transition-all group"
    >
        <span className="text-cyan-500 group-hover:scale-110 transition-transform">{icon}</span>
        <span className={`text-[10px] font-bold uppercase tracking-tighter ${color} group-hover:text-white`}>{label}</span>
    </button>
);

export default ClientCommandExecution;