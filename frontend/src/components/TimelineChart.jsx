import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TimelineChart = ({ data = [] }) => {
  // 1. Responsive State to adjust layout for mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-700 italic border border-dashed border-white/5 rounded-2xl">
        Buffer_Empty // Awaiting_Link
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        // 2. Tighter margins for mobile to utilize every pixel
        margin={{ 
          top: 10, 
          right: isMobile ? 5 : 15, 
          left: isMobile ? -35 : -15, 
          bottom: 0 
        }}
      >
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="rgba(255, 255, 255, 0.03)"
        />

        <XAxis
          dataKey="time"
          tick={{ fill: "#4b5563", fontSize: 8, fontWeight: 800 }}
          tickLine={false}
          axisLine={false}
          minTickGap={isMobile ? 40 : 30}
          interval="preserveStartEnd"
        />

        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#4b5563", fontSize: 8, fontWeight: 800 }}
          tickLine={false}
          axisLine={false}
          // 3. Hide YAxis values on mobile to give room to the graph lines
          hide={isMobile}
        />

        <Tooltip
          cursor={{ stroke: "rgba(6, 182, 212, 0.2)", strokeWidth: 1 }}
          // 4. Fixed position for tooltip on mobile so it doesn't jump
          position={isMobile ? { y: 0 } : undefined}
          contentStyle={{
            backgroundColor: "rgba(2, 6, 23, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            backdropFilter: "blur(12px)",
            fontSize: "10px",
            color: "#fff",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            padding: "8px 12px"
          }}
          itemStyle={{ padding: "0" }}
          labelStyle={{
            color: "#9ca3af",
            marginBottom: "6px",
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            fontSize: "8px"
          }}
        />

        <Line
          type="monotone"
          dataKey="cpu"
          name="CPU_Load"
          stroke="#06b6d4" 
          strokeWidth={isMobile ? 1.5 : 2.5}
          dot={false}
          isAnimationActive={false} // Disabled for smoother real-time feel
          style={{ filter: "drop-shadow(0px 0px 8px rgba(6, 182, 212, 0.6))" }}
        />

        <Line
          type="monotone"
          dataKey="memory"
          name="MEM_Usage"
          stroke="#a855f7" 
          strokeWidth={isMobile ? 1.5 : 2.5}
          dot={false}
          isAnimationActive={false}
          style={{ filter: "drop-shadow(0px 0px 8px rgba(168, 85, 247, 0.6))" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TimelineChart;