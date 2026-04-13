import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import eyeLogo from "../assets/eye.png"; 

const SplashScreen = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      // Short delay for the exit animation to complete
      setTimeout(() => onFinish?.(), 600); 
    }, 2000); // 2 Second Timeframe

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-[#020617] overflow-hidden select-none"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative flex flex-col items-center">
            
            {/* LOGO: Clean Pulsing Reveal */}
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ duration: 0.8, ease: "easeOut" }}
               className="relative flex items-center justify-center w-24 h-24 mb-8"
            >
              {/* Subtle outer glow */}
              <motion.div 
                className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <img
                src={eyeLogo}
                alt="Aurora"
                className="w-full h-full z-10 brightness-110"
              />
            </motion.div>

            {/* NAME: Sharp Tracking Reveal */}
            <div className="overflow-hidden">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                className="text-4xl md:text-5xl font-black text-white tracking-[0.3em] font-inter uppercase"
              >
                AURORA
              </motion.h1>
            </div>

            {/* Simple Progress Line */}
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 1.2, ease: "easeInOut" }}
              className="h-[1px] w-32 bg-cyan-500/40 mt-4 origin-center"
            />

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;