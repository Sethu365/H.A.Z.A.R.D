import React from "react";
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
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-700 italic border border-dashed border-white/5 rounded-2xl">
        Buffer empty // Awaiting telemetry
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
      >
        {/* Subtle Grid - dark to keep focus on lines */}
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="rgba(255, 255, 255, 0.03)"
        />

        {/* X AXIS - Time data */}
        <XAxis
          dataKey="time"
          tick={{ fill: "#4b5563", fontSize: 9, fontWeight: 700 }}
          tickLine={false}
          axisLine={false}
          minTickGap={30}
          interval="preserveStartEnd"
        />

        {/* Y AXIS - 0-100% scale */}
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#4b5563", fontSize: 9, fontWeight: 700 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />

        {/* Tactical Tooltip */}
        <Tooltip
          cursor={{ stroke: "rgba(6, 182, 212, 0.2)", strokeWidth: 1 }}
          contentStyle={{
            backgroundColor: "rgba(2, 6, 23, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            backdropFilter: "blur(8px)",
            fontSize: "10px",
            color: "#fff",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
          }}
          itemStyle={{ padding: "2px 0" }}
          labelStyle={{
            color: "#6b7280",
            marginBottom: "4px",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.1em"
          }}
        />

        {/* CPU LINE - Cyan Glow */}
        <Line
          type="monotone"
          dataKey="cpu"
          name="CPU Load"
          stroke="#06b6d4" 
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={true}
          animationDuration={500}
          // Adds a subtle glow effect to the line
          style={{ filter: "drop-shadow(0px 0px 6px rgba(6, 182, 212, 0.4))" }}
        />

        {/* MEMORY LINE - Purple Glow */}
        <Line
          type="monotone"
          dataKey="memory"
          name="MEM Usage"
          stroke="#a855f7" 
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={true}
          animationDuration={500}
          // Adds a subtle glow effect to the line
          style={{ filter: "drop-shadow(0px 0px 6px rgba(168, 85, 247, 0.4))" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TimelineChart;