import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Orbit, AlertTriangle, RefreshCw, Cpu } from 'lucide-react';

const GlobalLoader = ({ loading, error, onRetry }) => {
  return (
    <AnimatePresence>
      {(loading || error) && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#05070a]/90 backdrop-blur-3xl font-inter"
        >
          <div className="text-center space-y-8 p-12 max-w-md">
            {loading ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <Orbit size={80} className="text-cyan-500 animate-spin-slow" />
                  <Cpu size={32} className="absolute inset-0 m-auto text-cyan-400 animate-pulse" />
                  <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
                </div>
                <div className="space-y-2">
                  <motion.div 
                    animate={{ opacity: [0.4, 1, 0.4] }} 
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="font-roboto-condensed text-[10px] font-black text-cyan-400 uppercase tracking-[0.8em]"
                  >
                    Establishing_Neural_Link
                  </motion.div>
                  <p className="font-jetbrains text-[8px] text-gray-500 uppercase tracking-widest">Syncing Global Telemetry Mesh...</p>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="bg-red-500/5 border border-red-500/20 p-10 rounded-[3rem] space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.1)]"
              >
                <div className="flex justify-center">
                  <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/30">
                    <AlertTriangle size={40} className="text-red-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-inter text-xl font-black text-white uppercase tracking-tighter">Uplink_Failure</h3>
                  <p className="font-jetbrains text-[10px] text-gray-500 uppercase leading-relaxed break-words">{error}</p>
                </div>
                <button 
                  onClick={onRetry}
                  className="font-roboto-condensed w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500 text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-400 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  <RefreshCw size={14} /> Re-establish Link
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoader;