import React from "react";

const MiniAreaChart = ({
  data = [],
  width = 60,
  height = 20,
  color = "#22c55e",
  label = ""
}) => {
  if (!data.length) return null;

  const max = Math.max(...data, 1);
  const latest = data[data.length - 1]?.toFixed(1);

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
    <svg width={width} height={height} className="cursor-pointer">
      {/* Tooltip */}
      <title>
        {label}: {latest}%
      </title>

      <path d={areaPath} fill={`${color}33`} />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default MiniAreaChart;
