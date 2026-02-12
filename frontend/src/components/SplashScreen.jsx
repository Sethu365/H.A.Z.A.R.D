import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import eyeLogo from "../assets/eye.png"; // your eye logo

const SplashScreen = ({ onFinish }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onFinish) onFinish();
    }, 2500); // show splash for 2.5s
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="flex flex-col items-center">
            {/* Logo with Zoom + Blur Reveal */}
            <motion.img
              src={eyeLogo}
              alt="H.A.Z.A.R.D Logo"
              className="w-48 h-48 object-contain mb-8"
              initial={{ scale: 2, opacity: 0, filter: "blur(20px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />

            {/* Title */}
            <motion.h1
              className="text-4xl font-extrabold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              H.A.Z.A.R.D
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-gray-400 text-lg mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.8 }}
            >
              Anomaly Detection System
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
