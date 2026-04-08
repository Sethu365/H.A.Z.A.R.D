import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Search, Fingerprint, ChevronRight, Orbit, History, X } from 'lucide-react';

const API_BASE = "http://172.24.16.81:8001";
const POLL_INTERVAL = 5000;

// ─── GLASS PRIMITIVES ────────────────────────────────────────────────────────

const GlassPanel = ({ children, className = "", hover = true }) => (
  <div className={`relative overflow-hidden rounded-[2rem]
                   backdrop-blur-[35px] saturate-[2.2]
                   bg-white/[0.06] dark:bg-black/20
                   border-t border-l border-white/20
                   border-r border-b border-white/5
                   shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_0_20px_rgba(255,255,255,0.04),inset_0_0_2px_rgba(255,255,255,0.2)]
                   ${hover ? "transition-all duration-300 hover:bg-white/[0.09] hover:border-white/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.18),inset_0_0_25px_rgba(255,255,255,0.06)]" : ""}
                   ${className}`}>
    {/* Liquid shine */}
    <div className="absolute -top-[120%] -left-[40%] w-[180%] h-[180%]
                    bg-gradient-to-br from-white/[0.10] via-transparent to-transparent
                    rotate-12 pointer-events-none" />
    {/* Bottom bevel */}
    <div className="absolute bottom-0 left-0 w-full h-[1px]
                    bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    <div className="relative z-10">{children}</div>
  </div>
);

const GlassInput = ({ icon: Icon, ...props }) => (
  <div className="relative group">
    {Icon && (
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4 pointer-events-none" />
    )}
    <input
      className={`relative backdrop-blur-[35px] saturate-[2.2]
                  bg-white/[0.06] dark:bg-black/20
                  border-t border-l border-white/20 border-r border-b border-white/5
                  shadow-[inset_0_0_15px_rgba(255,255,255,0.04),inset_0_0_2px_rgba(255,255,255,0.15)]
                  rounded-2xl ${Icon ? "pl-11" : "pl-5"} pr-5 py-2.5
                  text-[11px] font-bold uppercase tracking-widest
                  text-white placeholder:text-white/25
                  outline-none
                  focus:bg-white/[0.10] focus:border-white/30
                  focus:shadow-[inset_0_0_20px_rgba(255,255,255,0.06),0_0_0_2px_rgba(255,255,255,0.08)]
                  transition-all duration-200 w-full`}
      {...props}
    />
  </div>
);

