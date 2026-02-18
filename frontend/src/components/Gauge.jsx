import { motion } from "framer-motion";
import { useMemo } from "react";

const clamp = (v, min = 0, max = 100) =>
  Math.min(max, Math.max(min, v || 0));

const Gauge = ({
  label,
  value = 0,
  unit = "%",
  size = 160,
  thickness = 12
}) => {
  const safeValue = clamp(value);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safeValue / 100);

  const color = useMemo(() => {
    if (safeValue >= 85) return "#ef4444"; // critical
    if (safeValue >= 70) return "#f97316"; // high
    if (safeValue >= 50) return "#eab308"; // medium
    return "#22c55e"; // healthy
  }, [safeValue]);

  return (
    <div
      className="
        bg-gray-900/60
        border border-gray-800
        rounded-xl
        p-6
        flex flex-col items-center
      "
    >
      {/* LABEL */}
      <span className="text-xs uppercase tracking-wide text-gray-400 mb-3">
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
            stroke="#374151"
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
            initial={false}
            transition={{
              duration: 0.6,
              ease: "easeOut"
            }}
            style={{
              filter: `drop-shadow(0 0 6px ${color}55)`
            }}
          />
        </svg>

        {/* CENTER VALUE */}
        <div className="absolute flex flex-col items-center">
          <span
            className="text-3xl font-semibold tabular-nums"
            style={{ color }}
          >
            {safeValue.toFixed(0)}
            {unit}
          </span>
          <span className="text-[11px] text-gray-500 mt-1">
            utilization
          </span>
        </div>
      </div>
    </div>
  );
};

export default Gauge;
