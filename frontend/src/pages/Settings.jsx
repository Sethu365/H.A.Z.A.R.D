import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom'; // 1. Added useOutletContext
import { 
  BrainCircuit,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const Settings = () => {
  // 2. Neural Link: Safe Context Access
  const context = useOutletContext();
  const setHeaderData = context?.setHeaderData;

  const [hypothesisGeneration, setHypothesisGeneration] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 3. Sync Topbar Identity via Layout Context
  useEffect(() => {
    if (setHeaderData) {
      setHeaderData({
        name: "System Settings",
        desc: "A.U.R.O.R.A_Global_Configuration // Intelligence Hub"
      });
    }
  }, [setHeaderData]);

  const handleApply = () => {
    setIsSaving(true);
    // Simulate configuration uplink
    setTimeout(() => setIsSaving(false), 1500);
  };

  return (
    // 4. Removed min-h-screen/pt-24 (handled by DashboardLayout)
    <div className="space-y-8 relative selection:bg-cyan-500/30">
      
      {/* TOP STATUS BAR */}
      <div className="flex items-center gap-3 px-2">
          <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]" />
          <span className="font-roboto-condensed text-[10px] font-black text-cyan-400 uppercase tracking-[0.6em]">Config_Uplink_Active</span>
      </div>

      {/* Settings Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-md shadow-2xl transition-all relative overflow-hidden"
      >
        {/* Subtle Decorative Gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400">
            <BrainCircuit size={28} />
          </div>
          <div>
            <h3 className="font-roboto-condensed text-xl font-black uppercase tracking-[0.2em] text-gray-200">Intelligence_Heuristics</h3>
            <p className="font-roboto-condensed text-[10px] text-gray-500 uppercase tracking-widest mt-1">Core AI reasoning parameters</p>
          </div>
        </div>

        {/* OPTION: Hypothesis Generation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-8 border-y border-white/5 gap-6">
          <div className="space-y-1">
            <p className="font-roboto-condensed text-base font-bold uppercase tracking-tight text-white">Neural Hypothesis Engine</p>
            <p className="font-roboto-condensed text-xs text-gray-500 uppercase tracking-widest leading-relaxed max-w-md">
              Enable automated AI-driven reasoning to generate forensic hypotheses based on anomalous behavioral patterns detected across the mesh.
            </p>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setHypothesisGeneration(!hypothesisGeneration)}
            className={`relative w-14 h-7 rounded-full transition-colors shrink-0 ${
              hypothesisGeneration ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-white/10'
            }`}
          >
            <motion.div
              animate={{ x: hypothesisGeneration ? 30 : 4 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
            />
          </motion.button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex justify-end items-center gap-6 pt-10 font-roboto-condensed">
          <button 
            onClick={handleApply}
            disabled={isSaving}
            className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black uppercase text-xs transition-all shadow-2xl active:scale-95 group ${
              isSaving 
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 cursor-wait' 
              : 'bg-white text-black hover:bg-cyan-400'
            }`}
          >
            {isSaving ? (
              <>Syncing Registry...</>
            ) : (
              <>
                Apply Configuration 
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* FOOTER METADATA */}
      <div className="px-4 flex justify-between items-center opacity-30 font-roboto-condensed text-[8px] uppercase tracking-[0.4em] text-gray-500">
        <span>A.U.R.O.R.A Terminal v4.0.2</span>
        <span>Encryption: AES-256-GCM</span>
      </div>
    </div>
  );
};

export default Settings;