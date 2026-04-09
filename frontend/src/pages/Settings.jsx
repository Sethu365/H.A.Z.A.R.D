import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const [hypothesisGeneration, setHypothesisGeneration] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleApply = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-inter selection:bg-cyan-500/30 overflow-x-hidden">
      
      <main className="pt-8 md:pt-12 pb-20 px-4 md:px-12 w-full space-y-6 md:space-y-8 transition-all duration-500 max-w-[1600px] mx-auto">
        
        {/* --- DYNAMIC HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center justify-center md:justify-start w-full md:w-auto relative">
            {/* Back Button: Laptop Only */}
            <button 
              onClick={() => navigate(-1)} 
              className="hidden md:flex absolute left-0 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
            >
              <ChevronLeft size={20} className="text-cyan-400" />
            </button>
            
            <div className="text-center md:text-left md:ml-16">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">System Settings</h1>
              {/* Metadata: Laptop Only */}
              <p className="hidden md:block font-roboto-condensed text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em] mt-1">
                A.U.R.O.R.A_Global_Configuration
              </p>
            </div>
          </div>

          {/* Uplink State Badge: Laptop Only or simplified for mobile */}

        </div>

        {/* --- STATUS INDICATOR --- */}


        {/* --- SETTINGS HUD CONTAINER --- */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.01] border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-16 shadow-2xl backdrop-blur-md transition-all"
        >
          {/* Internal Section Title */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-8 md:mb-12">
            <div className="p-3 md:p-4 bg-cyan-500/10 rounded-[1.2rem] md:rounded-[1.5rem] border border-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <BrainCircuit size={28} />
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-roboto-condensed text-lg md:text-2xl font-bold uppercase tracking-[0.2em] text-gray-200">Intelligence_Heuristics</h3>
              <p className="font-roboto-condensed text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Core AI reasoning parameters</p>
            </div>
          </div>

          {/* OPTION: Neural Engine Toggle */}
          <div className="flex flex-col md:flex-row items-center justify-between py-8 md:py-10 border-y border-white/5 gap-6 text-center md:text-left">
            <div className="space-y-2">
              <p className="font-roboto-condensed text-base md:text-lg font-bold uppercase tracking-tight text-white">Neural Hypothesis Engine</p>
              <p className="font-roboto-condensed text-[10px] md:text-xs text-gray-600 md:text-gray-500 uppercase tracking-widest leading-relaxed max-w-xl">
                Enable automated AI-driven reasoning to generate forensic hypotheses based on anomalous behavioral patterns.
              </p>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setHypothesisGeneration(!hypothesisGeneration)}
              className={`relative w-14 md:w-16 h-7 md:h-8 rounded-full transition-colors shrink-0 shadow-inner ${
                hypothesisGeneration ? 'bg-cyan-500/80' : 'bg-white/10'
              }`}
            >
              <motion.div
                animate={{ x: hypothesisGeneration ? (window.innerWidth < 768 ? 28 : 34) : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 md:w-6 h-5 md:h-6 bg-white rounded-full shadow-lg"
              />
            </motion.button>
          </div>

          {/* ACTION CLUSTER */}
          <div className="flex flex-col md:flex-row justify-end items-center gap-6 pt-10 md:pt-12">
            <button className="font-roboto-condensed text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:text-white transition-colors active:scale-95 order-2 md:order-1">
              Reset to Defaults
            </button>
            <button 
              onClick={handleApply}
              className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] md:text-xs hover:bg-cyan-400 transition-all shadow-2xl active:scale-95 group order-1 md:order-2"
            >
              {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              Apply Config
              <ChevronRight size={16} className="hidden md:block group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* --- FOOTER --- */}
        <div className="flex justify-center pt-8">
          <p className="font-jetbrains text-[8px] md:text-[9px] text-gray-800 uppercase tracking-tighter">
            System_Revision: 4.0.2 // Hash: 0x882A_AURORA
          </p>
        </div>
      </main>
    </div>
  );
};

export default Settings;