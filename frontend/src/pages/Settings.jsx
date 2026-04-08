import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BrainCircuit,
  ChevronRight
} from 'lucide-react';
import Topbar from "../components/Topbar";

const Settings = () => {
  const [hypothesisGeneration, setHypothesisGeneration] = useState(true);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-inter">
      <Topbar name="System Settings" desc="A.U.R.O.R.A_Global_Configuration" />

      <main className="pt-24 pb-20 px-4 md:px-8 max-w-3xl mx-auto space-y-8 overflow-x-hidden">
        
        {/* TOP STATUS BAR */}
        <div className="flex items-center gap-3 px-2">
            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]" />
            <span className="font-roboto-condensed text-[10px] font-black text-cyan-400 uppercase tracking-[0.6em]">Config_Uplink_Active</span>
        </div>

        {/* Settings Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-md shadow-2xl transition-all"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400">
              <BrainCircuit size={28} />
            </div>
            <div>
              <h3 className="font-roboto-condensed text-xl font-black uppercase tracking-[0.2em] text-gray-200">Intelligence_Heuristics</h3>
              <p className="font-roboto-condensed text-[10px] text-gray-500 uppercase tracking-widest mt-1">Core AI reasoning parameters</p>
            </div>
          </div>

          {/* SINGLE OPTION: Hypothesis Generation */}
          <div className="flex items-center justify-between py-8 border-y border-white/5">
            <div className="space-y-1">
              <p className="font-roboto-condensed text-base font-bold uppercase tracking-tight text-white">Neural Hypothesis Engine</p>
              <p className="font-roboto-condensed text-xs text-gray-500 uppercase tracking-widest leading-relaxed max-w-md">
                Enable automated AI-driven reasoning to generate forensic hypotheses based on anomalous behavioral patterns.
              </p>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setHypothesisGeneration(!hypothesisGeneration)}
              className={`relative w-14 h-7 rounded-full transition-colors shrink-0 ${
                hypothesisGeneration ? 'bg-cyan-500' : 'bg-white/10'
              }`}
            >
              <motion.div
                animate={{ x: hypothesisGeneration ? 30 : 4 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
              />
            </motion.button>
          </div>

          {/* Global Action Buttons */}
          <div className="flex justify-end items-center gap-6 pt-10 font-roboto-condensed">
            <button className="flex items-center gap-3 px-10 py-4 bg-white text-black rounded-2xl font-black uppercase text-xs hover:bg-cyan-400 transition-all shadow-2xl active:scale-95 group">
              Apply Configuration <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;