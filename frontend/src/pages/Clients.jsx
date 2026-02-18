import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Gauge from "../components/Gauge";
import { useNavigate } from "react-router-dom";

const API_URL = "http://172.24.16.81:8001/client/metrics";
const POLL_INTERVAL_MS = 1000;

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const hasMounted = useRef(false);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        // Keep only latest metric per hostname
        const latestByHost = {};
        data.forEach(m => {
          if (
            !latestByHost[m.hostname] ||
            new Date(m.timestamp) >
              new Date(latestByHost[m.hostname].timestamp)
          ) {
            latestByHost[m.hostname] = m;
          }
        });

        // 🔒 CRITICAL: enforce stable order
        const sortedClients = Object.values(latestByHost).sort(
          (a, b) => a.hostname.localeCompare(b.hostname)
        );

        setClients(sortedClients);
      } catch (err) {
        console.error("❌ Failed to load client metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Connected Clients
        </h1>
        <p className="text-sm text-gray-400">
          Live CPU and memory telemetry from registered agents
        </p>
      </div>

      {/* CLIENT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {clients.map(client => (
          <motion.div
            key={client.hostname}
            initial={
              hasMounted.current
                ? false
                : { opacity: 0, y: 16 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="
              bg-gray-900/60
              border border-gray-800
              rounded-xl
              p-6
              flex flex-col
            "
          >
            {/* HOST HEADER */}
            <div className="mb-4">
              <h2 className="text-lg font-medium text-white">
                {client.hostname}
              </h2>
              <p className="text-xs text-gray-500">
                Last seen{" "}
                {new Date(client.timestamp).toLocaleTimeString()}
              </p>
            </div>

            {/* GAUGES */}
            <div className="grid grid-cols-2 gap-4">
              <Gauge label="CPU Utilization" value={client.cpu} />
              <Gauge label="Memory Utilization" value={client.ram} />
            </div>

            {/* FOOTER */}
            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={() =>
                  navigate(`/clients/${client.hostname}`)
                }
                className="
                  text-sm
                  text-cyan-400
                  border border-cyan-500/20
                  rounded-lg
                  px-3 py-1
                  hover:bg-cyan-500/10
                  hover:border-cyan-400
                  transition
                "
              >
                View details →
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Clients;
