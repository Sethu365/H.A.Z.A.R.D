import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Cpu } from 'lucide-react';

// ─── ANIMATED RING ────────────────────────────────────────────────────────────
const ScanRing = () => (
  <div className="relative w-28 h-28 flex items-center justify-center">
    {/* Outermost glow pulse */}
    <motion.div
      animate={{ scale: [1, 1.35, 1], opacity: [0.15, 0, 0.15] }}
      transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
      className="absolute inset-0 rounded-full bg-white/10"
    />

    {/* Spinning dashed ring */}
    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 112 112">
      {/* Track */}
      <circle cx="56" cy="56" r="48"
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      {/* Animated arc */}
      <motion.circle
        cx="56" cy="56" r="48"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="301"
        animate={{ strokeDashoffset: [301, 0, 301] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
      />
    </svg>

    {/* Inner ring — counter-spins slowly */}
    <svg className="absolute w-[72px] h-[72px]" viewBox="0 0 72 72">
      <motion.circle
        cx="36" cy="36" r="30"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
        strokeDasharray="6 8"
        animate={{ rotate: [0, -360] }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        style={{ transformOrigin: "36px 36px" }}
      />
    </svg>

    {/* Centre CPU icon */}
    <div className="relative z-10 p-3.5 rounded-2xl
                    backdrop-blur-[20px] bg-white/[0.08]
                    border-t border-l border-white/25 border-r border-b border-white/8
                    shadow-[inset_0_0_12px_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.2)]">
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
      >
        <Cpu size={24} className="text-white/80" />
      </motion.div>
    </div>
  </div>
);

// ─── LOADER ───────────────────────────────────────────────────────────────────
const GlobalLoader = ({ loading, error, onRetry }) => {
  // Cycle through status messages
  const messages = [
    "Establishing Neural Link",
    "Syncing Telemetry Mesh",
    "Authenticating Node Uplink",
    "Calibrating Sensor Array",
  ];
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 2200);
    return () => clearInterval(id);
  }, [loading]);

  return (
    <AnimatePresence>
      {(loading || error) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center font-inter overflow-hidden"
        >
          {/* ── BACKDROP ── */}
          <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-2xl" />

          {/* ── ATMOSPHERIC BLOBS — same ink as DashboardLayout ── */}
          <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%]
                          bg-blue-500/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%]
                          bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-[40%] right-[20%] w-[20%] h-[20%]
                          bg-purple-400/15 blur-[80px] rounded-full pointer-events-none" />

          {/* ── GLASS CARD ── */}
          <motion.div
            initial={{ scale: 0.94, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="relative overflow-hidden w-full max-w-sm mx-4
                       rounded-[2.5rem]
                       backdrop-blur-[40px] saturate-[2.2]
                       bg-white/[0.07] dark:bg-black/25
                       border-t border-l border-white/25
                       border-r border-b border-white/[0.07]
                       shadow-[0_40px_80px_rgba(0,0,0,0.4),inset_0_0_40px_rgba(255,255,255,0.05),inset_0_0_2px_rgba(255,255,255,0.3)]"
          >
            {/* Liquid shine */}
            <div className="absolute -top-[120%] -left-[40%] w-[180%] h-[180%]
                            bg-gradient-to-br from-white/[0.12] via-transparent to-transparent
                            rotate-12 pointer-events-none" />
            {/* Caustic wash */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5
                            opacity-60 pointer-events-none" />
            {/* Bottom bevel */}
            <div className="absolute bottom-0 left-0 w-full h-[1px]
                            bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative z-10 p-10 flex flex-col items-center text-center gap-8">

              {loading ? (
                <>
                  <ScanRing />

                  <div className="space-y-3">
                    {/* Cycling status line */}
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={msgIdx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.35 }}
                        className="text-[10px] font-black text-white/70 uppercase tracking-[0.4em]"
                      >
                        {messages[msgIdx]}
                      </motion.p>
                    </AnimatePresence>

                    <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest">
                      Syncing Global Telemetry Mesh
                    </p>
                  </div>

                  {/* Progress dots */}
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
                        transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2, ease: "easeInOut" }}
                        className="w-1.5 h-1.5 rounded-full bg-white/50"
                      />
                    ))}
                  </div>
                </>
              ) : (
                /* ── ERROR STATE ── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full space-y-7"
                >
                  {/* Error icon */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                        transition={{ repeat: Infinity, duration: 2.4 }}
                        className="absolute inset-0 rounded-2xl bg-red-500/20 blur-xl"
                      />
                      <div className="relative p-4 rounded-2xl
                                      backdrop-blur-[20px] bg-red-500/[0.12]
                                      border-t border-l border-red-400/25 border-r border-b border-red-500/[0.08]
                                      shadow-[inset_0_0_12px_rgba(239,68,68,0.08)]">
                        <AlertTriangle size={32} className="text-red-400" />
                      </div>
                    </div>
                  </div>

                  {/* Text */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                      Uplink_Failure
                    </h3>
                    <p className="text-[10px] font-bold text-white/35 uppercase tracking-wider
                                  leading-relaxed break-words">
                      {error}
                    </p>
                  </div>

                  {/* Retry button */}
                  <button
                    onClick={onRetry}
                    className="w-full flex items-center justify-center gap-3
                               px-6 py-3.5 rounded-2xl
                               bg-white/[0.08] border-t border-l border-white/20
                               border-r border-b border-white/[0.06]
                               text-white/80 text-[11px] font-black uppercase tracking-widest
                               hover:bg-white/[0.14] hover:text-white hover:border-white/30
                               shadow-[inset_0_0_15px_rgba(255,255,255,0.04)]
                               hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.08)]
                               transition-all duration-200 active:scale-[0.98]"
                  >
                    <RefreshCw size={14} />
                    Re-establish Link
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoader;