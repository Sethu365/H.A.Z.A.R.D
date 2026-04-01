import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom"; 
import { motion } from "framer-motion";
import eyeLogo from "../assets/eye.png";
import {
  Users, AlertTriangle, Settings, Activity, Info,
  Terminal, GitBranch, FolderOpen, ChevronLeft, Command, OctagonAlert,
  Cpu, ShieldCheck, Zap
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate(); 
  const clientPathMatch = location.pathname.match(/^\/clients\/([^/]+)/);
  const hostname = clientPathMatch ? clientPathMatch[1] : null;

  const mainNavItems = [
    { path: "/", icon: Activity, label: "Dashboard" },
    { path: "/clients", icon: Users, label: "Clients" },
    { path: "/anomalies", icon: AlertTriangle, label: "Anomalies" },
    { path: "/scraper", icon: Command, label: "Intel" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  const clientNavItems = hostname ? [
    { path: `/clients/${hostname}`, icon: Info, label: "Details", end: true },
    { path: `/clients/${hostname}/control`, icon: Terminal, label: "Console" },
    { path: `/clients/${hostname}/process-tree`, icon: GitBranch, label: "Tree" },
    { path: `/clients/${hostname}/file-explorer`, icon: FolderOpen, label: "Files" },
    { path: `/clients/${hostname}/client-anomaly`, icon: OctagonAlert, label: "Alerts" }
  ] : [];

  const activeNavItems = hostname ? clientNavItems : mainNavItems;

  return (
    <motion.aside
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 h-screen w-20 hover:w-64 group transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] bg-[#020617] border-r border-white/5 flex flex-col z-[100] overflow-hidden"
    >
      {/* VERTICAL ACCENT LINE */}
      <div className="absolute right-0 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />

      {/* LOGO SECTION - SKELETAL DESIGN */}
      <div className="flex flex-col items-center py-10 relative">
        <div 
          className="relative cursor-pointer group/logo"
          onClick={() => navigate('/')}
        >
          <img 
            src={eyeLogo} 
            alt="AURORA" 
            className="w-10 h-10 object-contain filter brightness-125 group-hover/logo:scale-110 transition-transform duration-500" 
          />
          <div className="absolute -inset-4 bg-cyan-500/5 blur-2xl rounded-full group-hover/logo:bg-cyan-500/20 transition-all" />
        </div>
        <div className="mt-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
          <h1 className="font-roboto-condensed text-[10px] font-black tracking-[0.8em] text-cyan-500 uppercase italic">
            AURORA
          </h1>
        </div>
      </div>

      {/* NAVIGATION - MODULAR BLOCKS */}
      <nav className="flex-1 px-3 py-6 space-y-2 cyber-scroll overflow-y-auto overflow-x-hidden">
        
        {/* RETURN / EXIT MODULE - HIGH CONTRAST */}
        <button
          onClick={() => hostname ? navigate('/clients') : navigate('/')}
          className="relative flex items-center w-full h-12 mb-10 rounded-xl overflow-hidden group/btn transition-all active:scale-95"
        >
          <div className="absolute inset-0 bg-white group-hover/btn:bg-cyan-400 transition-colors" />
          <div className="relative flex items-center justify-center group-hover:justify-start gap-4 w-full px-4 text-[#020617]">
            <ChevronLeft className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden group-hover:block font-roboto-condensed text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              {hostname ? "UPLINK_EXIT" : "SYSTEM_HOME"}
            </span>
          </div>
        </button>

        <div className="space-y-1">
          {activeNavItems.map(({ path, icon: Icon, label, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) => `
                relative flex items-center h-14 rounded-xl transition-all duration-300 group/link
                ${isActive 
                  ? "bg-white/5 border border-white/10" 
                  : "hover:bg-white/[0.02] border border-transparent"
                }
              `}
            >
              {/* ACTIVE INDICATOR LINE */}
              <NavLink 
                to={path} 
                className={({ isActive }) => `absolute left-0 w-1 h-6 rounded-r-full transition-all duration-500 ${isActive ? 'bg-cyan-500' : 'bg-transparent'}`} 
              />
              
              <div className="flex items-center justify-center group-hover:justify-start gap-5 w-full px-5">
                <Icon className={`w-5 h-5 shrink-0 transition-all duration-500 group-hover/link:text-cyan-400 ${location.pathname === path ? 'text-cyan-400' : 'text-gray-500'}`} />
                <span className={`hidden group-hover:block font-roboto-condensed text-[11px] font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-colors ${location.pathname === path ? 'text-white' : 'text-gray-500 group-hover/link:text-gray-300'}`}>
                  {label}
                </span>
              </div>

              {/* TACTICAL HOVER GLOW */}
              <div className="absolute inset-0 bg-cyan-500/0 group-hover/link:bg-cyan-500/[0.03] transition-colors pointer-events-none" />
            </NavLink>
          ))}
        </div>
      </nav>

      {/* FOOTER STATUS - SYSTEM TELEMETRY LOOK */}
      <div className="p-3 border-t border-white/5 bg-black/20">
        <div className="flex flex-col items-center group-hover:items-start p-3 rounded-xl border border-white/5 transition-all">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div className="absolute w-4 h-4 rounded-full border border-green-500/50 animate-ping" />
            </div>
            <span className="hidden group-hover:block font-roboto-condensed text-[9px] font-black uppercase text-green-500 tracking-[0.2em]">
              Link_Established
            </span>
          </div>
          
          <div className="hidden group-hover:block mt-4 space-y-2 w-full">
            <div className="flex items-center justify-between text-[8px] font-jetbrains text-gray-600 uppercase">
              <span>Node_ID</span>
              <span className="text-gray-400">{hostname ? hostname.slice(0, 8) : "ROOT"}</span>
            </div>
            <div className="h-[1px] w-full bg-white/5" />
            <div className="flex items-center justify-between text-[8px] font-jetbrains text-gray-600 uppercase">
              <span>Latency</span>
              <span className="text-cyan-500">12ms</span>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;