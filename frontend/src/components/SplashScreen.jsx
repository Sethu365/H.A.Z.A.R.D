import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import eyeLogo from "../assets/eye.png";

const SplashScreen = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, 2000); // shorter, SOC-friendly

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-[#020617]
          "
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex flex-col items-center">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative"
            >
              <img
                src={eyeLogo}
                alt="AURORA"
                className="w-32 h-32 object-contain"
              />

              {/* Subtle AI glow */}
              <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl -z-10" />
            </motion.div>

            {/* Title */}
            <motion.h1
              className="
                mt-6
                text-3xl
                font-semibold
                tracking-widest
                text-white
              "
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              A.U.R.O.R.A
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="
                mt-2
                text-sm
                text-gray-400
                tracking-wide
              "
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              AI Security Operations Platform
            </motion.p>

            {/* Loading indicator */}
            <motion.div
              className="mt-6 flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-cyan-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
