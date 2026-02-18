import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import Gauge from "../components/Gauge";
import { Server, Activity, Terminal } from "lucide-react";

const API_BASE = "http://172.24.16.81:8001";
const POLL_INTERVAL = 3000;

const DockerSettings = () => {
  const [aggregate, setAggregate] = useState({
    cpu_percent: 0,
    memory_percent: 0,
  });

  const [containers, setContainers] = useState([]);
  const [logs, setLogs] = useState("");
  const [selectedContainer, setSelectedContainer] = useState(null);
  const mounted = useRef(false);

  const loadData = async () => {
    try {
      const [aggRes, contRes] = await Promise.all([
        axios.get(`${API_BASE}/docker/stats/aggregate`),
        axios.get(`${API_BASE}/docker/containers`)
      ]);
      setAggregate(aggRes.data);
      setContainers(contRes.data);
    } catch (err) {
      console.error("❌ Docker fetch failed", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    mounted.current = true;
  }, []);

  /* ---------- Actions ---------- */
  const toggleContainer = async (c) => {
    try {
      if (c.status === "running") {
        await axios.post(`${API_BASE}/docker/stop/${c.name}`);
      } else {
        await axios.post(`${API_BASE}/docker/start/${c.name}`);
      }
      loadData();
    } catch (err) {
      console.error("Container action failed", err);
    }
  };

  const viewLogs = async (name) => {
    try {
      const res = await axios.get(`${API_BASE}/docker/logs/${name}`);
      setSelectedContainer(name);
      setLogs(res.data.logs || "");
    } catch {
      setLogs("Failed to load logs");
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Docker Runtime Control
        </h1>
        <p className="text-sm text-gray-400">
          Monitor and manage container workloads
        </p>
      </div>

      {/* AGGREGATE METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Gauge label="Cluster CPU Utilization" value={aggregate.cpu_percent} />
        <Gauge label="Cluster Memory Utilization" value={aggregate.memory_percent} />
      </div>

      {/* CONTAINER LIST */}
      <motion.div
        initial={mounted.current ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-900/60 border border-gray-800 rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-300">
          <Server className="w-4 h-4 text-cyan-400" />
          Containers
        </div>

        <div className="space-y-3">
          {containers.map((c) => (
            <div
              key={c.id}
              className="
                flex items-center justify-between
                bg-gray-900/50
                border border-gray-800
                rounded-lg
                px-4 py-3
              "
            >
              {/* INFO */}
              <div>
                <p className="text-white font-medium">
                  {c.name}
                </p>
                <p className="text-xs text-gray-400">
                  Status:{" "}
                  <span
                    className={
                      c.status === "running"
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {c.status}
                  </span>
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleContainer(c)}
                  className={`
                    px-3 py-1 text-xs rounded-md border transition
                    ${
                      c.status === "running"
                        ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                        : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                    }
                  `}
                >
                  {c.status === "running" ? "Stop" : "Start"}
                </button>

                <button
                  onClick={() => viewLogs(c.name)}
                  className="
                    px-3 py-1 text-xs rounded-md
                    border border-cyan-500/30
                    text-cyan-400
                    hover:bg-cyan-500/10
                    transition
                  "
                >
                  Logs
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* LOG VIEWER */}
      {selectedContainer && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="
              bg-gray-900
              border border-gray-800
              rounded-xl
              w-11/12 max-w-5xl
              h-[70vh]
              flex flex-col
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Logs — {selectedContainer}
              </div>
              <button
                onClick={() => {
                  setSelectedContainer(null);
                  setLogs("");
                }}
                className="text-xs text-gray-400 hover:text-white"
              >
                Close ✕
              </button>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-auto p-4 bg-black">
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                {logs || "No logs available"}
              </pre>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DockerSettings;
