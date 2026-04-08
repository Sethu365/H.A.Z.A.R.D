import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import eyeLogo from "../assets/eye.png";
import { TOPBAR_HEIGHT } from "./Topbar";
import {
  Users, AlertTriangle, Settings, Activity, Info,
  Terminal, GitBranch, FolderOpen, ChevronLeft, Command, OctagonAlert
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const clientPathMatch = location.pathname.match(/^\/clients\/([^/]+)/);
  const hostname = clientPathMatch ? clientPathMatch[1] : null;

  const mainNavItems = [
    { path: "/", icon: Activity, label: "Dash" },
    { path: "/clients", icon: Users, label: "Clients" },
    { path: "/anomalies", icon: AlertTriangle, label: "Alerts" },
    { path: "/scraper", icon: Command, label: "Intel" },
    { path: "/settings", icon: Settings, label: "Config" },
  ];

  const clientNavItems = hostname ? [
    { path: `/clients/${hostname}`, icon: Info, label: "Info", end: true },
    { path: `/clients/${hostname}/control`, icon: Terminal, label: "Shell" },
    { path: `/clients/${hostname}/process-tree`, icon: GitBranch, label: "Tree" },
    { path: `/clients/${hostname}/file-explorer`, icon: FolderOpen, label: "Files" },
    { path: `/clients/${hostname}/client-anomaly`, icon: OctagonAlert, label: "Status" }
  ] : [];

  const activeNavItems = hostname ? clientNavItems : mainNavItems;

  return (
    <>
      {/* ─── DESKTOP LIQUID GLASS SIDEBAR ─── */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        style={{ top: TOPBAR_HEIGHT }}          /* ← exact seam with topbar */
        className="hidden lg:flex fixed left-0 bottom-0 w-20 flex-col z-30
                   overflow-hidden rounded-r-[2.5rem]
                   backdrop-blur-[35px] saturate-[2.2]
                   bg-white/[0.08] dark:bg-black/20
                   border-t border-white/10
                   border-r border-b border-white/5
                   shadow-[
                     4px_0_40px_rgba(0,0,0,0.15),
                     0_2px_5px_rgba(0,0,0,0.1),
                     inset_0_0_30px_rgba(255,255,255,0.08),
                     inset_0_0_2px_rgba(255,255,255,0.35)
                   ]"
      >
        {/* LIQUID SHINE */}
        <div className="absolute -top-[150%] -left-[50%] w-[200%] h-[200%]
                        bg-gradient-to-br from-white/15 via-transparent to-transparent
                        rotate-12 pointer-events-none z-0" />

        {/* CAUSTIC LIGHT */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-cyan-500/5
                        opacity-40 pointer-events-none z-0" />

        {/* RIGHT BEVEL */}
        <div className="absolute right-0 top-0 w-[1px] h-full
                        bg-gradient-to-b from-transparent via-white/20 to-transparent
                        pointer-events-none z-10" />

        {/* ── LOGO ── */}
        <div className="relative z-10 flex flex-col items-center py-5 border-b border-white/10">
          <div className="relative cursor-pointer group" onClick={() => navigate('/')}>
            <img
              src={eyeLogo}
              alt="Logo"
              className="w-8 h-8 object-contain filter grayscale group-hover:grayscale-0
                         transition-all duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
            />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full border-2 border-white/20
                            bg-green-400 shadow-[0_0_8px_#4ade80,0_0_16px_#4ade8066]" />
          </div>
        </div>

        {/* ── NAV ── */}
        <nav className="relative z-10 flex-1 flex flex-col items-center py-5 space-y-3
                        overflow-y-auto no-scrollbar">


          <div className="w-full px-2 space-y-2">
            {activeNavItems.map(({ path, icon: Icon, label, end }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                className={({ isActive }) => `
                  group relative flex flex-col items-center justify-center w-full h-14 rounded-2xl
                  transition-all duration-200 overflow-hidden
                  ${isActive
                    ? `bg-white/15 border border-white/25
                       shadow-[inset_0_1px_3px_rgba(255,255,255,0.2),0_4px_15px_rgba(0,0,0,0.1)]
                       text-white`
                    : `text-white/35 border border-transparent
                       hover:bg-white/8 hover:border-white/15 hover:text-white/70
                       hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]`
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent
                                      to-transparent pointer-events-none" />
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute left-0 w-[3px] h-8 rounded-r-full
                                   bg-gradient-to-b from-white/90 to-white/40
                                   shadow-[0_0_10px_rgba(255,255,255,0.6),0_0_20px_rgba(255,255,255,0.3)]"
                      />
                    )}
                    <Icon className="w-5 h-5 mb-1 relative z-10" strokeWidth={isActive ? 2.5 : 1.8} />
                    <span className="text-[8px] font-bold uppercase tracking-widest leading-none relative z-10">
                      {label}
                    </span>
                    <div className="absolute left-[calc(100%+10px)] px-3 py-1.5 rounded-xl
                                    backdrop-blur-[20px] bg-white/15 border border-white/25
                                    shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]
                                    text-white text-[10px] font-bold uppercase tracking-wider
                                    opacity-0 group-hover:opacity-100 pointer-events-none
                                    transition-opacity whitespace-nowrap z-50">
                      {label}
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* ── FOOTER ── */}
        <div className="relative z-10 p-4 border-t border-white/10 flex flex-col items-center gap-2">
          <div className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl
                          bg-white/5 border border-white/10
                          shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]" />
            <span className="text-[7px] font-bold text-white/30 uppercase tracking-tighter">A.U.R.O.R.A</span>
          </div>
        </div>
      </motion.aside>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100]">
        <nav className="relative overflow-hidden rounded-t-[2rem]
                        backdrop-blur-[35px] saturate-[2.2]
                        bg-white/[0.08] dark:bg-black/20
                        border-t border-l border-r border-white/15
                        shadow-[0_-4px_30px_rgba(0,0,0,0.12),inset_0_0_20px_rgba(255,255,255,0.06)]
                        flex items-center justify-around px-2 h-16">
          <div className="absolute -top-[200%] -left-[50%] w-[200%] h-[200%]
                          bg-gradient-to-br from-white/10 via-transparent to-transparent
                          rotate-12 pointer-events-none" />
          {activeNavItems.slice(0, 5).map(({ path, icon: Icon, end }) => (
            <NavLink key={path} to={path} end={end}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center p-3 rounded-xl transition-all
                ${isActive
                  ? "text-white bg-white/15 border border-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)]"
                  : "text-white/35 hover:text-white/60"}
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
                  {isActive && (
                    <motion.div layoutId="bubble-mobile"
                      className="absolute -top-[1px] inset-x-2 h-[2px] rounded-full
                                 bg-gradient-to-r from-transparent via-white/70 to-transparent
                                 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;




                  // <button
                  //   onClick={() => hostname ? navigate('/clients') : navigate('/')}
                  //   className="flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200
                  //              bg-white/5 border border-white/10
                  //              text-white/30 hover:text-white/80
                  //              hover:bg-white/10 hover:border-white/20
                  //              hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)]"
                  // >
                  //   <ChevronLeft size={18} strokeWidth={2.5} />
                  // </button>