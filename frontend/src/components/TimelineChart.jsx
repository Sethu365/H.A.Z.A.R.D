import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

const TimelineChart = ({ data = [] }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="font-roboto-condensed h-full flex items-center justify-center text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 bg-white/[0.01] border border-dashed border-white/10 rounded-[2rem]">
        Buffer_Empty // Awaiting_Telemetry
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" className="font-inter">
      <LineChart
        data={data}
        margin={{ 
          top: 15, 
          right: isMobile ? 10 : 25, 
          left: isMobile ? -30 : -10, 
          bottom: 5 
        }}
      >
        {/* GLOSSY GRID */}
        <CartesianGrid
          vertical={false}
          strokeDasharray="4 4"
          stroke="rgba(255, 255, 255, 0.05)"
        />

        <XAxis
          dataKey="time"
          tick={{ fill: "#64748b", fontSize: 8, fontWeight: 900, fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={false}
          minTickGap={isMobile ? 50 : 40}
          interval="preserveStartEnd"
          dy={10}
        />

        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#64748b", fontSize: 8, fontWeight: 900, fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={false}
          hide={isMobile}
        />

        <Tooltip
          cursor={{ stroke: "rgba(34, 211, 238, 0.2)", strokeWidth: 1 }}
          position={isMobile ? { y: -20 } : undefined}
          contentStyle={{
            backgroundColor: "rgba(2, 6, 23, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "16px",
            backdropFilter: "blur(20px)",
            fontSize: "10px",
            color: "#fff",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
            padding: "10px 14px",
            fontFamily: 'JetBrains Mono'
          }}
          itemStyle={{ padding: "2px 0" }}
          labelStyle={{
            color: "#64748b",
            marginBottom: "8px",
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            fontSize: "7px",
            fontFamily: 'Roboto Condensed'
          }}
        />

        {/* CPU LINE - GLOSSY CYAN */}
        <Line
          type="monotone"
          dataKey="cpu"
          name="CPU"
          stroke="#22d3ee" 
          strokeWidth={isMobile ? 2 : 3}
          dot={false}
          isAnimationActive={true}
          animationDuration={1000}
          style={{ 
            filter: `drop-shadow(0px 0px 10px rgba(34, 211, 238, 0.5))` 
          }}
        />

        {/* MEMORY LINE - GLOSSY PURPLE */}
        <Line
          type="monotone"
          dataKey="memory"
          name="MEM"
          stroke="#a855f7" 
          strokeWidth={isMobile ? 2 : 3}
          dot={false}
          isAnimationActive={true}
          animationDuration={1000}
          style={{ 
            filter: `drop-shadow(0px 0px 10px rgba(168, 85, 247, 0.5))` 
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TimelineChart;