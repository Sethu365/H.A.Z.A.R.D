import React, { useState, useEffect } from "react";

const MiniAreaChart = ({
  data = [],
  color = "#22c55e",
  label = ""
}) => {
  // 1. Responsive size logic
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth < 640 ? 80 : 60,
    height: window.innerWidth < 640 ? 24 : 20
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth < 640 ? 80 : 60,
        height: window.innerWidth < 640 ? 24 : 20
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { width, height } = dimensions;

  if (!data.length) return (
    <div style={{ width, height }} className="opacity-10 border border-white/10 rounded-sm" />
  );

  const max = Math.max(...data, 1);
  const latest = data[data.length - 1]?.toFixed(1);

  // Normalize points for the SVG viewBox
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  });

  const areaPath = `
    M 0,${height}
    L ${points.join(" L ")}
    L ${width},${height}
    Z
  `;

  return (
    <div className="flex flex-col items-center gap-1 group font-inter">
      <svg 
        width={width} 
        height={height} 
        className="overflow-visible transition-transform duration-300 group-hover:scale-110"
      >
        <title>
          {label}: {latest}%
        </title>

        {/* Neural Glow Area */}
        <path 
          d={areaPath} 
          fill={`url(#gradient-${color.replace('#', '')})`}
          className="transition-opacity duration-500 group-hover:opacity-80"
        />

        {/* Pulse Line */}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={window.innerWidth < 640 ? "1.8" : "1.4"}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 3px ${color}66)` }}
        />

        {/* Gradient Definition */}
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Mobile-friendly percentage label - JetBrains Mono */}
      <span className="hidden group-hover:block absolute -top-4 text-[8px] font-black font-jetbrains text-white bg-black/80 px-1 rounded border border-white/10 tabular-nums">
        {latest}%
      </span>
    </div>
  );
};

export default MiniAreaChart;