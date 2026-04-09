import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import eyeLogo from "../assets/eye.png";

const SplashScreen = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, 2200); // Slightly more time for a smooth transition

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="
            fixed inset-0 z-[3000]
            flex flex-col items-center justify-center
            bg-[#020617]
            font-inter
            px-8
          "
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Main Visual Capsule */}
          <div className="flex flex-col items-center text-center">
            {/* Logo with Surgical Glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative"
            >
              <img
                src={eyeLogo}
                alt="AURORA"
                className="w-24 h-24 md:w-32 md:h-32 object-contain brightness-125"
              />
              {/* Specialized Neon Aura */}
              <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-[40px] -z-10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-400/5 blur-xl -z-10" />
            </motion.div>

            {/* Title - Inter Bold */}
            <motion.h1
              className="
                mt-8
                text-2xl md:text-3xl
                font-black
                tracking-[0.3em]
                text-white
                uppercase
                font-inter
              "
              initial={{ opacity: 0, letterSpacing: "0.1em" }}
              animate={{ opacity: 1, letterSpacing: "0.3em" }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              A.U.R.O.R.A
            </motion.h1>

            {/* Subtitle - Roboto Condensed Tactical */}
            <motion.div
              className="mt-4 space-y-2 flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <p className="text-[10px] md:text-xs text-gray-500 font-roboto-condensed font-black uppercase tracking-[0.2em] italic">
                Secure_Infrastructure_Link
              </p>
              {/* Subtle underline accent */}
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
            </motion.div>

            {/* Loading HUD Elements */}
            <motion.div
              className="mt-10 flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex gap-2.5">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]"
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
              <span className="font-jetbrains text-[7px] text-gray-600 uppercase tracking-widest animate-pulse">
                System_Handshake_Active
              </span>
            </motion.div>
          </div>

          {/* Tactical Corner Accents (Mobile Only) */}
          <div className="absolute top-8 left-8 w-3 h-3 border-t border-l border-white/5 md:hidden" />
          <div className="absolute bottom-8 right-8 w-3 h-3 border-b border-r border-white/5 md:hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;