import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
    // Simulate config uplink
    setTimeout(() => setIsSyncing(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-inter selection:bg-cyan-500/30">
      
      <main className="pt-12 pb-20 px-6 md:px-12 w-full space-y-8 transition-all duration-500">
        
        {/* INTEGRATED HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
            >
              <ChevronLeft size={20} className="text-cyan-400" />
            </button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-white">System Settings</h1>
              <p className="font-roboto-condensed text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em]">A.U.R.O.R.A_Global_Configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-6 bg-black/40 border border-white/5 py-3 px-6 rounded-2xl">
            <div className="flex flex-col items-end">
              <span className="font-roboto-condensed text-[8px] font-bold text-gray-500 uppercase tracking-widest">Uplink_State</span>
              <span className="font-jetbrains text-xs font-bold text-cyan-400 uppercase tracking-tighter">CONFIG_READY</span>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <RefreshCw size={16} className={`${isSyncing ? 'animate-spin text-cyan-400' : 'text-gray-700'}`} />
          </div>
        </div>

        {/* TOP STATUS BAR */}
        <div className="flex items-center gap-3 px-4">
            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]" />
            <span className="font-roboto-condensed text-[10px] font-bold text-cyan-400 uppercase tracking-[0.6em]">Config_Uplink_Active</span>
        </div>

        {/* Settings Container (Wider Layout) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-10 md:p-16 shadow-2xl backdrop-blur-sm transition-all"
        >
          <div className="flex items-center gap-6 mb-12">
            <div className="p-4 bg-cyan-500/10 rounded-[1.5rem] border border-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <BrainCircuit size={32} />
            </div>
            <div>
              <h3 className="font-roboto-condensed text-2xl font-bold uppercase tracking-[0.2em] text-gray-200">Intelligence_Heuristics</h3>
              <p className="font-roboto-condensed text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 px-1">Core AI reasoning parameters</p>
            </div>
          </div>

          {/* OPTION: Hypothesis Generation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-10 border-y border-white/5 gap-6">
            <div className="space-y-2">
              <p className="font-roboto-condensed text-lg font-bold uppercase tracking-tight text-white">Neural Hypothesis Engine</p>
              <p className="font-roboto-condensed text-xs text-gray-500 uppercase tracking-widest leading-relaxed max-w-xl">
                Enable automated AI-driven reasoning to generate forensic hypotheses based on anomalous behavioral patterns.
              </p>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setHypothesisGeneration(!hypothesisGeneration)}
              className={`relative w-16 h-8 rounded-full transition-colors shrink-0 shadow-inner ${
                hypothesisGeneration ? 'bg-cyan-500' : 'bg-white/10'
              }`}
            >
              <motion.div
                animate={{ x: hypothesisGeneration ? 34 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
              />
            </motion.button>
          </div>

          {/* Global Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-6 pt-12">
            <button className="font-roboto-condensed text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
              Reset to Defaults
            </button>
            <button 
              onClick={handleApply}
              className="flex items-center gap-3 px-10 py-4 bg-white text-black rounded-2xl font-bold uppercase text-xs hover:bg-cyan-400 transition-all shadow-2xl active:scale-95 group"
            >
              <Save size={16} />
              Apply Configuration 
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* FOOTER METADATA */}
        <div className="flex justify-center pt-8">
          <p className="font-jetbrains text-[9px] text-gray-700 uppercase tracking-tighter">
            System_Revision: 4.0.2 // Hash: 0x882A_AURORA
          </p>
        </div>
      </main>
    </div>
  );
};

export default Settings;