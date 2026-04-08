import React from 'react';

const ForensicView = ({ rawData }) => {
  // 1. Structural Guard
  if (!rawData) {
    return (
      <div className="p-10 text-center border border-dashed border-white/5 rounded-[2rem]">
        <p className="font-roboto-condensed text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
          Awaiting_Forensic_Payload...
        </p>
      </div>
    );
  }

  // 2. Optimized Regex and Parsing
  const jsonRegex = /```json\n([\s\S]*?)\n```/;
  const match = rawData.match(jsonRegex);
  
  let structuredRules = [];
  try {
    structuredRules = match ? JSON.parse(match[1]).rules : [];
  } catch (e) {
    console.error("Forensic_Data_Sync_Error:", e);
  }

  const narrative = rawData.split('=====================')[0];

  return (
    <div className="space-y-10 selection:bg-cyan-500/30">
      {/* NARRATIVE SECTION */}
      <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6 border-l-2 border-cyan-500 pl-4">
           <h3 className="font-roboto-condensed text-[11px] font-black uppercase text-gray-400 tracking-[0.3em]">
             Neural_Context_Analysis
           </h3>
        </div>
        
        <div className="font-jetbrains text-[14px] leading-relaxed text-gray-400 whitespace-pre-wrap">
          {narrative}
        </div>
      </div>

      {/* RULES / THREAT LOGIC SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {structuredRules?.length > 0 ? (
          structuredRules.map((rule, idx) => (
            <div key={idx} className="bg-[#0a0c14]/80 border border-white/10 p-6 rounded-[2rem] hover:border-cyan-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <h5 className="font-roboto-condensed text-lg font-black text-white uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
                  {rule.name}
                </h5>
                <span className="font-jetbrains text-[8px] text-gray-600 bg-white/5 px-2 py-0.5 rounded">
                  RULE_ID: {idx.toString().padStart(3, '0')}
                </span>
              </div>
              
              {/* CONDITIONS CHIPS */}
              {rule.conditions?.ip?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {rule.conditions.ip.map(ip => (
                    <span key={ip} className="font-jetbrains text-[9px] font-bold text-red-400 bg-red-500/5 px-2.5 py-1 rounded-lg border border-red-500/20 uppercase tracking-tighter">
                      Target_IP :: {ip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-10 text-center opacity-20">
            <p className="font-jetbrains text-[10px] uppercase tracking-widest text-gray-400">
              No_Heuristic_Rules_Generated
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForensicView;