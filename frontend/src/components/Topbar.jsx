import React from "react";
import { motion } from "framer-motion";
import { Bell, Search, User, Activity } from "lucide-react";
import MiniAreaChart from "./MiniAreaChart";

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
            {/* <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-green-400"
            /> */}
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-300">
              All systems operational
            </span>
          </div>
          </div>
          </div>
    </motion.header>
  );
};

export default Topbar;
