import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Server, Globe, Clock, Box } from "lucide-react";

const API_BASE = "http://172.24.16.81:8001/client";

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm py-1">
    <span className="text-gray-400">{label}</span>
    <span className="text-gray-200 font-medium text-right max-w-[60%] truncate">
      {value}
    </span>
  </div>
);

const formatUptime = seconds => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const ClientDetails = () => {
  const { hostname } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(false);

  useEffect(() => {
    const loadSystemInfo = async () => {
      try {
        const res = await fetch(`${API_BASE}/system-info/${hostname}`);
        if (!res.ok) throw new Error("Failed to fetch system info");
        setData(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSystemInfo();
  }, [hostname]);

  useEffect(() => {
    mounted.current = true;
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

  if (!data) {
    return <p className="text-red-400">Failed to load client details.</p>;
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">
          {data.hostname}
        </h1>
        <p className="text-sm text-gray-400">
          Endpoint system and network profile
        </p>
      </div>

      {/* SYSTEM CARD */}
      <motion.div
        initial={mounted.current ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="
          bg-gray-900/60
          border border-gray-800
          rounded-xl
          p-6
        "
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-300">
              <Server className="w-4 h-4 text-cyan-400" />
              System
            </div>
            <div className="space-y-2">
              <InfoRow label="Operating System" value={data.os} />
              <InfoRow label="Kernel" value={data.kernel} />
              <InfoRow label="Architecture" value={data.arch} />
              <InfoRow
                label="Disk Utilization"
                value={`${data.disk.toFixed(1)} %`}
              />
              <InfoRow
                label="Runtime"
                value={data.container ? "Containerized" : "Bare Metal / VM"}
              />
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-300">
              <Globe className="w-4 h-4 text-cyan-400" />
              Network
            </div>
            <div className="space-y-2">
              <InfoRow label="Internal IP" value={data.internal_ip} />
              <InfoRow label="Public IP" value={data.public_ip} />
              <InfoRow label="MAC Address" value={data.mac} />
              <InfoRow
                label="Uptime"
                value={formatUptime(data.uptime)}
              />
              <InfoRow
                label="Last Seen"
                value={new Date(data.last_alive).toLocaleString()}
              />
            </div>
          </div>
        </div>

        {/* FOOTER STATUS */}
        <div className="mt-6 pt-4 border-t border-gray-800 flex items-center gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-400" />
            <span>Active</span>
          </div>
          {data.container ? (
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-400" />
              <span>Containerized workload</span>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
};

export default ClientDetails;
