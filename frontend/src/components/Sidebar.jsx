import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom"; 
import { motion } from "framer-motion";
import eyeLogo from "../assets/eye.png";
import {
  Users, AlertTriangle, Settings, Activity, Info,
  Terminal, GitBranch, FolderOpen, ChevronLeft, Command, OctagonAlert,
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
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 h-screen w-24 hover:w-64 group transition-all duration-500 ease-in-out bg-[#020617] border-r border-cyan-500/10 flex flex-col z-50 overflow-hidden font-inter"
    >
      {/* GLOW OVERLAY */}
      <div className="absolute top-0 -left-20 w-40 h-full bg-cyan-500/5 blur-[100px] pointer-events-none" />

      {/* LOGO SECTION */}
      <div className="flex flex-col items-center py-8 border-b border-white/5">
        <div className="relative">
          <img src={eyeLogo} alt="AURORA" className="w-12 h-12 object-contain filter drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
          <div className="absolute -inset-2 bg-cyan-500/10 blur-lg rounded-full animate-pulse" />
        </div>
        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
          <h1 className="font-roboto-condensed text-sm font-black tracking-[0.3em] text-white uppercase">A.U.R.O.R.A</h1>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-8 space-y-4 overflow-y-auto cyber-scroll font-roboto-condensed">
        
        {/* TACTICAL RETURN / EXIT MODULE */}
        <button
          onClick={() => hostname ? navigate('/clients') : navigate(-1)}
          className="group relative flex items-center justify-center group-hover:justify-start gap-4 w-full p-4 mb-8 rounded-2xl bg-white text-[#020617] hover:bg-cyan-400 transition-all duration-300 shadow-[0_10px_20px_rgba(0,0,0,0.4)] shrink-0 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <ChevronLeft className="w-6 h-6 shrink-0 group-hover:-translate-x-1 transition-transform" />
          <span className="hidden group-hover:block text-xs font-black tracking-tighter uppercase whitespace-nowrap">
            {hostname ? "Exit_Node" : "Return_Step"}
          </span>
        </button>

        {activeNavItems.map(({ path, icon: Icon, label, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) => `
              relative flex items-center justify-center group-hover:justify-start gap-4 p-4 rounded-2xl transition-all duration-300
              ${isActive 
                ? "bg-white text-[#020617] shadow-[0_10px_20px_rgba(255,255,255,0.2)]" 
                : "text-gray-500 hover:text-cyan-400 hover:bg-white/5"
              }
            `}
          >
            <Icon className="w-6 h-6 shrink-0 transition-transform duration-300 group-active:scale-90" />
            <span className="hidden group-hover:block text-xs font-black uppercase tracking-widest whitespace-nowrap">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* FOOTER STATUS */}
      <div className="p-4 mb-4">
        <div className="flex flex-col items-center group-hover:items-start p-3 rounded-2xl bg-white/5 border border-white/5 transition-all">
          <div className="flex items-center gap-2 font-roboto-condensed">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
            <span className="hidden group-hover:block text-[10px] font-black uppercase text-green-500 tracking-tighter">System_Active</span>
          </div>
          <div className="hidden group-hover:block mt-2">
            <p className="font-jetbrains text-[8px] text-gray-500 truncate w-40 uppercase">
              {hostname ? `Target: ${hostname}` : "Secure_Registry_Linked"}
            </p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;