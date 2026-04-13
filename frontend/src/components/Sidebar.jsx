import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom"; 
import { motion } from "framer-motion";
import eyeLogo from "../assets/eye.png";
import {
  Users, AlertTriangle, Settings, Activity, Info, ChartScatter,
  Terminal, GitBranch, FolderOpen, ChevronLeft, Command, OctagonAlert
} from "lucide-react";
import { useState } from "react";
import SshTerminal from "../components/SshTerminal";
import { AnimatePresence } from "framer-motion";

const Sidebar = ({ onOpenTerminal }) => {
  const location = useLocation();
  const navigate = useNavigate();     
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const clientPathMatch = location.pathname.match(/^\/clients\/([^/]+)/);
  const hostname = clientPathMatch ? clientPathMatch[1] : null;

  const mainNavItems = [
    { path: "/", icon: Activity, label: "Dashboard" },    
    { path: "/clients", icon: Users, label: "Clients" },
    { path: "/anomalies", icon: AlertTriangle, label: "Anomalies" },
    { path: "/scraper", icon: Command, label: "Intel" },
    { path: "/cluster", icon: ChartScatter, label: "Cluster" },
    // { path: "/settings", icon: Settings, label: "Settings" },
  ];

  const clientNavItems = hostname ? [
    { path: `/clients/${hostname}`, icon: Info, label: "Details", end: true },
    { path: `/clients/${hostname}/control`, icon: Terminal, label: "Console" },
    { path: `/clients/${hostname}/process-tree`, icon: GitBranch, label: "Tree" },
    { path: `/clients/${hostname}/file-explorer`, icon: FolderOpen, label: "Files" },
      { path: `/clients/${hostname}/cluster`, icon: ChartScatter, label: "Cluster" },
    { path: `/clients/${hostname}/client-anomaly`, icon: OctagonAlert, label: "Alerts" }
  ] : [];

  const activeNavItems = hostname ? clientNavItems : mainNavItems;

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <motion.aside
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-[#020617] border-r border-white/5 flex-col z-[100] overflow-hidden"
      >
        <div className="absolute right-0 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
        
        <div className="flex flex-col items-center justify-center px-4 pt-7 pb-8 shrink-0">
          <button onClick={() => navigate('/')} className="group flex flex-col items-center">
            <div className="relative mb-3.5">
              <div className="absolute inset-0 rounded-full bg-cyan-900/30 blur-3xl scale-[1.7]" />
              <img
                src={eyeLogo}
                alt="AURORA"
                className="relative w-[4.5rem] h-[4.5rem] object-contain brightness-110 drop-shadow-[0_0_18px_rgba(34,211,238,0.6)] transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>

            <div className="text-center px-5">
              <h1 className="font-roboto-condensed font-extrabold text-[13px] uppercase tracking-[0.55em] leading-none text-[#00ffff] [text-shadow:0_0_8px_rgba(0,255,255,0.55),0_0_18px_rgba(0,255,255,0.28)]">
                AURORA
              </h1>
              <div className="mt-2 h-px w-full max-w-[92px] mx-auto bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent opacity-70" />
            </div>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto cyber-scroll">
          <button
            onClick={() => hostname ? navigate('/clients') : navigate('/')}
            className="relative flex items-center w-full h-12 mb-10 rounded-xl overflow-hidden bg-white text-[#020617] active:scale-95 transition-all shadow-lg"
          >
            <div className="relative flex items-center justify-start gap-4 w-full px-4">
              <ChevronLeft className="w-5 h-5" />
              <span className="font-roboto-condensed text-[10px] font-black uppercase tracking-widest leading-none">{hostname ? "UPLINK_EXIT" : "SYSTEM_HOME"}</span>
            </div>
          </button>

          {activeNavItems.map(({ path, icon: Icon, label, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) => `relative flex items-center h-14 rounded-xl transition-all duration-300 group leading-none ${isActive ? "bg-white/5 border border-white/10" : "hover:bg-white/[0.02] border border-transparent"}`}
            >
              {location.pathname === path && <div className="absolute left-0 w-1 h-6 bg-cyan-500 rounded-r-full shadow-[0_0_10px_#06b6d4]" />}
              <div className="flex items-center justify-start gap-5 w-full px-5">
                <Icon className={`w-5 h-5 transition-all duration-300 ${location.pathname === path ? 'text-cyan-400' : 'text-gray-500'}`} />
                <span className={`font-roboto-condensed text-[11px] font-bold uppercase tracking-[0.2em] transition-all leading-none ${location.pathname === path ? 'text-white' : 'text-gray-500'}`}>{label}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <button
            onClick={() => setIsTerminalOpen(true)}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group"
          >
            <Terminal size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="font-roboto-condensed text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/80">Secure_Console</span>
          </button>
        </div>
      </motion.aside>

      {/* --- MOBILE HYPER-GLASS BOTTOM BAR --- */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[92%] max-w-md">
        <nav className="
          bg-white/[0.03] backdrop-blur-[32px] saturate-[1.8]
          border-t border-l border-white/[0.15] border-r border-b border-white/[0.05]
          rounded-[2.5rem] px-2 py-2.5 flex items-center justify-between
          shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),inset_0_0_20px_rgba(255,255,255,0.02)]
          relative overflow-hidden
        ">
          {/* Surface Caustic light effect */}
          <div className="absolute -top-[100%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-white/[0.08] via-transparent to-transparent rotate-12 pointer-events-none" />

          {/* Dynamic Nav Cluster (No Back Button) */}
          <div className="flex items-center flex-1 justify-around px-2">
            {activeNavItems.map(({ path, icon: Icon, end }) => {
              const isActive = location.pathname === path;
              return (
                <NavLink key={path} to={path} end={end} className="relative p-3.5 active:scale-90 transition-all">
                  {isActive && (
                    <motion.div 
                      layoutId="mobile-active-glow" 
                      className="absolute inset-0 bg-cyan-500/[0.12] rounded-[1.2rem] border border-cyan-400/20"
                    />
                  )}
                  <Icon 
                    size={22} 
                    className={`relative z-10 transition-all duration-500 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-white/30'}`} 
                  />
                  {isActive && (
                    <motion.div 
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
                      layoutId="mobile-dot"
                    />
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* INTEGRATED TERMINAL TRIGGER */}
{/* INTEGRATED TERMINAL TRIGGER - Clean Transparent Style */}
{/* INTEGRATED TERMINAL TRIGGER - Naked Icon Style */}
          <div className="ml-1 pl-2 border-l border-white/10 flex items-center justify-center">
            <button
              onClick={() => setIsTerminalOpen(true)}
              className="
                p-2
                text-cyan-400/80 
                hover:text-cyan-400
                active:scale-75 
                transition-all
              "
            >
              <Terminal size={22} />
            </button>
          </div>
        </nav>
      </div>

{/* --- MOBILE CONTEXTUAL CAPSULE (Above Bottom Bar) --- */}
      <AnimatePresence>
        {hostname && (
          <div className="lg:hidden fixed bottom-[calc(1.5rem+80px)] left-1/2 -translate-x-1/2 z-[900] w-fit">
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 20, scale: 0.8, filter: "blur(10px)" }}
              onClick={() => navigate("/clients")}
              className="
                group relative flex items-center gap-2 px-6 py-2
                bg-[#020617]/80 backdrop-blur-3xl border border-white/10 rounded-full
                shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(34,211,238,0.1)]
                active:scale-95 pointer-events-auto overflow-hidden
              "
            >
              {/* Kinetic Gloss Streak */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -skew-x-12"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              />

              {/* Status Indicator Dot */}
              {/* <div className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee] animate-pulse" /> */}

              <span className="font-roboto-condensed text-[9px] font-black uppercase tracking-[0.4em] text-cyan-400/90 leading-none">
                EXIT NODE
              </span>

              {/* Back Arrow Subtle */}
              {/* <ChevronLeft size={10} className="text-white/40 group-hover:text-cyan-400 transition-colors" /> */}
              
              {/* Top Highlight Gloss */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* --- TOP RIGHT FORENSIC NOTCH --- */}
      <div className="lg:hidden fixed top-0 right-0 z-[100] flex justify-end">
        <button
          onClick={() => navigate("/")}
          className="group relative flex items-center gap-3 px-5 py-2.5 bg-[#020617]/80 backdrop-blur-2xl border-x border-b border-white/10 rounded-bl-[1.2rem] shadow-2xl active:scale-95 pointer-events-auto"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-cyan-500/40 blur-[1px]" />
          <img src={eyeLogo} alt="AURORA" className="w-4 h-4 brightness-150" />
          <span className="font-roboto-condensed text-[9px] font-black uppercase tracking-[0.2em] text-white">AURORA</span>
        </button>
      </div>
       <SshTerminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        apiBase="http://172.24.16.81:8001"
      />
    </>
  );
};

export default Sidebar;