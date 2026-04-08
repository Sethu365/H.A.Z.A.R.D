import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import {
  Activity, Terminal, ChevronRight, Search, History,
  Fingerprint, Zap, Cpu, Clock, X,
  Binary, FileCode, AlertCircle, Server, Code, Orbit
} from 'lucide-react';

const API_BASE = "http://172.24.16.81:8001";
const POLL_INTERVAL = 5000;

// ─── GLASS PRIMITIVES (shared system) ────────────────────────────────────────

const GlassPanel = ({ children, className = "", hover = true }) => (
  <div className={`relative overflow-hidden rounded-[2rem]
                   backdrop-blur-[35px] saturate-[2.2]
                   bg-white/[0.06] dark:bg-black/20
                   border-t border-l border-white/20
                   border-r border-b border-white/5
                   shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_0_20px_rgba(255,255,255,0.04),inset_0_0_2px_rgba(255,255,255,0.2)]
                   ${hover ? "transition-all duration-300 hover:bg-white/[0.09] hover:border-white/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.18),inset_0_0_25px_rgba(255,255,255,0.06)]" : ""}
                   ${className}`}>
    <div className="absolute -top-[120%] -left-[40%] w-[180%] h-[180%]
                    bg-gradient-to-br from-white/[0.10] via-transparent to-transparent
                    rotate-12 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-full h-[1px]
                    bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    <div className="relative z-10">{children}</div>
  </div>
);

