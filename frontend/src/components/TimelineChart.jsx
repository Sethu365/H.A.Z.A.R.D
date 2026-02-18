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
  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">
        No time-series data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
      >
        {/* GRID */}
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1f2937"
        />

        {/* X AXIS */}
        <XAxis
          dataKey="time"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#374151" }}
          minTickGap={24}
        />

        {/* Y AXIS */}
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

        {/* TOOLTIP */}
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

        {/* CPU LINE */}
        <Line
          type="monotone"
          dataKey="cpu"
          name="CPU"
          stroke="#facc15"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />

        {/* MEMORY LINE */}
        <Line
          type="monotone"
          dataKey="memory"
          name="Memory"
          stroke="#4ade80"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TimelineChart;
