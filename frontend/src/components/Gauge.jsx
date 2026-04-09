import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";

const clamp = (v, min = 0, max = 100) => {
  if (typeof v !== 'number' || isNaN(v)) return 0;
  return Math.min(max, Math.max(min, v));
};

const Gauge = ({
  label,
  value = 0,
  unit = "%",
  thickness = 8 // Reverted to original thickness for that solid look
}) => {
  // REVERTED: Size is back to your original 140px, scaling down to 110px on mobile
  const [size, setSize] = useState(window.innerWidth < 640 ? 110 : 140);

  useEffect(() => {
    const handleResize = () => setSize(window.innerWidth < 640 ? 110 : 140);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isOffline = typeof value !== 'number' || isNaN(value);
  const safeValue = clamp(value);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safeValue / 100);

  const color = useMemo(() => {
    if (isOffline) return "#4b5563"; 
    if (safeValue >= 85) return "#ef4444"; 
    if (safeValue >= 70) return "#f97316"; 
    if (safeValue >= 50) return "#eab308"; 
    return "#22c55e"; 
  }, [safeValue, isOffline]);

  return (
    <div
      className={`
        relative
        bg-white/[0.03]
        backdrop-blur-xl
        border border-white/10
        rounded-[2rem]
        p-5 md:p-6
        flex flex-col items-center justify-center
        transition-all duration-500
        w-full
        font-inter
        ${isOffline ? 'opacity-40' : 'opacity-100 shadow-2xl'}
      `}
    >
      {/* Glossy top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* LABEL - Reverted to original spacing */}
      <span className="font-roboto-condensed text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-5 text-center">
        {label}
      </span>

      {/* GAUGE CONTAINER */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90 filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={thickness}
            fill="none"
          />

          {/* Neural Progress Path */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            initial={{ strokeDashoffset: circumference }}
            transition={{
              duration: 1.5,
              ease: [0.16, 1, 0.3, 1] 
            }}
            style={{
              filter: isOffline ? 'none' : `drop-shadow(0 0 12px ${color}88)`
            }}
          />
        </svg>

        {/* CENTER TELEMETRY READOUT */}
        <div className="absolute flex flex-col items-center">
          <motion.span
            key={safeValue} 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`font-jetbrains font-black tabular-nums tracking-tighter transition-colors duration-500
              ${isOffline ? 'text-xl' : 'text-2xl md:text-4xl'}
            `}
            style={{ color: isOffline ? "#6b7280" : "white" }}
          >
            {isOffline ? "--" : `${safeValue.toFixed(0)}${unit}`}
          </motion.span>
          
          <span className={`font-roboto-condensed text-[7px] md:text-[8px] font-black uppercase tracking-widest mt-1
            ${isOffline ? 'text-gray-600' : 'text-cyan-500/60'}
          `}>
            {isOffline ? "link_lost" : "utilization"}
          </span>
        </div>
      </div>
      
      {/* Decorative corners for mobile only to keep the forensic vibe */}
      <div className="absolute top-4 left-4 w-1.5 h-1.5 border-t border-l border-white/10 md:hidden" />
      <div className="absolute bottom-4 right-4 w-1.5 h-1.5 border-b border-r border-white/10 md:hidden" />
    </div>
  );
};

export default Gauge;