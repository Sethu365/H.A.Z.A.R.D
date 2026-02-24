import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TimelineAreaChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">
        No time-series data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
      >
        {/* GRADIENT DEFINITIONS */}
        <defs>
          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />

        <XAxis
          dataKey="time"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#374151" }}
          minTickGap={24}
        />

        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#374151" }}
          width={40}
          label={{
            value: "Utilization (%)",
            angle: -90,
            position: "insideLeft",
            fill: "#9ca3af",
            fontSize: 11,
          }}
        />

        <Tooltip
          cursor={{ stroke: "#374151", strokeDasharray: "3 3" }}
          contentStyle={{
            backgroundColor: "#020617",
            border: "1px solid #374151",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{
            color: "#9ca3af",
            marginBottom: 4,
          }}
        />

        {/* CPU AREA */}
        <Area
          type="monotone"
          dataKey="cpu"
          name="CPU"
          stroke="#f59e0b"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCpu)"
          isAnimationActive={false}
        />

        {/* MEMORY AREA */}
        <Area
          type="monotone"
          dataKey="memory"
          name="Memory"
          stroke="#a855f7"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorMemory)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default TimelineAreaChart;