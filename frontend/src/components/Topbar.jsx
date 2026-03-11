import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const Topbar = ({ name, desc }) => {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      /** * FIX: 
       * 1. z-30 ensures it sits below the Sidebar (which should be z-50)
       * 2. lg:left-24 (6rem) matches your desktop sidebar width to prevent overlap
       */
      className="fixed top-0 right-0 left-0 lg:left-24 z-30 backdrop-blur-md"
    >
      <div className="relative bg-[#020617]/70 border-b border-white/5 px-4 md:px-8 py-4 md:py-6 flex items-center gap-4 md:gap-8 justify-between">
        
        {/* TOP GLOW LINE */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

        {/* LEFT SECTION: BACK BUTTON + IDENTITY */}
        <div className="flex items-center gap-4 md:gap-8 min-w-0">
          {/* BACK BUTTON - NOW ON THE LEFT */}
          <button
            onClick={() => navigate(-1)}
            className="group relative flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl bg-white text-black hover:bg-cyan-400 transition-all duration-300 shadow-[0_10px_20px_rgba(0,0,0,0.4)] shrink-0 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:block text-[10px] md:text-xs font-black italic tracking-tight font-sans uppercase">
              Return
            </span>
          </button>

          {/* IDENTITY */}
          <div className="space-y-0.5 md:space-y-1 min-w-0">
            <h2 className="text-2xl md:text-5xl font-extrabold text-white italic tracking-tighter leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] font-sans truncate">
              {name}
            </h2>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-[1.5px] md:h-[2px] w-4 md:w-6 bg-cyan-500 rounded-full shrink-0" />
              <p className="text-[9px] md:text-[11px] font-medium text-gray-400 italic tracking-wide font-sans truncate max-w-[150px] md:max-w-none">
                {desc || "Neural link active // System monitoring"}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: TELEMETRY STATUS */}
        <div className="flex items-center shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            <span className="text-[10px] font-bold text-cyan-400/80 italic font-sans uppercase tracking-widest">Live_Telemetry</span>
          </div>
        </div>

        {/* BORDER ACCENT */}
        <div className="absolute bottom-[-1px] left-0 w-16 md:w-32 h-[2px] bg-cyan-500 shadow-[0_0_15px_#06b6d4] rounded-r-full" />
      </div>
    </motion.header>
  );
};

export default Topbar;