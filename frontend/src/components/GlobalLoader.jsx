import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import './Loader.css';

const GlobalLoader = ({ loading, error, onRetry }) => {
  const messages = ["Establishing_Link", "Syncing_Data", "Authenticating", "Finalizing"];
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 1500);
    return () => clearInterval(id);
  }, [loading]);

  return (
    <AnimatePresence>
      {(loading || error) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#020617]/90 backdrop-blur-md px-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-[300px] flex flex-col items-center text-center relative"
          >
            {loading ? (
              <>
                {/* Loader 5 - No Container Box */}
                <div className="relative mb-12">
                   <div className="loader-5"></div>
                </div>

                <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={msgIdx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="font-roboto-condensed text-[12px] font-black text-white uppercase tracking-[0.5em]"
                    >
                      {messages[msgIdx]}
                    </motion.p>
                  </AnimatePresence>
                  
                  <div className="space-y-1.5">
                    <p className="font-jetbrains text-[9px] text-cyan-500/60 italic tracking-widest">
                      ~ Getting Things Ready ~
                    </p>
                    <p className="font-jetbrains text-[7px] text-gray-600 uppercase tracking-[0.3em]">
                        System_Handshake_Active
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* Error State - Kept the small box for functional clarity */
              <div className="w-full space-y-6 bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 shadow-2xl">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl inline-block">
                  <AlertTriangle size={24} className="text-red-500" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-roboto-condensed text-xs font-black text-white uppercase tracking-widest">Uplink_Failed</h3>
                  <p className="font-jetbrains text-[8px] text-gray-500 uppercase leading-relaxed">{error || "Connection Timeout"}</p>
                </div>

                <button
                  onClick={onRetry}
                  className="w-full py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white font-roboto-condensed text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all"
                >
                  Retry_Link
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoader;