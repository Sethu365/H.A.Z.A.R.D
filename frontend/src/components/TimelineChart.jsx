import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const TimelineChart = ({ data = [] }) => {
  // Map DB rows → chart-friendly format
 const chartData = data.map((row) => ({
  time: row.created_at
    ? new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "N/A",
  cpu: parseFloat(row.cpu_usage) || 0,
  memory: parseFloat(row.memory_usage) || 0,
  network: parseFloat(row.network_traffic) || 0,
  risk: parseFloat(row.risk_score) || 0,
}));


  return (
    <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">
        System Metrics Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="time" stroke="#aaa" />
          <YAxis stroke="#aaa" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              color: "#fff",
            }}
          />
          <Line
            type="monotone"
            dataKey="cpu"
            stroke="#facc15"
            strokeWidth={2}
            dot={false}
            name="CPU %"
          />
          <Line
            type="monotone"
            dataKey="memory"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            name="Memory %"
          />
          <Line
            type="monotone"
            dataKey="network"
            stroke="#a855f7"
            strokeWidth={2}
            dot={false}
            name="Network MB"
          />
          <Line
            type="monotone"
            dataKey="risk"
            stroke="#ec4899"
            strokeWidth={2}
            dot={false}
            name="Risk Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimelineChart;