const GlassInput = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4 pointer-events-none" />}
    <input
      className={`backdrop-blur-[35px] saturate-[2.2]
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
  const base = `flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[11px]
                uppercase tracking-widest transition-all duration-200 cursor-pointer`;
  const variants = {
    ghost: `backdrop-blur-[35px] bg-white/[0.06]
            border-t border-l border-white/20 border-r border-b border-white/5
            text-white/70 hover:bg-white/[0.12] hover:text-white
            shadow-[inset_0_0_15px_rgba(255,255,255,0.04)]`,
    solid: `bg-white/90 text-slate-900 border border-white/30
            hover:bg-white
            shadow-[0_4px_20px_rgba(255,255,255,0.15),inset_0_1px_2px_rgba(255,255,255,0.8)]
            hover:shadow-[0_4px_28px_rgba(255,255,255,0.25)]`,
    active: `bg-white/20 text-white border-t border-l border-white/30 border-r border-b border-white/10
             shadow-[inset_0_0_15px_rgba(255,255,255,0.08)]`,
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const GlassChip = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                  backdrop-blur-[20px] bg-white/[0.06] border border-white/15
                  shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]">
    {Icon && <Icon size={12} className="text-white/40 shrink-0" />}
    <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider truncate max-w-[200px]">
      {children}
    </span>
  </div>
);

// ─── STAT TILE ────────────────────────────────────────────────────────────────

const StatTile = ({ label, value, color }) => {
  const wash   = color === 'cyan' ? 'from-indigo-500/10 to-transparent' : 'from-red-500/10 to-transparent';
  const dot    = color === 'cyan'
    ? 'bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.8)]'
    : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]';
  const val    = color === 'cyan' ? 'text-white' : 'text-red-400';

  return (
    <GlassPanel className="p-8">
      <div className={`absolute inset-0 bg-gradient-to-br ${wash} opacity-60 pointer-events-none z-0`} />
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-5">
          <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
          <p className="font-black text-[10px] uppercase text-white/50 tracking-[0.35em]">{label}</p>
        </div>
        <p className={`text-6xl font-black tracking-tighter ${val}
                       drop-shadow-[0_0_20px_rgba(255,255,255,0.08)]`}>
          {value}
        </p>
      </div>
    </GlassPanel>
  );
};

// ─── EVENT ROW ────────────────────────────────────────────────────────────────

const EventRow = ({ log, onClick }) => {
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
                 transition-all duration-300 p-6
                 flex flex-col md:flex-row items-center justify-between gap-6"
    >
      <div className="absolute -top-[120%] -left-[40%] w-[180%] h-[180%]
                      bg-gradient-to-br from-white/[0.06] via-transparent to-transparent
                      rotate-12 pointer-events-none" />
      {isHigh && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/[0.06] to-transparent pointer-events-none" />
      )}
      <div className="absolute bottom-0 left-0 w-full h-[1px]
                      bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* LEFT */}
      <div className="flex items-center gap-5 flex-1 min-w-0 w-full relative z-10">
        <div className={`shrink-0 p-4 rounded-2xl border transition-all duration-300
                         shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]
                         ${isHigh
                           ? "border-red-500/30 bg-red-500/10 text-red-400 group-hover:border-red-500/50"
                           : "border-white/15 bg-white/[0.05] text-white/50 group-hover:border-white/25 group-hover:text-white/80"
                         }`}>
          <Fingerprint size={24} className={isHigh ? "drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : ""} />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-black text-white uppercase tracking-tight truncate
                         drop-shadow-[0_1px_6px_rgba(255,255,255,0.1)]">
            {log.process || 'SYSTEM_CORE'}
          </h4>
          <p className="text-xs font-medium text-white/35 truncate italic mt-0.5">
            "{log.summary || 'Behavioural deviation recorded'}"
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <GlassChip icon={Clock}>{new Date(log.timestamp).toLocaleTimeString()}</GlassChip>
            {log.process_chain?.length > 0 && (
              <GlassChip icon={Binary}>{log.process_chain.join(' › ')}</GlassChip>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-6 shrink-0 relative z-10">
        <div className="text-right hidden sm:block">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">
            Threat_Index
          </p>
          <div className="flex items-center gap-3">
            <div className="w-24 h-1.5 rounded-full overflow-hidden
                            bg-white/[0.08] border border-white/10
                            shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${log.risk_score}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full
                            ${isHigh
                              ? "bg-gradient-to-r from-red-500 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                              : "bg-gradient-to-r from-indigo-400 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
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

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────

const DetailModal = ({ log, hostname, onClose }) => {
  const [showRaw, setShowRaw]         = useState(false);
  const [ghostFiles, setGhostFiles]   = useState([]);
  const [ghostLoading, setGhostLoading] = useState(false);
  const isHigh = log.risk_score > 80;

  useEffect(() => {
    const fetch_ = async () => {
      setGhostLoading(true);
      try {
        const res    = await fetch(`${API_BASE}/api/fim/${hostname}/${log.timestamp}`);
        const result = await res.json();
        setGhostFiles(result.data || []);
      } catch { /* silent */ }
      finally { setGhostLoading(false); }
    };
    fetch_();
  }, [log, hostname]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 lg:p-6
                 bg-black/60 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="relative overflow-hidden rounded-[2.5rem] w-full max-w-5xl max-h-[90vh]
                   flex flex-col
                   backdrop-blur-[40px] saturate-[2.2]
                   bg-white/[0.08] dark:bg-black/30
                   border-t border-l border-white/25
                   border-r border-b border-white/[0.08]
                   shadow-[0_40px_80px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(255,255,255,0.05),inset_0_0_2px_rgba(255,255,255,0.3)]"
      >
        {/* Modal shine + caustic */}
        <div className="absolute -top-[120%] -left-[40%] w-[180%] h-[180%]
                        bg-gradient-to-br from-white/[0.10] via-transparent to-transparent
                        rotate-12 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5
                        opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-[1px]
                        bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* ── MODAL HEADER ── */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center
                        gap-4 p-7 border-b border-white/[0.08]">
          <div className="flex items-center gap-5">
            <div className={`shrink-0 p-4 rounded-2xl border
                             shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]
                             ${isHigh
                               ? "border-red-500/30 bg-red-500/10 text-red-400"
                               : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                             }`}>
              <Fingerprint size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">
                {log.process}
              </h2>
              <p className="text-[10px] font-black text-white/35 uppercase tracking-widest mt-1">
                Node: {hostname} // {log.event_id?.slice(0, 12)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <GlassButton
              variant={showRaw ? "active" : "ghost"}
              onClick={() => setShowRaw(!showRaw)}
            >
              <Code size={14} />
              {showRaw ? "Analysis" : "Raw Payload"}
            </GlassButton>
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
        </div>

        {/* ── MODAL BODY ── */}
        <div className="relative z-10 p-6 space-y-6 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {showRaw ? (
              <motion.div
                key="raw"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="rounded-[1.5rem] overflow-hidden
                            bg-black/40 border border-white/[0.08]
                            shadow-[inset_0_2px_20px_rgba(0,0,0,0.4)]"
              >
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
              </motion.div>
            ) : (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="space-y-5"
              >
                {/* Risk + Process chain row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Risk magnitude */}
                  <GlassPanel hover={false} className="md:col-span-4 p-7 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Activity size={12} className="text-white/35" />
                      <p className="text-[9px] font-black uppercase text-white/35 tracking-[0.3em]">
                        Risk Magnitude
                      </p>
                    </div>
                    <span className={`text-6xl font-black tracking-tighter
                                     ${isHigh ? "text-red-400" : "text-white"}`}>
                      {log.risk_score}%
                    </span>
                    <div className="mt-5 h-1.5 w-full rounded-full overflow-hidden
                                    bg-white/[0.08] border border-white/10">
                      <div
                        className={`h-full rounded-full transition-all
                                    ${isHigh
                                      ? "bg-gradient-to-r from-red-500 to-red-400"
                                      : "bg-gradient-to-r from-indigo-400 to-cyan-400"
                                    }`}
                        style={{ width: `${log.risk_score}%` }}
                      />
                    </div>
                  </GlassPanel>

                  {/* Process chain */}
                  <GlassPanel hover={false} className="md:col-span-8 p-7">
                    <div className="flex items-center gap-2 mb-5">
                      <Cpu size={12} className="text-white/35" />
                      <p className="text-[9px] font-black uppercase text-white/35 tracking-[0.3em]">
                        Execution Chain Forensics
                      </p>
                    </div>
                    <div className="flex items-center gap-4 overflow-x-auto pb-2">
                      {log.process_chain?.map((proc, idx) => (
                        <React.Fragment key={idx}>
                          <div className="flex flex-col items-center gap-2 shrink-0">
                            <div className={`p-3 rounded-xl border transition-all
                                            shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]
                                            ${idx === log.process_chain.length - 1
                                              ? "border-indigo-400/40 bg-indigo-500/10 text-indigo-300"
                                              : "border-white/10 bg-white/[0.05] text-white/40"
                                            }`}>
                              <Binary size={16} />
                            </div>
                            <span className="text-[9px] font-black uppercase text-white/40 tracking-tight">
                              {proc}
                            </span>
                          </div>
                          {idx < log.process_chain.length - 1 && (
                            <ChevronRight size={14} className="text-white/20 shrink-0 mb-4" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </GlassPanel>
                </div>

                {/* Ghost scan + Correlated patterns */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* FIM / ghost scan */}
                  <div className="md:col-span-7">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <Zap size={12} className="text-indigo-400" />
                      <p className="text-[9px] font-black uppercase text-white/35 tracking-[0.3em]">
                        Ghost Scan // FIM Metrics
                      </p>
                    </div>
                    <GlassPanel hover={false} className="p-5">
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                        {ghostLoading ? (
                          <p className="text-center font-black uppercase text-[10px]
                                        text-indigo-300/60 animate-pulse py-8">
                            Sweeping Neural Buffer...
                          </p>
                        ) : ghostFiles.length > 0 ? ghostFiles.map((file, idx) => (
                          <div key={idx}
                               className="flex items-center justify-between p-3 rounded-xl
                                          bg-white/[0.04] border border-white/[0.08]
                                          hover:bg-white/[0.07] hover:border-white/15
                                          transition-all duration-200">
                            <div className="flex items-center gap-3 min-w-0">
                              <FileCode size={14} className="text-indigo-300/60 shrink-0" />
                              <div className="truncate">
                                <p className="text-[11px] font-black text-white/70 truncate uppercase tracking-tight">
                                  {file.path}
                                </p>
                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-0.5">
                                  {new Date(file.time).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <AlertCircle size={12} className="text-white/20 shrink-0 ml-2" />
                          </div>
                        )) : (
                          <p className="text-center text-[10px] font-bold uppercase
                                        text-white/25 py-8">
                            No concurrent file IO detected
                          </p>
                        )}
                      </div>
                    </GlassPanel>
                  </div>

                  {/* Correlated patterns */}
                  <div className="md:col-span-5">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <Server size={12} className="text-white/35" />
                      <p className="text-[9px] font-black uppercase text-white/35 tracking-[0.3em]">
                        Correlated Patterns
                      </p>
                    </div>
                    <GlassPanel hover={false} className="p-5">
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                        {log.similar_attacks?.length > 0 ? log.similar_attacks.map((host, idx) => (
                          <div key={idx}
                               className="flex items-center gap-3 p-3 rounded-xl
                                          bg-white/[0.04] border border-white/[0.08]
                                          hover:border-indigo-400/30 hover:bg-indigo-500/[0.06]
                                          transition-all duration-200">
                            <Server size={14} className="text-indigo-300/60 shrink-0" />
                            <p className="text-[11px] font-black text-white/70 uppercase truncate">
                              {host}
                            </p>
                          </div>
                        )) : (
                          <p className="text-center text-[10px] font-bold uppercase
                                        text-white/25 py-8">
                            Isolation Active // No Matches
                          </p>
                        )}
                      </div>
                    </GlassPanel>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const AnomalyClients = ({ setLoading, setError }) => {
  const { hostname }    = useParams();
  const navigate        = useNavigate();
  const context         = useOutletContext();
  const setHeaderData   = context?.setHeaderData;

  const [data, setData]               = useState({ today_anomalies: 0, data: [] });
  const [localLoading, setLocalLoading] = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    setHeaderData?.({ name: `Node: ${hostname}`, desc: "Forensic_Stream" });
  }, [hostname, setHeaderData]);

  const fetchToday = useCallback(async () => {
    try {
      const res    = await fetch(`${API_BASE}/anomalies/today/${hostname}`);
      if (!res.ok) throw new Error();
      const result = await res.json();
      setData({ today_anomalies: result.today_anomalies || 0, data: result.data || [] });
    } catch { /* silent */ }
    finally { setLocalLoading(false); }
  }, [hostname]);

  useEffect(() => {
    if (hostname) fetchToday();
  }, [hostname, fetchToday]);

  const filteredData = (data.data || []).filter(item =>
    item.process?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxRisk = data.data.length > 0
    ? Math.max(...data.data.map(d => d.risk_score || 0))
    : 0;

  return (
    <div className="space-y-6 pb-24 relative selection:bg-indigo-500/20">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <GlassPanel hover={false} className="p-3">
            <Orbit size={20} className="text-white/60 animate-spin-slow" />
          </GlassPanel>
          <div>
            <span className="font-black text-[9px] text-white/35 uppercase tracking-[0.4em]">
              Forensic_Telemetry
            </span>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight
                           drop-shadow-[0_1px_8px_rgba(255,255,255,0.1)]">
              Live Buffer
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
          <GlassButton
            variant="solid"
            onClick={() => navigate(`/clients/${hostname}/client-anomaly/history`)}
          >
            <History size={14} />
            Forensic Archives
          </GlassButton>
        </div>
      </div>

      {/* ── STAT TILES ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatTile label="Events (24h)"       value={data.today_anomalies} color="cyan" />
        <StatTile label="Risk Index Ceiling" value={`${maxRisk}%`}        color="red"  />
      </div>

      {/* ── EVENT FEED ── */}
      <div className="space-y-3">
        {localLoading ? (
          <GlassPanel hover={false} className="py-20 text-center">
            <div className="w-8 h-8 border border-white/20 border-t-white/70 rounded-full
                            animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">
              Syncing Neural Registry
            </p>
          </GlassPanel>
        ) : filteredData.length === 0 ? (
          <GlassPanel hover={false} className="py-20 text-center">
            <p className="text-white/30 font-bold uppercase tracking-widest text-xs">
              No deviations in current buffer
            </p>
          </GlassPanel>
        ) : (
          filteredData.map(log => (
            <EventRow key={log.event_id} log={log} onClick={() => setSelectedLog(log)} />
          ))
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedLog && (
          <DetailModal
            key={selectedLog.event_id}
            log={selectedLog}
            hostname={hostname}
            onClose={() => setSelectedLog(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnomalyClients;