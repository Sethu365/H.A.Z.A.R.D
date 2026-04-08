// ForensicView.jsx - UPDATED WITH SAFETY GUARDS

const ForensicView = ({ rawData }) => {
  // 1. Ensure rawData exists before parsing
  if (!rawData) return null;

  const jsonRegex = /```json\n([\s\S]*?)\n```/;
  const match = rawData.match(jsonRegex);
  
  // 2. Add a fallback if the JSON is malformed or missing
  let structuredRules = [];
  try {
    structuredRules = match ? JSON.parse(match[1]).rules : [];
  } catch (e) {
    console.error("Failed to parse forensic JSON", e);
  }

  const narrative = rawData.split('=====================')[0];

  return (
    <div className="space-y-10 font-inter">
      {/* NARRATIVE SECTION */}
      <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md">
        <div className="flex items-center gap-3 mb-6 border-l-2 border-cyan-500 pl-4">
           <h3 className="font-roboto-condensed text-[13px] font-black uppercase text-gray-400 tracking-[0.3em]">Neural_Context_Analysis</h3>
        </div>
        <div className="font-jetbrains text-[15px] leading-relaxed text-gray-400 whitespace-pre-wrap">
          {narrative}
        </div>
      </div>

      {/* RULES SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {structuredRules?.map((rule, idx) => (
          <div key={idx} className="bg-[#0a0c14] border border-white/10 p-6 rounded-[2rem]">
            <h5 className="font-roboto-condensed text-xl font-black text-white uppercase mb-2">{rule.name}</h5>
            
            {/* SAFETY CHECK: Use rule.conditions?.ip?.length instead of rule.conditions.ip.length */}
            {rule.conditions?.ip?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {rule.conditions.ip.map(ip => (
                  <span key={ip} className="font-jetbrains text-[9px] font-bold text-red-400 bg-red-500/5 px-2 py-1 rounded border border-red-500/20 italic">
                    Target_IP: {ip}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForensicView;