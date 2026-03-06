import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Hammer, Zap, ArrowLeft, Construction } from 'lucide-react';

const UnderDevelopment = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#02040a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Aura Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#0b0f1a]/80 border border-gray-800 rounded-[2.5rem] p-12 text-center backdrop-blur-xl shadow-2xl relative z-10"
      >
        {/* Animated Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="p-6 bg-cyan-500/10 rounded-3xl border border-cyan-500/20 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
            >
              <Construction size={48} />
            </motion.div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2 text-yellow-500 bg-black rounded-full"
            >
              <Zap size={20} fill="currentColor" />
            </motion.div>
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase">
          Under Construction
        </h1>
        <p className="text-gray-500 text-sm font-medium italic mb-8 leading-relaxed">
          The A.U.R.O.R.A engineering team is currently building this forensic module. 
          Expect deployment in a future update.
        </p>

        {/* Progress Bar Mockup */}
        <div className="w-full bg-gray-900 h-1.5 rounded-full mb-10 overflow-hidden">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "65%" }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
          />
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-4 rounded-2xl transition-all text-cyan-400 bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-400 active:scale-95 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Return to Command Center
        </button>
      </motion.div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:32px_32px]" />
    </div>
  );
};

export default UnderDevelopment;