const GlassButton = ({ children, variant = "ghost", className = "", ...props }) => {
  const base = `flex items-center gap-2 px-5 py-2.5 rounded-2xl
                font-black text-[11px] uppercase tracking-widest
                transition-all duration-200 cursor-pointer`;
  const variants = {
    ghost: `backdrop-blur-[35px] bg-white/[0.06]
            border-t border-l border-white/20 border-r border-b border-white/5
            text-white/70 hover:bg-white/[0.12] hover:text-white
            shadow-[inset_0_0_15px_rgba(255,255,255,0.04)]`,
    solid: `bg-white/90 text-slate-900 border border-white/30
            hover:bg-white
            shadow-[0_4px_20px_rgba(255,255,255,0.15),inset_0_1px_2px_rgba(255,255,255,0.8)]
            hover:shadow-[0_4px_28px_rgba(255,255,255,0.25)]`,
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// ─── STAT TILE ────────────────────────────────────────────────────────────────

const StatTile = ({ label, value, color }) => {
  const glowColor  = color === 'cyan' ? 'from-cyan-500/10 to-transparent' : 'from-red-500/10 to-transparent';
  const dotColor   = color === 'cyan'
    ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]'
    : 'bg-red-500  shadow-[0_0_12px_rgba(239,68,68,0.8)]';
  const valColor   = color === 'cyan' ? 'text-white' : 'text-red-400';

  return (
    <GlassPanel className="p-8">
      {/* Accent wash — sits behind content */}
      <div className={`absolute inset-0 bg-gradient-to-br ${glowColor} opacity-60 pointer-events-none z-0`} />
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-5">
          <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <p className="font-black text-[10px] uppercase text-white/50 tracking-[0.35em]">
            {label}
          </p>
        </div>
        <p className={`text-6xl font-black tracking-tighter ${valColor}
                       drop-shadow-[0_0_20px_rgba(255,255,255,0.08)]`}>
          {value}
        </p>
      </div>
    </GlassPanel>
  );
};

// ─── ANOMALY ROW ──────────────────────────────────────────────────────────────

const AnomalyRow = ({ log, onClick }) => {
  const isHigh = log.risk_score > 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-[2rem] cursor-pointer
                 backdrop-blur-[35px] saturate-[2.2]
                 bg-white/[0.05] dark:bg-black/20
                 border-t border-l border-white/15
                 border-r border-b border-white/5
                 shadow-[0_8px_30px_rgba(0,0,0,0.15),inset_0_0_20px_rgba(255,255,255,0.03)]
                 hover:bg-white/[0.09] hover:border-white/25
                 hover:shadow-[0_12px_40px_rgba(0,0,0,0.22),inset_0_0_25px_rgba(255,255,255,0.06)]
                 transition-all duration-300
                 flex flex-col md:flex-row items-center justify-between gap-6 p-6"
    >
      {/* Shine */}
      <div className="absolute -top-[120%] -left-[40%] w-[180%] h-[180%]
                      bg-gradient-to-br from-white/[0.08] via-transparent to-transparent
                      rotate-12 pointer-events-none" />
      {/* High-risk accent */}
      {isHigh && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/[0.06] to-transparent pointer-events-none" />
      )}
      {/* Bottom bevel */}
      <div className="absolute bottom-0 left-0 w-full h-[1px]
                      bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* LEFT */}
      <div className="flex items-center gap-5 flex-1 min-w-0 w-full relative z-10">
        {/* Icon badge */}
        <div className={`shrink-0 p-3.5 rounded-2xl border transition-all duration-300
                         shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]
                         ${isHigh
                           ? "border-red-500/30 bg-red-500/10 text-red-400 group-hover:border-red-500/50 group-hover:bg-red-500/15"
                           : "border-white/15 bg-white/[0.05] text-white/50 group-hover:border-white/25 group-hover:text-white/80"
                         }`}>
          <Fingerprint
            size={24}
            className={isHigh ? "drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" : ""}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-black text-white uppercase tracking-tight truncate
                         transition-colors drop-shadow-[0_1px_6px_rgba(255,255,255,0.1)]">
            {log.process || 'SYSTEM_CORE'}
          </h4>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {/* Node chip */}
            <span className="px-2.5 py-1 rounded-xl text-[9px] font-black tracking-widest uppercase
                             backdrop-blur-[20px] bg-white/[0.08] border border-white/15
                             text-white/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]">
              NODE: {log.hostname}
            </span>
            <p className="text-xs font-medium text-white/40 truncate italic">
              "{log.summary}"
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-8 shrink-0 relative z-10">
        <div className="text-right hidden sm:block">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">
            Magnitude
          </p>
          <div className="flex items-center gap-3">
            {/* Track */}
            <div className="w-20 h-1.5 rounded-full overflow-hidden
                            bg-white/[0.08] border border-white/10
                            shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${log.risk_score}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full
                            ${isHigh
                              ? "bg-gradient-to-r from-red-500 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                              : "bg-gradient-to-r from-white/60 to-white/30 shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                            }`}
              />
            </div>
            <span className={`text-sm font-black ${isHigh ? "text-red-400" : "text-white/80"}`}>
              {log.risk_score}%
            </span>
          </div>
        </div>

        <ChevronRight
          size={18}
          className="text-white/20 group-hover:text-white/70 group-hover:translate-x-1 transition-all duration-200"
        />
      </div>
    </motion.div>
  );
};

// ─── FORENSIC MODAL ───────────────────────────────────────────────────────────

const ForensicModal = ({ log, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[300] flex items-center justify-center p-6
               bg-black/60 backdrop-blur-xl"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.96, y: 16, opacity: 0 }}
      animate={{ scale: 1,    y: 0,  opacity: 1 }}
      exit={{    scale: 0.96, y: 16, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={e => e.stopPropagation()}
      className="relative overflow-hidden rounded-[2.5rem] max-w-3xl w-full max-h-[85vh]
                 backdrop-blur-[40px] saturate-[2.2]
                 bg-white/[0.08] dark:bg-black/30
                 border-t border-l border-white/25
                 border-r border-b border-white/[0.08]
                 shadow-[0_40px_80px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(255,255,255,0.05),inset_0_0_2px_rgba(255,255,255,0.3)]"
    >
      {/* Shine */}
      <div className="absolute -top-[120%] -left-[40%] w-[180%] h-[180%]
                      bg-gradient-to-br from-white/[0.12] via-transparent to-transparent
                      rotate-12 pointer-events-none" />
      {/* Caustic */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5
                      opacity-50 pointer-events-none" />
      {/* Bottom bevel */}
      <div className="absolute bottom-0 left-0 w-full h-[1px]
                      bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative z-10 p-8 overflow-y-auto max-h-[85vh]">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="h-1 w-4 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400
                              shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
                Payload Analysis
              </span>
            </div>
            <h3 className="text-2xl font-black uppercase text-white tracking-tighter leading-none">
              {log.process || "SYSTEM_CORE"}
            </h3>
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mt-1">
              Target Node: {log.hostname}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl transition-all duration-200
                       backdrop-blur-[20px] bg-white/[0.08] border border-white/15
                       text-white/50 hover:text-white hover:bg-red-500/20 hover:border-red-500/30
                       shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Meta chips */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: "Execution_UID", value: log.event_id },
            { label: "Origin_Source", value: log.hostname },
          ].map(({ label, value }) => (
            <div key={label}
                 className="p-4 rounded-2xl
                             backdrop-blur-[20px] bg-white/[0.05] border border-white/10
                             shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]">
              <p className="text-[9px] font-black text-white/35 uppercase tracking-widest mb-1.5">
                {label}
              </p>
              <p className="text-sm font-bold font-mono truncate text-white/80">{value}</p>
            </div>
          ))}
        </div>

        {/* Payload terminal */}
        <div className="rounded-[1.5rem] overflow-hidden
                        bg-black/40 border border-white/[0.08]
                        shadow-[inset_0_2px_20px_rgba(0,0,0,0.4),inset_0_0_2px_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.08]">
            <div className="w-2 h-2 rounded-full bg-white/25" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/35">
              Raw Payload
            </span>
          </div>
          <pre className="font-mono text-xs leading-relaxed text-white/70
                          overflow-x-auto p-6 selection:bg-indigo-500/30">
            {JSON.stringify(log, null, 2)}
          </pre>
        </div>

      </div>
    </motion.div>
  </motion.div>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const Anomalies = ({ setLoading, setError }) => {
  const context = useOutletContext();
  const setHeaderData = context?.setHeaderData;

  const [anomalyData, setAnomalyData] = useState({ total_anomalies: 0, data: [] });
  const [localSyncing, setLocalSyncing]   = useState(true);
  const [searchTerm,   setSearchTerm]     = useState('');
  const [selectedLog,  setSelectedLog]    = useState(null);

  const navigate  = useNavigate();
  const timerRef  = useRef(null);

  useEffect(() => {
    setHeaderData?.({ name: "Anomalies", desc: "Real-time Threat Uplink" });
  }, [setHeaderData]);

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) { setLoading?.(true); setError?.(null); }
    try {
      const res = await fetch(`${API_BASE}/api/anomalies`);
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const result = await res.json();
      setAnomalyData({ total_anomalies: result.total_anomalies || 0, data: result.data || [] });
      if (isInitial) setLoading?.(false);
      setLocalSyncing(false);
    } catch (err) {
      if (isInitial) {
        setLoading?.(false);
        setError?.("Neural Link Failed: Could not sync with Anomaly Registry.");
      }
    } finally {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => loadData(false), POLL_INTERVAL);
    }
  }, [setLoading, setError]);

  useEffect(() => {
    loadData(true);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [loadData]);

  const filteredData = anomalyData.data.filter(item =>
    item.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.process?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxRisk = anomalyData.data.length > 0
    ? Math.max(...anomalyData.data.map(d => d.risk_score || 0))
    : 0;

  return (
    <div className="space-y-6 pb-24 relative selection:bg-indigo-500/20">

      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <GlassPanel hover={false} className="p-3">
            <Orbit size={20} className="text-white/60 animate-spin-slow" />
          </GlassPanel>
          <div>
            <span className="font-black text-[9px] text-white/35 uppercase tracking-[0.4em]">
              Live_Stream
            </span>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight
                           drop-shadow-[0_1px_8px_rgba(255,255,255,0.1)]">
              Buffer
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <GlassInput
            icon={Search}
            type="text"
            placeholder="Search sequence..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: "16rem" }}
          />
          <GlassButton variant="solid" onClick={() => navigate('/anomalies/history')}>
            <History size={14} />
            Archive
          </GlassButton>
        </div>
      </div>

      {/* ── STAT TILES ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatTile label="Ingested Events" value={anomalyData.total_anomalies} color="cyan" />
        <StatTile label="Risk Ceiling"    value={`${maxRisk}%`}               color="red"  />
      </div>

      {/* ── LIST ── */}
      <div className="space-y-3">
        {localSyncing ? (
          <GlassPanel hover={false} className="py-20 text-center">
            <div className="w-8 h-8 border border-white/20 border-t-white/70 rounded-full
                            animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">
              Synchronizing
            </p>
          </GlassPanel>
        ) : filteredData.length === 0 ? (
          <GlassPanel hover={false} className="py-20 text-center">
            <p className="text-white/30 font-bold uppercase tracking-widest text-xs">
              Neural Registry Empty
            </p>
          </GlassPanel>
        ) : (
          filteredData.map(log => (
            <AnomalyRow key={log.event_id} log={log} onClick={() => setSelectedLog(log)} />
          ))
        )}
      </div>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {selectedLog && (
          <ForensicModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Anomalies;