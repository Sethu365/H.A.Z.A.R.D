import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import eyeLogo from "../assets/eye.png";

const SplashScreen = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      // Call onFinish after the exit animation completes (1000ms + small buffer for smooth transition)
      setTimeout(() => onFinish?.(), 200);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <>
      {/* Dark background fallback - smooth fade out */}
      {visible && (
        <motion.div 
          className="fixed inset-0 z-[2999] bg-[#050505]"
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      )}
      <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-[#050505] overflow-hidden"
          // Cinematic Exit: Scaling up and blurring out (The Warp Effect)
          exit={{ 
            scale: 2,
            filter: "blur(20px)",
            opacity: 0 
          }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          {/* AMBIENT BACKGROUND: Moving Glow Orbs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 180] 
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[120px]"
          />

          <div className="relative flex flex-col items-center">
            
            {/* THE LOGO: Breathing and Glow */}
            <motion.div
              initial={{ scale: 0, opacity: 0, filter: "brightness(0) invert(1)" }}
              animate={{ scale: 1, opacity: 1, filter: "brightness(1) invert(0)" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative group"
            >
              {/* Pulsing Aura behind logo */}
              <motion.div 
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-cyan-500 rounded-full blur-2xl"
              />
              
              <motion.img 
                src={eyeLogo} 
                alt="Logo" 
                className="w-40 h-40 z-10 relative"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>

            {/* THE TEXT: "Shadow to Light" reveal */}
            <div className="mt-4 flex gap-1">
              {"AURORA".split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ 
                    delay: 0.8 + (i * 0.15), 
                    duration: 1,
                    ease: "easeOut"
                  }}
                  className="text-2xl md:text-6xl font-thin text-white tracking-[0.2em] drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                >
                  {char}
                </motion.span>
              ))}
            </div>

            {/* PROGRESS INDICATOR: Elegant thin line */}
            <div className="mt-8 w-32 h-[1px] bg-white/10 overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 1 
                }}
                className="w-full h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              />
            </div>
          </div>

          {/* NOISE OVERLAY: Film grain feel */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
};

export default SplashScreen;