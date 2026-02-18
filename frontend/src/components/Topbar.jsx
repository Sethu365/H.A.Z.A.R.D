import React from "react";
import { motion } from "framer-motion";
import { Bell, Search, User, Activity } from "lucide-react";

const Topbar = () => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="
        relative
        bg-[#020617]
        border-b border-gray-800
        px-6 py-4
      "
    >
      {/* Subtle accent line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-cyan-500/20" />

      <div className="flex items-center justify-between">
        {/* LEFT — Context */}
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            Security Operations Center
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              SOC
            </span>
          </h2>

          <p className="text-xs text-gray-400 max-w-xl">
            AI-driven observability, detection & response
          </p>
        </div>

        {/* RIGHT — Controls */}
        <div className="flex items-center gap-4">
          {/* System health */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-800">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-green-400"
            />
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-300">
              All systems operational
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts, hosts, hashes…"
              className="
                w-72
                bg-gray-900/60
                text-sm text-white
                pl-10 pr-4 py-2
                rounded-lg
                border border-gray-800
                focus:outline-none
                focus:border-cyan-400
                focus:ring-2 focus:ring-cyan-400/20
                transition-all
              "
            />
          </div>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="
              relative
              p-2
              rounded-lg
              bg-gray-900/60
              border border-gray-800
              hover:border-cyan-400/40
              transition
            "
          >
            <Bell className="w-5 h-5 text-gray-300" />
            {/* Severity badge */}
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
              3
            </span>
          </motion.button>

          {/* User */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-800">
            <User className="w-5 h-5 text-gray-300" />
            <span className="text-sm text-gray-300">
              System Monitor
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Topbar;
