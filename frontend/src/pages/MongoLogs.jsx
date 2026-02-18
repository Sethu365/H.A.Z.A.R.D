import React, { useEffect, useState, useRef } from "react";
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
import { Database, Activity } from "lucide-react";

const API_BASE = "http://172.24.16.81:8001";
const DB_NAME = "security_events_test";
const COLLECTION = "events";

const MongoLogs = () => {
  const [logs, setLogs] = useState([]);
  const [rateData, setRateData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);
  const mounted = useRef(false);

  /* -------- Fetch logs -------- */
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/mongo/collection-data`, {
        params: { db: DB_NAME, coll: COLLECTION, limit, offset }
      });
      setLogs(res.data.data || []);
    } catch (e) {
      console.error("Mongo logs fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  /* -------- Fetch ingestion rate -------- */
  const fetchRate = async () => {
    try {
      const res = await axios.get(`${API_BASE}/mongo/ingestion-rate`, {
        params: { db: DB_NAME, coll: COLLECTION, minutes: 8640 }
      });
      setRateData(res.data || []);
    } catch (e) {
      console.error("Ingestion rate fetch failed", e);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchRate();
  }, [limit, offset]);

  useEffect(() => {
    mounted.current = true;
  }, []);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          MongoDB Event Logs
        </h1>
        <p className="text-sm text-gray-400">
          Persisted security telemetry and raw event payloads
        </p>
      </div>

      {/* INGESTION RATE */}
      <motion.div
        initial={mounted.current ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="
          bg-gray-900/60
          border border-gray-800
          rounded-xl
          p-6
          h-64
        "
      >
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-300">
          <Activity className="w-4 h-4 text-cyan-400" />
          Ingestion Rate (events / minute)
        </div>

        {rateData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            No ingestion data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rateData}>
              <XAxis
                dataKey="time"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickFormatter={(t) =>
                  new Date(t).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                }
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
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
      </motion.div>

      {/* CONTROLS */}
      <div className="flex items-center gap-3 text-sm text-gray-300">
        Rows per page:
        <select
          value={limit}
          onChange={(e) => {
            setOffset(0);
            setLimit(Number(e.target.value));
          }}
          className="bg-gray-900 border border-gray-700 rounded-md px-2 py-1"
        >
          {[25, 50, 100, 250].map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* LOG TABLE */}
      <motion.div
        initial={mounted.current ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="
          bg-gray-900/60
          border border-gray-800
          rounded-xl
          overflow-hidden
        "
      >
        {loading ? (
          <div className="p-6 text-gray-400">
            Loading logs…
          </div>
        ) : (
          <div className="max-h-[65vh] overflow-auto">
            <table className="w-full text-sm text-gray-300">
              <thead className="bg-gray-900 sticky top-0 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">Event Time</th>
                  <th className="px-4 py-3 text-left">Hostname</th>
                  <th className="px-4 py-3 text-left">Payload</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((row, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/40">
                      <td className="px-4 py-2 whitespace-nowrap">
                        {row.event_time
                          ? new Date(
                              row.event_time.$date || row.event_time
                            ).toLocaleString()
                          : "—"}
                      </td>

                      <td className="px-4 py-2">
                        {row.hostname || "unknown"}
                      </td>

                      <td
                        className="px-4 py-2 text-cyan-400 text-xs cursor-pointer hover:underline"
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
                          <pre className="text-xs text-gray-300 font-mono max-h-[400px] overflow-auto">
                            {JSON.stringify(row, null, 2)}
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
      </motion.div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center text-sm">
        <button
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - limit))}
          className="
            px-3 py-1 rounded-md
            bg-gray-800 border border-gray-700
            disabled:opacity-40
            hover:bg-gray-700/40
          "
        >
          Previous
        </button>

        <span className="text-gray-400">
          Offset: {offset}
        </span>

        <button
          onClick={() => setOffset(offset + limit)}
          className="
            px-3 py-1 rounded-md
            bg-gray-800 border border-gray-700
            hover:bg-gray-700/40
          "
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default MongoLogs;
