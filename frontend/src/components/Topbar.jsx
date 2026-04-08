import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

// ─── SHARED LAYOUT CONSTANT ───────────────────────────────────────────────────
// Export this so Sidebar (and any page wrapper) can consume the exact same value.
export const TOPBAR_HEIGHT = "72px";

const Topbar = ({ name, desc }) => {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="fixed top-0 right-0 left-0 lg:left-20 z-40"
      style={{ height: TOPBAR_HEIGHT }}
    >
      <div className="relative h-full overflow-hidden
                      rounded-none rounded-b-[2rem]
                      backdrop-blur-[35px] saturate-[2.2]
                      bg-white/[0.08] dark:bg-black/20
                      border-b border-r border-white/5
                      border-l border-white/10
                      shadow-[
                        0_20px_50px_rgba(0,0,0,0.10),
                        0_2px_5px_rgba(0,0,0,0.06),
                        inset_0_0_25px_rgba(255,255,255,0.08),
                        inset_0_0_2px_rgba(255,255,255,0.4)
                      ]">

        {/* LIQUID SHINE */}
        <div className="absolute -top-[150%] -left-[50%] w-[200%] h-[200%]
                        bg-gradient-to-br from-white/15 via-transparent to-transparent
                        rotate-12 pointer-events-none" />

        {/* CAUSTIC LIGHT */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-cyan-500/5
                        opacity-30 pointer-events-none" />

        <div className="relative z-10 h-full px-8 md:px-12 flex items-center justify-between gap-4">
          {/* LEFT: IDENTITY */}
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white
                           tracking-tighter leading-none truncate
                           drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]">
              {name}
            </h2>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="h-1.5 w-5 rounded-full
                              bg-gradient-to-r from-indigo-500 to-cyan-400
                              shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
              <p className="font-bold text-[10px] md:text-[11px]
                            text-slate-900/50 dark:text-white/40
                            uppercase tracking-[0.3em] truncate">
                {desc || "Neural link active"}
              </p>
            </div>
          </div>

          {/* RIGHT: STATUS CHIP */}
          <div className="flex items-center shrink-0">
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full
                            bg-white/8 border border-white/20
                            shadow-[inset_0_1px_3px_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.06)]
                            transition-all duration-200 hover:bg-white/15 hover:border-white/30
                            cursor-default">
              <div className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5
                                 bg-green-400/80 shadow-[0_0_10px_#4ade80,0_0_20px_#4ade8055]" />
              </div>
              <span className="hidden sm:block text-[11px] font-black
                               text-slate-900/70 dark:text-white/70
                               uppercase tracking-widest">
                System_Live
              </span>
            </div>
          </div>

        </div>

        {/* BOTTOM BEVEL */}
        <div className="absolute bottom-0 left-0 w-full h-[1px]
                        bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </motion.header>
  );
};

export default Topbar;