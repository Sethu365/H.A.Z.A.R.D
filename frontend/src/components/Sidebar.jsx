import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import eyeLogo from "../assets/eye.png";
import {
  Users, AlertTriangle, Settings, Activity, Lock, Info,
  Terminal, GitBranch, FolderOpen, ChevronLeft, Command, OctagonAlert,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
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
    <>
      {/* DESKTOP SIDEBAR: Hidden on mobile, fixed on LG screens */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden lg:flex fixed left-0 top-0 h-screen w-24 hover:w-64 group transition-all duration-500 ease-in-out bg-[#020617] border-r border-cyan-500/10 flex-col z-50 overflow-hidden"
      >
        <div className="absolute top-0 -left-20 w-40 h-full bg-cyan-500/5 blur-[100px] pointer-events-none" />

        <div className="flex flex-col items-center py-8 border-b border-white/5">
          <div className="relative">
            <img src={eyeLogo} alt="AURORA" className="w-12 h-12 object-contain filter drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            <div className="absolute -inset-2 bg-cyan-500/10 blur-lg rounded-full animate-pulse" />
          </div>
          <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
            <h1 className="text-sm font-black tracking-[0.3em] text-white italic">A.U.R.O.R.A</h1>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-4">
          {hostname && (
            <NavLink
              to="/clients"
              className="flex items-center justify-center group-hover:justify-start gap-4 p-3 mb-6 rounded-xl bg-cyan-500/5 text-cyan-500 hover:bg-cyan-500/10 transition-all border border-cyan-500/20"
            >
              <ChevronLeft className="w-5 h-5 shrink-0" />
              <span className="hidden group-hover:block text-[10px] font-black uppercase tracking-widest italic">Exit_Node</span>
            </NavLink>
          )}

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
              <Icon className="w-6 h-6 shrink-0" />
              <span className="hidden group-hover:block text-xs font-black uppercase tracking-widest italic whitespace-nowrap">
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mb-4">
          <div className="flex flex-col items-center group-hover:items-start p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
              <span className="hidden group-hover:block text-[10px] font-black uppercase text-green-500 tracking-tighter">Link_Secure</span>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* MOBILE BOTTOM NAV: Visible only on small screens */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 px-4 pb-4">
        <div className="bg-[#020617]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex items-center justify-around shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
          {activeNavItems.slice(0, 5).map(({ path, icon: Icon, label, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) => `
                flex flex-col items-center justify-center p-3 rounded-2xl transition-all
                ${isActive ? "bg-white text-black scale-110 shadow-lg" : "text-gray-500"}
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[7px] font-black uppercase mt-1 tracking-tighter italic">
                {label}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;