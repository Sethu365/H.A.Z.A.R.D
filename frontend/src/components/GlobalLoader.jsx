import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

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
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#020617]/95 backdrop-blur-md px-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-[280px] bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
          >
            {/* Simple Top Gloss */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

            {loading ? (
              <>
                {/* Simplified Scanner */}
                <div className="relative w-16 h-16 mb-6 flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-cyan-500/20 rounded-full"
                  />
                  <Loader2 size={24} className="text-cyan-400 animate-spin" />
                </div>

                <div className="space-y-2">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={msgIdx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-roboto-condensed text-[10px] font-black text-white uppercase tracking-[0.4em]"
                    >
                      {messages[msgIdx]}
                    </motion.p>
                  </AnimatePresence>
                  <p className="font-jetbrains text-[7px] text-gray-500 uppercase tracking-widest">System_Handshake_Active</p>
                </div>
              </>
            ) : (
              /* Simplified Error State */
              <div className="w-full space-y-6">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl inline-block mx-auto">
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