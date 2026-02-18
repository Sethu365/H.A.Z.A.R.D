import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const API_BASE = "http://172.24.16.81:8001";

const TimescaleLogs = () => {
  /* ---------------- STATE ---------------- */
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);

  /* ---------------- FETCH LOGS ---------------- */
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/timescale/logs?limit=${limit}&offset=${offset}`
      );
      setLogs(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch Timescale logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [limit, offset]);

  /* ---------------- BUILD EVENT RATE ---------------- */
  const buildRateData = (logs) => {
    const buckets = {};

    logs.forEach((row) => {
      if (!row.event_time) return;

      const t = new Date(row.event_time);
      t.setSeconds(0, 0); // bucket per minute
      const key = t.getTime();

      buckets[key] = (buckets[key] || 0) + 1;
    });

    return Object.entries(buckets)
      .map(([time, count]) => ({
        time: Number(time),
        count
      }))
      .sort((a, b) => a.time - b.time);
  };

  const rateData = buildRateData(logs);

  /* ---------------- RENDER ---------------- */
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          TimescaleDB Logs
        </h1>
        <p className="text-gray-400">
          Security events stored in TimescaleDB
        </p>
      </div>

      {/* EVENT RATE CHART */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 h-64">
        <h3 className="text-lg font-semibold text-white mb-3">
          Event Rate (events / minute)
        </h3>

        {rateData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rateData}>
              <XAxis
                dataKey="time"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                tickFormatter={(t) =>
                  new Date(t).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                }
              />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "8px"
                }}
                labelFormatter={(l) =>
                  new Date(l).toLocaleTimeString()
                }
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* CONTROLS */}
      <div className="flex items-center gap-4 text-sm text-gray-300">
        <span>Rows:</span>
        <select
          value={limit}
          onChange={(e) => {
            setOffset(0);
            setLimit(Number(e.target.value));
          }}
          className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1"
        >
          {[25, 50, 100, 250].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-400">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-gray-400">No logs found</div>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto overflow-x-auto">
            <table className="w-full text-sm text-gray-300">
              <thead className="bg-gray-900/70 border-b border-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-400">
                    Event Time
                  </th>
                  <th className="px-4 py-3 text-left text-gray-400">
                    Hostname
                  </th>
                  <th className="px-4 py-3 text-left text-gray-400">
                    Raw Event
                  </th>
                </tr>
              </thead>

              <tbody>
                {logs.map((row, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="px-4 py-2 whitespace-nowrap">
                        {row.event_time
                          ? new Date(row.event_time).toLocaleString()
                          : "—"}
                      </td>

                      <td className="px-4 py-2 text-gray-200">
                        {row.hostname || "unknown"}
                      </td>

                      <td
                        className="px-4 py-2 text-cyan-400 text-xs cursor-pointer hover:text-cyan-300"
                        onClick={() =>
                          setExpandedRow(expandedRow === idx ? null : idx)
                        }
                      >
                        {expandedRow === idx ? "Hide JSON" : "View JSON"}
                      </td>
                    </tr>

                    {expandedRow === idx && (
                      <tr className="bg-black/70">
                        <td colSpan={3} className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-400">
                              Raw JSON Payload
                            </span>
                            <button
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  JSON.stringify(
                                    row.original_payload,
                                    null,
                                    2
                                  )
                                )
                              }
                              className="text-xs text-cyan-400 hover:text-cyan-300"
                            >
                              Copy JSON
                            </button>
                          </div>

                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono max-h-[400px] overflow-auto">
                            {JSON.stringify(
                              row.original_payload,
                              null,
                              2
                            )}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between text-sm">
        <button
          disabled={offset === 0}
          onClick={() =>
            setOffset(Math.max(0, offset - limit))
          }
          className="px-3 py-1 rounded-md bg-gray-700/50 border border-gray-600 disabled:opacity-40"
        >
          Previous
        </button>

        <span className="text-gray-400">
          Offset: {offset}
        </span>

        <button
          onClick={() => setOffset(offset + limit)}
          className="px-3 py-1 rounded-md bg-gray-700/50 border border-gray-600"
        >
          Next
        </button>
      </div>
    </motion.div>
  );
};

export default TimescaleLogs;
