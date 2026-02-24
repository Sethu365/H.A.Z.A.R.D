import { motion } from "framer-motion";
import { useMemo } from "react";

const clamp = (v, min = 0, max = 100) => {
  // If value is not a number (like "--"), return 0 for the progress bar
  if (typeof v !== 'number' || isNaN(v)) return 0;
  return Math.min(max, Math.max(min, v));
};

const Gauge = ({
  label,
  value = 0,
  unit = "%",
  size = 140, // Slightly reduced to fit better in grids
  thickness = 10
}) => {
  const isOffline = typeof value !== 'number' || isNaN(value);
  const safeValue = clamp(value);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  // If offline, offset is full circumference (0 progress)
  const offset = circumference * (1 - safeValue / 100);

  const color = useMemo(() => {
    if (isOffline) return "#4b5563"; // gray-600 for offline
    if (safeValue >= 85) return "#ef4444"; // critical
    if (safeValue >= 70) return "#f97316"; // high
    if (safeValue >= 50) return "#eab308"; // medium
    return "#22c55e"; // healthy
  }, [safeValue, isOffline]);

  return (
    <div
      className={`
        bg-gray-900/40
        border border-gray-800/50
        rounded-2xl
        p-4
        flex flex-col items-center
        transition-opacity duration-500
        ${isOffline ? 'opacity-50' : 'opacity-100'}
      `}
    >
      {/* LABEL */}
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
        {label}
      </span>

      {/* GAUGE */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1f2937" // gray-800
            strokeWidth={thickness}
            fill="none"
          />

          {/* Progress */}
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
              duration: 1,
              ease: "circOut"
            }}
            style={{
              filter: isOffline ? 'none' : `drop-shadow(0 0 8px ${color}44)`
            }}
          />
        </svg>

        {/* CENTER VALUE */}
        <div className="absolute flex flex-col items-center">
          <span
            className={`font-bold tabular-nums tracking-tighter transition-colors duration-500 ${isOffline ? 'text-3xl' : 'text-2xl'}`}
            style={{ color: isOffline ? "#6b7280" : color }}
          >
            {isOffline ? "--" : `${safeValue.toFixed(0)}${unit}`}
          </span>
          <span className="text-[9px] font-medium text-gray-600 uppercase tracking-tighter mt-0.5">
            {isOffline ? "offline" : "utilization"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Gauge;