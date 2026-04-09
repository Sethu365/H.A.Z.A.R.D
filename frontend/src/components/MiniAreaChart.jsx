import React, { useState, useEffect } from "react";

const MiniAreaChart = ({
  data = [],
  color = "#22c55e",
  label = ""
}) => {
  // 1. Responsive size logic optimized for high-density mobile grids
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth < 640 ? 70 : 60,
    height: window.innerWidth < 640 ? 22 : 18
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth < 640 ? 70 : 60,
        height: window.innerWidth < 640 ? 22 : 18
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { width, height } = dimensions;

  if (!data.length) return (
    <div style={{ width, height }} className="opacity-5 border border-white/5 rounded-sm bg-white/5 animate-pulse" />
  );

  const max = Math.max(...data, 1);
  const latest = data[data.length - 1]?.toFixed(1);

  // Normalize points for the SVG viewBox with safety margins
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - ((v / max) * (height - 2)) - 1; // 1px padding to prevent clipping
    return `${x},${y}`;
  });

  const areaPath = `
    M 0,${height}
    L ${points.join(" L ")}
    L ${width},${height}
    Z
  `;

  const gradientId = `gradient-${color.replace('#', '')}`;

  return (
    <div className="flex flex-col items-center gap-1 group font-inter relative">
      <svg 
        width={width} 
        height={height} 
        className="overflow-visible transition-all duration-500 group-hover:brightness-125"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Surgical Area Fill */}
        <path 
          d={areaPath} 
          fill={`url(#${gradientId})`}
          className="transition-opacity duration-700 opacity-60 group-hover:opacity-100"
        />

        {/* Telemetry Pulse Line */}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={window.innerWidth < 640 ? "1.6" : "1.2"}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ 
            filter: `drop-shadow(0 0 4px ${color}88)`,
            transition: 'all 0.3s ease'
          }}
        />
      </svg>
      
      {/* Glossy Tooltip - JetBrains Mono + Glassmorphism */}
      <div className="opacity-0 group-hover:opacity-100 absolute -top-6 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100">
        <div className="bg-[#020617]/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <span className="text-[7px] font-black font-jetbrains text-white tabular-nums tracking-tighter">
            {latest}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default MiniAreaChart;