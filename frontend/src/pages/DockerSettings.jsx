import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Server, Activity, Terminal } from "lucide-react";

import Gauge from "../components/Gauge";
import TimelineChart from "../components/TimelineChart";
import MiniAreaChart from "../components/MiniAreaChart";

const API_BASE = "http://172.24.16.81:8001";
const POLL_INTERVAL = 3000;

const DockerSettings = () => {
  const [aggregate, setAggregate] = useState({
    cpu_percent: 0,
    memory_percent: 0,
  });

  const [containers, setContainers] = useState([]);
  const [containerStats, setContainerStats] = useState([]);

  const [timeline, setTimeline] = useState([]);
  const [containerTimeline, setContainerTimeline] = useState({});
  const [containerMemTimeline, setContainerMemTimeline] = useState({});

  const [logs, setLogs] = useState("");
  const [selectedContainer, setSelectedContainer] = useState(null);

  const mounted = useRef(false);

  /* ==============================
     LOAD DATA
  ============================== */
  const loadData = async () => {
    try {
      const [aggRes, contRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/docker/stats/aggregate`),
        axios.get(`${API_BASE}/docker/containers`),
        axios.get(`${API_BASE}/docker/stats`)
      ]);

      setAggregate(aggRes.data);
      setContainers(contRes.data);
      setContainerStats(statsRes.data);

      // CPU TIMELINE (per container)
      setContainerTimeline((prev) => {
        const updated = { ...prev };
        statsRes.data.forEach((s) => {
          if (!updated[s.name]) updated[s.name] = [];
          updated[s.name] = [...updated[s.name], s.cpu_percent || 0].slice(-20);
        });
        return updated;
      });

      // MEMORY TIMELINE (per container)
      setContainerMemTimeline((prev) => {
        const updated = { ...prev };
        statsRes.data.forEach((s) => {
          const memPercent =
            s.memory_limit_mb
              ? (s.memory_usage_mb / s.memory_limit_mb) * 100
              : 0;

          if (!updated[s.name]) updated[s.name] = [];
          updated[s.name] = [...updated[s.name], memPercent].slice(-20);
        });
        return updated;
      });

      // CLUSTER TIMELINE
      setTimeline((prev) => {
        const next = [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            cpu: aggRes.data.cpu_percent,
            memory: aggRes.data.memory_percent,
          },
        ];
        return next.slice(-30);
      });

    } catch (err) {
      console.error("❌ Docker fetch failed", err);
    }
  };

  /* ==============================
     EFFECTS
  ============================== */
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    mounted.current = true;
  }, []);

  /* ==============================
     ACTIONS
  ============================== */
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

  /* ==============================
     RENDER
  ============================== */
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

      {/* TIMELINE + GAUGES */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-gray-900/60 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
            <Activity className="w-4 h-4 text-cyan-400" />
            Docker Resource Timeline
          </div>
          <TimelineChart data={timeline} />
        </div>

        <div className="flex flex-col gap-6">
          <Gauge label="Cluster CPU Utilization" value={aggregate.cpu_percent} />
          <Gauge label="Cluster Memory Utilization" value={aggregate.memory_percent} />
        </div>
      </div>

      {/* CONTAINERS */}
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

        <div className="space-y-2">
          {containers.map((c) => (
            <div
              key={c.id}
              className="
                flex items-center justify-between
                px-4 py-3
                rounded-lg
                border border-gray-800
                bg-gray-900/40
                hover:bg-gray-900/70
                transition
              "
            >
              {/* LEFT */}
              <div className="flex items-start gap-3 min-w-0">
                <i className="bi bi-chevron-right text-cyan-400"></i>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {c.name}
                  </p>
                  <p
                    className={`text-xs ${
                      c.status === "running"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {c.status === "running" ? "Running" : "Stopped"}
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-4">
              {c.status === "running" && (
                <div className="flex items-center gap-2">
                  {/* CPU */}
                  <MiniAreaChart
                    data={containerTimeline[c.name] || []}
                    color="#22c55e"
                    label="CPU Usage"
                  />

                  {/* RAM */}
                  <MiniAreaChart
                    data={containerMemTimeline[c.name] || []}
                    color="#3b82f6"
                    label="RAM Usage"
                  />
                </div>
              )}


                <button
                  onClick={() => toggleContainer(c)}
                  className={`text-xs px-2 py-1 rounded border
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
                    text-xs px-2 py-1 rounded
                    border border-cyan-500/30
                    text-cyan-400
                    hover:bg-cyan-500/10
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
            className="bg-gray-900 border border-gray-800 rounded-xl w-11/12 max-w-5xl h-[70vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Logs — {selectedContainer}
              </div>
              <i
                className="bi bi-x-circle text-gray-400 hover:text-white cursor-pointer"
                onClick={() => {
                  setSelectedContainer(null);
                  setLogs("");
                }}
              ></i>
            </div>

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
