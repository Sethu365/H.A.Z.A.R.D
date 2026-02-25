import React from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import eyeLogo from "../assets/eye.png";
import {
  Users,
  AlertTriangle,
  Settings,
  Activity,
  Lock,
  Info,
  Terminal,
  GitBranch,
  FolderOpen,
  ChevronLeft
} from "lucide-react";
import { path } from "framer-motion/client";

const Sidebar = () => {
  const location = useLocation();
  
  // Detect if we are in a client-specific route: /clients/:hostname
  const clientPathMatch = location.pathname.match(/^\/clients\/([^/]+)/);
  const hostname = clientPathMatch ? clientPathMatch[1] : null;

  // Default Global Navigation
  const mainNavItems = [
    { path: "/", icon: Activity, label: "Dashboard" },
    { path: "/clients", icon: Users, label: "Clients" },
    { path: "/anomalies", icon: AlertTriangle, label: "Anomalies" },
    { path: "/settings", icon: Settings, label: "Settings" }
  ];

  // Specific Client Navigation
  const clientNavItems = hostname ? [
    { path: `/clients/${hostname}`, icon: Info, label: "Client Details", end: true },
    { path: `/clients/${hostname}/control`, icon: Terminal, label: "Run Commands" },
    { path: `/clients/${hostname}/process-tree`, icon: GitBranch, label: "Process Tree" },
    { path: `/clients/${hostname}/file-explorer`, icon: FolderOpen, label: "File Explorer" }
  ] : [];

  const activeNavItems = hostname ? clientNavItems : mainNavItems;

  return (
    <motion.aside
      initial={{ x: -64, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-64 bg-[#020617] border-r border-gray-800 flex flex-col"
    >
      {/* IDENTITY */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={eyeLogo} alt="AURORA" className="w-11 h-11 object-contain" />
            <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full -z-10" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-wide text-white">A.U.R.O.R.A</h1>
            <p className="text-xs text-gray-400">AI Security Operations</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {/* Back Button if inside a client view */}
        {hostname && (
          <NavLink
            to="/clients"
            className="flex items-center gap-3 px-4 py-2 mb-4 text-xs font-bold uppercase tracking-wider text-cyan-500 hover:text-cyan-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Clients
          </NavLink>
        )}

        {activeNavItems.map(({ path, icon: Icon, label, end }) => {
          // Use end prop for NavLink to avoid partial matching on the root client path
          return (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) => `
                relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150
                ${isActive
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-gray-300 hover:bg-gray-800/60 hover:text-white"
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[2px] rounded-r
                      ${isActive ? "bg-cyan-400" : "bg-transparent"}`}
                  />
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* SYSTEM STATUS */}
      <div className="p-4 border-t border-gray-800">
        <div className="rounded-lg p-4 bg-gray-900/60 border border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-green-400"
            />
            <Lock className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">Secure</span>
          </div>
          <p className="text-xs text-gray-400">
            {hostname ? `Inspecting: ${hostname}` : "All systems operational"}
          </p>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;