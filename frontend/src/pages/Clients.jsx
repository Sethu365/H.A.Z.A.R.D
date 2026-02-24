import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Gauge from "../components/Gauge";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://172.24.16.81:8001/client";
const POLL_INTERVAL_MS = 1500; // Adjusted slightly for parallel processing

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const hasMounted = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Fetch Metrics
        const metricsRes = await fetch(`${BASE_URL}/metrics`);
        if (!metricsRes.ok) throw new Error("Metrics fetch failed");
        const metricsData = await metricsRes.json();

        // Group by latest metric per host
        const latestByHost = {};
        metricsData.forEach(m => {
          if (!latestByHost[m.hostname] || new Date(m.timestamp) > new Date(latestByHost[m.hostname].timestamp)) {
            latestByHost[m.hostname] = m;
          }
        });

        const hostnames = Object.keys(latestByHost);

        // 2. Fetch Status for each host using your new route
        // We use Promise.all to check all statuses in parallel
        const statusResults = await Promise.all(
          hostnames.map(async (name) => {
            try {
              const statusRes = await fetch(`${BASE_URL}/status/${name}`);
              return await statusRes.json();
            } catch {
              return { hostname: name, online: false };
            }
          })
        );

        // 3. Merge Data
        const mergedClients = hostnames.map(name => {
          const status = statusResults.find(s => s.hostname === name);
          return {
            ...latestByHost[name],
            isOnline: status?.online || false
          };
        });

        // 4. Sort: Online first, Offline at the last
        const sortedClients = mergedClients.sort((a, b) => {
          if (a.isOnline === b.isOnline) {
            return a.hostname.localeCompare(b.hostname);
          }
          return a.isOnline ? -1 : 1;
        });

        setClients(sortedClients);
      } catch (err) {
        console.error("❌ Data Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, POLL_INTERVAL_MS);
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
      <div>
        <h1 className="text-2xl font-semibold text-white">Connected Clients</h1>
        <p className="text-sm text-gray-400">Live telemetry and gRPC connection status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {clients.map(client => (
          <motion.div
            key={client.hostname}
            initial={hasMounted.current ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              border rounded-2xl p-6 flex flex-col transition-all duration-500
              ${client.isOnline 
                ? 'bg-gray-900/60 border-gray-800 shadow-lg' 
                : 'bg-black/40 border-gray-900 opacity-60 grayscale-[0.5]'}
            `}
          >
            {/* HEADER */}
<div className="mb-6 flex justify-between items-start">
  {/* HOSTNAME LEFT */}
  <div>
    <h2 className={`text-lg font-bold tracking-tight ${client.isOnline ? 'text-white' : 'text-gray-500'}`}>
      {client.hostname}
    </h2>
  </div>

  {/* STATUS BADGE AND DOT RIGHT (SINGLE LINE) */}
  <div className="flex items-center gap-2">
    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)] ${
      client.isOnline 
        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
        : 'bg-red-500/10 text-red-500 border-red-500/20'
    }`}>
      {client.isOnline ? 'Connected' : 'Offline'}
    </span>
  </div>
</div>

            {/* GAUGES */}
            <div className="grid grid-cols-2 gap-4">
              <Gauge 
                label="CPU" 
                value={client.isOnline ? client.cpu : "--"} 
              />
              <Gauge 
                label="Memory" 
                value={client.isOnline ? client.ram : "--"} 
              />
            </div>

            {/* ACTION */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-[10px] font-mono text-gray-600">
                {client.isOnline ? `SYNC: ${new Date(client.timestamp).toLocaleTimeString()}` : 'CONNECTION LOST'}
              </p>
              <button
                onClick={() => client.isOnline && navigate(`/clients/${client.hostname}`)}
                disabled={!client.isOnline}
                className={`
                  text-xs font-bold px-4 py-2 rounded-xl transition-all
                  ${client.isOnline 
                    ? 'text-cyan-400 bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-400' 
                    : 'text-gray-700 bg-transparent border border-gray-900 cursor-not-allowed'}
                `}
              >
                Inspect Node →
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Clients;