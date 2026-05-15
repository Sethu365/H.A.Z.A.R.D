import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import eyeLogo from "../assets/eye.png";
import {
  ArrowLeft, Search, RefreshCw, Activity, Layers, GitMerge,
  ShieldAlert, BrainCircuit, Fingerprint, BarChart2, Terminal,
  ChevronLeft, AlertCircle, Clock, Radio, Crosshair, Zap,
  Database, Filter, X, Info, ChevronDown, Cpu, Target
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from "recharts";

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = "http://172.24.16.81:8001/cluster";
const POLL_INTERVAL = 15000;

const SEV_COLOR  = { INFO: "#06b6d4", WARN: "#f59e0b", ALERT: "#ef4444" };
const PALETTE    = ["#06b6d4","#a855f7","#f43f5e","#f59e0b","#10b981","#3b82f6","#ec4899"];
const ML_ALERT_THRESHOLD = 0.6;
const TABS = [
  { id:"pulse",    label:"Live Pulse",   icon: Radio },
  { id:"clusters", label:"Cluster Map",  icon: GitMerge },
  { id:"ml",       label:"ML Intel",     icon: BrainCircuit },
  { id:"seq",      label:"Sequences",    icon: Activity },
  { id:"freq",     label:"Frequency",    icon: BarChart2 },
  { id:"threat",   label:"Threat Intel", icon: ShieldAlert },
  { id:"logs",     label:"Log Explorer", icon: Terminal },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function qs(params) {
  const p = Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "");
  return p.length ? "?" + new URLSearchParams(p).toString() : "";
}
function fmtNum(n) { return (typeof n === "number" ? n : 0).toLocaleString(); }
function fmtTs(ts) {
  if (!ts) return "—";
  try { return new Date(ts).toLocaleString("en-US", { month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit" }); }
  catch { return ts; }
}

function numOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function buildMlScatterGroups(points = []) {
  return ["INFO", "WARN", "ALERT"].map(severity => ({
    severity,
    color: SEV_COLOR[severity],
    data: points
      .filter(point => (point.ml_severity ?? "INFO") === severity)
      .map(point => ({
        ...point,
        ml_p_warn: numOrNull(point.ml_p_warn),
        ml_p_alert: numOrNull(point.ml_p_alert),
      }))
      .filter(point => point.ml_p_warn !== null && point.ml_p_alert !== null),
  }));
}

const nativeOptionClass =
  "bg-[#0b1120] text-slate-200";

function useFetch(url) {
  const [data, setData]    = useState(null);
  const [loading, setLoad] = useState(true);
  useEffect(() => {
    let cancelled = false;
    if (!url) { setData(null); setLoad(false); return; }
    setLoad(true);
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`Request failed: ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (cancelled) return;
        setData(d);
        setLoad(false);
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setLoad(false);
      });
    return () => { cancelled = true; };
  }, [url]);
  return { data, loading };
}

// ── Shared Sub-components ─────────────────────────────────────────────────────
const SevBadge = ({ v }) => {
  if (!v) return <span className="text-slate-600 font-jetbrains text-[10px]">—</span>;
  const colors = {
    INFO:  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    WARN:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ALERT: "bg-red-500/10 text-red-400 border-red-500/20"
  };
  return <span className={`font-jetbrains text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${colors[v] ?? "bg-white/5 text-slate-400 border-white/10"}`}>{v}</span>;
};

const SectionHead = ({ title, icon: Icon, extra }) => (
  <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/5 gap-3">
    <div className="flex items-center gap-2.5 min-w-0">
      {Icon && <Icon size={15} className="text-cyan-400 shrink-0" />}
      <h3 className="font-roboto-condensed text-[11px] md:text-[12px] font-black uppercase tracking-[0.25em] text-cyan-400">{title}</h3>
    </div>
    {extra}
  </div>
);

const Panel = ({ children, className = "" }) => (
  <div className={`bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 md:p-6 backdrop-blur-xl ${className}`}>
    {children}
  </div>
);

const StatusBadge = ({ type, children }) => {
  const styles = {
    ok:    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    warn:  "bg-amber-500/10 border-amber-500/20 text-amber-400",
    alert: "bg-red-500/10 border-red-500/20 text-red-400",
    info:  "bg-purple-500/10 border-purple-500/20 text-purple-400",
  };
  return (
    <div className={`font-jetbrains text-[10px] font-bold uppercase tracking-widest px-3.5 py-2.5 rounded-xl border flex items-center gap-2 mb-1 ${styles[type] ?? styles.info}`}>
      {(type === "alert" || type === "warn") && <AlertCircle size={12} />}
      {type === "ok" && <span>✓</span>}
      {children}
    </div>
  );
};

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#070d1a] border border-white/10 rounded-xl p-3.5 shadow-2xl">
      {label && <p className="font-jetbrains text-[9px] text-slate-500 mb-1.5 uppercase">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-jetbrains text-[11px] font-bold" style={{ color: p.color || "#06b6d4" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

function DataTable({ rows = [], cols, maxRows = 150 }) {
  if (!rows.length) return (
    <div className="py-14 text-center border border-dashed border-white/5 rounded-2xl text-slate-600 font-jetbrains text-[10px] uppercase tracking-widest">
      No data in current window
    </div>
  );
  return (
    <div className="overflow-auto max-h-80 cyber-scroll">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-500 pb-3 pr-5 border-b border-white/5 whitespace-nowrap">{c.label ?? c.key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, maxRows).map((row, i) => (
            <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
              {cols.map(c => (
                <td key={c.key} className="font-jetbrains text-[10px] md:text-[11px] text-slate-300 py-2.5 pr-5 max-w-[260px] truncate" title={String(row[c.key] ?? "")}>
                  {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Loader = () => (
  <div className="flex items-center justify-center py-16 text-cyan-400">
    <RefreshCw size={20} className="animate-spin mr-3" />
    <span className="font-roboto-condensed text-[10px] font-black uppercase tracking-[0.3em]">Syncing...</span>
  </div>
);

const Empty = ({ msg = "No data" }) => (
  <div className="py-16 text-center border border-dashed border-white/5 rounded-2xl text-slate-600 font-jetbrains text-[10px] uppercase tracking-widest">{msg}</div>
);

function CompactControls({ filterData, filters, setFilters, activeTab, setActiveTab, lockedHosts = [] }) {
  const { hosts = [], topics = [] } = filterData ?? {};
  const { selHosts, selTopics, selSev, timeRange, search } = filters;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const toggleHost = h => setFilters(f => ({
    ...f,
    selHosts: f.selHosts.includes(h) ? f.selHosts.filter(x => x !== h) : [...f.selHosts, h],
  }));
  const toggleTopic = t => setFilters(f => ({
    ...f,
    selTopics: f.selTopics.includes(t) ? f.selTopics.filter(x => x !== t) : [...f.selTopics, t],
  }));
  const toggleSev = s => setFilters(f => ({
    ...f,
    selSev: f.selSev.includes(s) ? f.selSev.filter(x => x !== s) : [...f.selSev, s],
  }));

  return (
    <Panel className="space-y-5">
      <div className="space-y-3">
        <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Cluster Modules</p>
        <div className="flex gap-2 overflow-x-auto pb-1 cyber-scroll md:flex-wrap md:overflow-visible">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 transition-all ${
                  isActive
                    ? "border-cyan-500/30 bg-cyan-500/10 text-white"
                    : "border-white/10 bg-white/[0.02] text-slate-500 hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon size={13} className={isActive ? "text-cyan-400" : "text-slate-500"} />
                <span className="font-roboto-condensed text-[9px] font-black uppercase tracking-[0.22em]">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div>
          <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2.5">Time Window</p>
          <select
            className="w-full font-jetbrains text-[11px] bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-slate-200 uppercase outline-none"
            value={timeRange}
            onChange={e => setFilters(f => ({ ...f, timeRange: e.target.value }))}
          >
            <option value="" className={nativeOptionClass}>All Time</option>
            <option value="1h" className={nativeOptionClass}>Last 1h</option>
            <option value="6h" className={nativeOptionClass}>Last 6h</option>
            <option value="24h" className={nativeOptionClass}>Last 24h</option>
            <option value="7d" className={nativeOptionClass}>Last 7d</option>
          </select>
        </div>

        <div className="xl:col-span-3">
          <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2.5">Search</p>
          <div className="relative group">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
            <input
              className="w-full font-jetbrains text-[11px] bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-slate-200 outline-none focus:border-cyan-500/40 uppercase"
              placeholder="template / log…"
              value={search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/10 overflow-hidden md:border-0 md:bg-transparent md:rounded-none">
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left md:hidden"
        >
          <div>
            <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Advanced Filters</p>
            <p className="font-jetbrains text-[10px] uppercase tracking-wider text-slate-500 mt-1">Hosts, severity, monitors</p>
          </div>
          <ChevronDown size={16} className={`text-slate-500 transition-transform ${showAdvanced ? "rotate-180 text-cyan-400" : ""}`} />
        </button>

        <div className={`${showAdvanced ? "block" : "hidden"} md:block p-4 md:p-0`}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div>
              <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2.5">
                {lockedHosts.length > 0 ? "Client Scope" : "Hosts"}
              </p>
              <div className="flex flex-wrap gap-2">
                {lockedHosts.length > 0 ? lockedHosts.map(h => (
                  <span key={h} className="font-jetbrains text-[10px] font-bold px-3 py-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 uppercase tracking-wider">
                    {h}
                  </span>
                )) : hosts.length > 0 ? hosts.map(h => (
                  <button
                    key={h}
                    onClick={() => toggleHost(h)}
                    className={`font-jetbrains text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider transition-all ${
                      selHosts.includes(h) || selHosts.length === 0
                        ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
                        : "border-white/10 text-slate-600 hover:border-white/20"
                    }`}
                  >
                    {h}
                  </button>
                )) : (
                  <span className="font-jetbrains text-[10px] text-slate-600 uppercase">No hosts available</span>
                )}
              </div>
            </div>

            <div>
              <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2.5">Severity</p>
              <div className="flex flex-wrap gap-2">
                {["INFO", "WARN", "ALERT"].map(s => {
                  const colors = {
                    INFO: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
                    WARN: "border-amber-500/40 bg-amber-500/10 text-amber-400",
                    ALERT: "border-red-500/40 bg-red-500/10 text-red-400",
                  };
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSev(s)}
                      className={`font-jetbrains text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider transition-all ${
                        selSev.includes(s) ? colors[s] : "border-white/10 text-slate-600 hover:border-white/20"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2.5">Monitors</p>
              <div className="flex flex-wrap gap-2">
                {topics.length > 0 ? topics.map(t => (
                  <button
                    key={t}
                    onClick={() => toggleTopic(t)}
                    className={`font-jetbrains text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider transition-all ${
                      selTopics.includes(t) || selTopics.length === 0
                        ? "text-purple-400 bg-purple-500/10 border-purple-500/20"
                        : "border-white/10 text-slate-600 hover:border-white/20"
                    }`}
                  >
                    {t.replace(".monitor", "")}
                  </button>
                )) : (
                  <span className="font-jetbrains text-[10px] text-slate-600 uppercase">No monitor filters</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ── KPI Row ───────────────────────────────────────────────────────────────────
function KPIRow({ kpis }) {
  if (!kpis) return null;
  const cards = [
    { label:"Events",    value:kpis.events,    color:"text-cyan-400" },
    { label:"Hosts",     value:kpis.hosts,     color:"text-purple-400" },
    { label:"Clusters",  value:kpis.clusters,  color:"text-blue-400" },
    { label:"Monitors",  value:kpis.monitors,  color:"text-emerald-400" },
    { label:"Alerts",    value:kpis.alerts,    color:"text-red-400" },
    { label:"Warnings",  value:kpis.warnings,  color:"text-amber-400" },
    { label:"ML Scored", value:kpis.ml_scored, color:"text-pink-400" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {cards.map(c => (
        <div key={c.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 md:p-5 relative overflow-hidden hover:bg-white/[0.05] transition-all">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
          <p className="font-roboto-condensed text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1.5">{c.label}</p>
          <p className={`font-jetbrains text-xl md:text-2xl font-black leading-none ${c.color}`}>{fmtNum(c.value)}</p>
        </div>
      ))}
    </div>
  );
}

// ══ TAB: LIVE PULSE ══════════════════════════════════════════════════════════
function LivePulse({ qp }) {
  const { data, loading } = useFetch(`${API_BASE}/live-pulse${qs(qp)}`);
  if (loading) return <Loader />;
  if (!data) return <Empty />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel>
          <SectionHead title="Monitor Distribution" icon={Radio} />
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data.monitor_dist} dataKey="count" nameKey="topic" cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={2}>
                {data.monitor_dist.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip content={<CT />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-1">
            {data.monitor_dist.map((d, i) => (
              <span key={i} className="font-jetbrains text-[10px] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="text-slate-500">{d.topic}</span>
              </span>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHead title="Severity Breakdown" icon={Layers} />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.severity_breakdown} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="severity" tick={{ fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.35)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.2)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CT />} />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {data.severity_breakdown.map((d, i) => <Cell key={i} fill={SEV_COLOR[d.severity] ?? "#06b6d4"} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel>
        <SectionHead title="Event Rate — 1-min bins" icon={Activity} />
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.event_rate}>
            <defs>
              <linearGradient id="evGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="timestamp" hide />
            <YAxis tick={{ fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.2)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CT />} />
            <Area type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={1.5} fill="url(#evGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel>
          <SectionHead title="Host Activity" icon={Cpu} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.host_activity} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="host" tick={{ fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.35)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.2)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CT />} />
              <Bar dataKey="count" fill="#06b6d4" radius={[4,4,0,0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <SectionHead title="Top Subclusters" icon={Target} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.top_subclusters} layout="vertical" barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.2)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="subcluster" width={130} tick={{ fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CT />} />
              <Bar dataKey="count" fill="#a855f7" radius={[0,4,4,0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

// ══ CLUSTER VECTOR SPACE (TF-IDF + PCA bubble chart) ═════════════════════════
//
// FIX: Previously the component re-derived severity/shape/rings from raw
//      avg_ml_p_alert thresholds, overriding the backend's already-correct
//      "severity" field and causing nearly everything to render as ALERT
//      diamonds with rings.
//
//      Now:
//      1. Shape (diamond vs circle) comes from pt.severity === "ALERT" only.
//      2. ML-alert ring fires only when pt.severity === "ALERT" AND
//         pt.ml_alert_count > 5 (meaningfully many, not just one high-prob event).
//      3. Freq-anomaly ring fires only when pt.freq_anomalies > 0 (unchanged,
//         but this was always correct — the data itself had inflated counts).
//      4. Tooltip severity colour uses backend pt.severity, not re-derived.

// const TOPIC_COLORS = {
//   "filesystem.monitor": "#06b6d4",
//   "network.monitor":    "#f43f5e",
//   "process.monitor":    "#f59e0b",
//   "module.monitor":     "#a855f7",
//   "auth.monitor":       "#10b981",
//   "registry.monitor":   "#3b82f6",
//   "log.monitor":        "#ec4899",
//   "dns.monitor":        "#84cc16",
// };
// const topicColor = t => TOPIC_COLORS[t] ?? "#64748b";

// function ClusterVectorSpace({ qp, onSelect }) {

//   const { data, loading } = useFetch(`${API_BASE}/cluster-vector${qs(qp)}`);
//   const [hovered, setHovered] = useState(null);
//   const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
//   const containerRef = useRef(null);

//   const W = 860, H = 440, PAD = 52;

//   if (loading) return (
//     <Panel>
//       <SectionHead title="Template Vector Space — TF-IDF + PCA" icon={GitMerge} />
//       <Loader />
//     </Panel>
//   );
//   if (!data || data.error || !data.points?.length) return (
//     <Panel>
//       <SectionHead title="Template Vector Space — TF-IDF + PCA" icon={GitMerge} />
//       <Empty msg={data?.error === "need_2_clusters" ? "Need ≥ 2 clusters for PCA" : "No cluster-vector data yet"} />
//     </Panel>
//   );

//   const pts = data.points;
//   const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
//   const xMin = Math.min(...xs), xMax = Math.max(...xs);
//   const yMin = Math.min(...ys), yMax = Math.max(...ys);
//   const xR = xMax - xMin || 1, yR = yMax - yMin || 1;

//   const nx = x => PAD + ((x - xMin) / xR) * (W - PAD * 2);
//   const ny = y => PAD + ((y - yMin) / yR) * (H - PAD * 2);
//   const maxCount = Math.max(...pts.map(p => p.count), 1);
//   const bubbleR  = count => Math.max(7, Math.sqrt(count / maxCount) * 46);

//   const uniqueTopics = [...new Set(pts.map(p => p.topic))].sort();

//   const handleMouseMove = e => {
//     if (!containerRef.current) return;
//     const rect = containerRef.current.getBoundingClientRect();
//     setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
//   };

//   return (
//     <Panel>
//       <SectionHead
//         title="Template Vector Space — TF-IDF + PCA"
//         icon={GitMerge}
//         extra={
//           <span className="font-jetbrains text-[9px] text-slate-600 uppercase tracking-widest hidden md:flex items-center gap-3">
//             Hover bubble for details · Click to drill
//             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/><span>ML Alert</span></span>
//             <span className="flex items-center gap-1">
//               <span className="w-3 h-3 rounded-full border border-dashed border-amber-400 inline-block"/>
//               <span>Freq Anomaly</span>
//             </span>
//           </span>
//         }
//       />

//       <div ref={containerRef} className="relative rounded-xl overflow-hidden" onMouseMove={handleMouseMove}>
//         <svg
//           viewBox={`0 0 ${W} ${H}`}
//           className="w-full select-none"
//           style={{ background: "rgba(0,0,0,0.25)", borderRadius: "12px", display: "block" }}
//         >
//           {/* Grid lines */}
//           {[0.25, 0.5, 0.75].map(t => (
//             <g key={t}>
//               <line x1={PAD + t*(W-PAD*2)} y1={PAD} x2={PAD + t*(W-PAD*2)} y2={H-PAD}
//                 stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
//               <line x1={PAD} y1={PAD + t*(H-PAD*2)} x2={W-PAD} y2={PAD + t*(H-PAD*2)}
//                 stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
//             </g>
//           ))}
//           {/* Axis labels */}
//           <text x={W/2} y={H-8} textAnchor="middle"
//             fill="rgba(255,255,255,0.1)" fontSize="9" fontFamily="JetBrains Mono">PCA-1</text>
//           <text x={12} y={H/2} textAnchor="middle"
//             fill="rgba(255,255,255,0.1)" fontSize="9" fontFamily="JetBrains Mono"
//             transform={`rotate(-90,12,${H/2})`}>PCA-2</text>

//           {/* Render bubbles — back-to-front by size so small ones stay on top */}
//           {[...pts]
//             .sort((a, b) => b.count - a.count)
//             .map((pt, i) => {
//               const cx  = nx(pt.x);
//               const cy  = ny(pt.y);
//               const r   = bubbleR(pt.count);
//               const col = topicColor(pt.topic);
//               const isHov = hovered?.cluster_id === pt.cluster_id;

//               // ── FIX: use backend-computed severity field, not re-derived ──
//               // pt.severity is already correctly set by /cluster-vector endpoint
//               const isAlert = pt.severity === "ALERT";
//               const isWarn  = pt.severity === "WARN";

//               // ML-alert ring: only for genuine ALERT clusters with multiple
//               // ML-flagged events (not just a single high-probability sample)
//               const isMlAlert = isAlert && (pt.ml_alert_count ?? 0) > 5;

//               // Freq-anomaly dashed ring: only if there are actual freq anomaly
//               // events recorded for this cluster
//               const isFreqAnom = (pt.freq_anomalies ?? 0) > 0;

//               // Shape: diamond only for ALERT, circle for WARN/INFO
//               const showDiamond = isAlert;

//               return (
//                 <g key={pt.cluster_id ?? i}
//                   style={{ cursor: "pointer" }}
//                   onMouseEnter={() => setHovered(pt)}
//                   onMouseLeave={() => setHovered(null)}
//                   onClick={() => onSelect?.(pt.cluster_id)}
//                 >
//                   {/* Freq-anomaly dashed outer ring */}
//                   {isFreqAnom && (
//                     <circle cx={cx} cy={cy} r={r + 6}
//                       fill="none" stroke="#f59e0b" strokeWidth="1.5"
//                       strokeDasharray="4 3" opacity="0.75"/>
//                   )}
//                   {/* ML-alert solid outer ring — only genuine ALERT clusters */}
//                   {isMlAlert && (
//                     <circle cx={cx} cy={cy} r={r + (isFreqAnom ? 12 : 6)}
//                       fill="none"
//                       stroke="#ef4444"
//                       strokeWidth="1.5" opacity="0.85"/>
//                   )}
//                   {/* Main shape — diamond for ALERT, circle for WARN/INFO */}
//                   {showDiamond ? (
//                     <rect
//                       x={cx - r * 0.75}
//                       y={cy - r * 0.75}
//                       width={r * 1.5}
//                       height={r * 1.5}
//                       fill={col}
//                       fillOpacity={isHov ? 1 : 0.78}
//                       stroke={isHov ? "white" : "rgba(0,0,0,0.3)"}
//                       strokeWidth={isHov ? 2 : 1}
//                       transform={`rotate(45, ${cx}, ${cy})`}
//                       style={{ transition: "fill-opacity 0.15s" }}
//                     />
//                   ) : (
//                     <circle
//                       cx={cx} cy={cy} r={r}
//                       fill={col}
//                       fillOpacity={isHov ? 1 : isWarn ? 0.85 : 0.62}
//                       stroke={isHov ? "white" : isWarn ? "rgba(245,158,11,0.4)" : "rgba(0,0,0,0.25)"}
//                       strokeWidth={isHov ? 2 : isWarn ? 1.5 : 1}
//                       style={{ transition: "fill-opacity 0.15s" }}
//                     />
//                   )}
//                 </g>
//               );
//             })}
//         </svg>

//         {/* Floating tooltip */}
//         {hovered && (
//           <div
//             className="absolute z-20 pointer-events-none bg-[#070d1a] border border-white/10 rounded-xl p-3.5 shadow-2xl w-64"
//             style={{
//               left:  Math.min(mousePos.x + 14, (containerRef.current?.clientWidth ?? 400) - 276),
//               top:   Math.max(mousePos.y - 10, 4),
//             }}
//           >
//             <div className="flex items-center gap-2 mb-2.5">
//               <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: topicColor(hovered.topic) }}/>
//               <span className="font-roboto-condensed text-[10px] font-black uppercase tracking-widest text-white truncate">
//                 {hovered.subcluster}
//               </span>
//             </div>
//             <div className="space-y-1 font-jetbrains text-[9px]">
//               {[
//                 ["Cluster",     <span className="text-cyan-400">#{hovered.cluster_id}</span>],
//                 ["Monitor",     <span className="text-slate-300">{hovered.topic}</span>],
//                 ["Events",      <span className="text-white font-bold">{hovered.count?.toLocaleString()}</span>],
//                 ["Severity",    <span style={{ color: SEV_COLOR[hovered.severity] ?? "#94a3b8" }}>{hovered.severity}</span>],
//                 ["P(Alert)",    <span className={hovered.avg_ml_p_alert > 0.75 ? "text-red-400 font-bold" : "text-slate-300"}>
//                                   {hovered.avg_ml_p_alert?.toFixed(3)}
//                                 </span>],
//                 ["ML Alerts",   <span className={hovered.ml_alert_count > 5 ? "text-red-400 font-bold" : "text-slate-400"}>
//                                   {hovered.ml_alert_count ?? 0}
//                                 </span>],
//                 ...(hovered.freq_anomalies > 0
//                   ? [["Freq Anom", <span className="text-amber-400 font-bold">{hovered.freq_anomalies}</span>]]
//                   : []),
//               ].map(([label, val]) => (
//                 <div key={label} className="flex justify-between gap-4">
//                   <span className="text-slate-500 shrink-0">{label}</span>
//                   {val}
//                 </div>
//               ))}
//               <p className="text-slate-600 mt-2 truncate text-[8.5px]" title={hovered.template}>
//                 {hovered.template}
//               </p>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Legend */}
//       <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 items-center">
//         {uniqueTopics.map(t => (
//           <div key={t} className="flex items-center gap-1.5">
//             <span className="w-2 h-2 rounded-full shrink-0" style={{ background: topicColor(t) }}/>
//             <span className="font-jetbrains text-[9px] text-slate-500 uppercase">{t.replace(".monitor","")}</span>
//           </div>
//         ))}
//         <div className="flex items-center gap-1.5">
//           <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"/>
//           <span className="font-jetbrains text-[9px] text-slate-500 uppercase">ML Alert (&gt;5 events)</span>
//         </div>
//         <div className="flex items-center gap-1.5">
//           <span className="w-3 h-3 rounded-full border border-dashed border-amber-400 shrink-0 inline-block"/>
//           <span className="font-jetbrains text-[9px] text-slate-500 uppercase">Freq Anomaly</span>
//         </div>
//       </div>
//     </Panel>
//   );
// }

// ══ TAB: CLUSTER MAP ═════════════════════════════════════════════════════════
// function ClusterMap({ qp }) {
//   const { data, loading } = useFetch(`${API_BASE}/cluster-map${qs(qp)}`);
//   const [selectedCluster, setSelected] = useState(null);
//   const [expanded, setExpanded] = useState(false);
//   const { data: drill, loading: drillLoading } = useFetch(
//     selectedCluster != null ? `${API_BASE}/cluster-drilldown/${selectedCluster}${qs(qp)}` : null
//   );

//   if (loading) return <Loader />;
//   if (!data) return <Empty />;

//   const clusterTable = (
//     <div className="overflow-auto cyber-scroll max-h-[70vh]">
//       <table className="w-full text-left border-collapse">
//         <thead className="sticky top-0 bg-[#070d1a] z-10">
//           <tr>{["ID","Monitor","Subcluster","Template","Events","Size","Freq Anom","Avg P(Alert)"].map(h=>(
//             <th key={h} className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-500 pb-3 pr-5 border-b border-white/5 whitespace-nowrap">{h}</th>
//           ))}</tr>
//         </thead>
//         <tbody>
//           {data.clusters?.slice(0,500).map((row,i)=>(
//             <tr key={i}
//               className={`border-b border-white/[0.03] cursor-pointer transition-all ${selectedCluster===row.cluster_id?"bg-cyan-500/[0.06]":"hover:bg-white/[0.02]"}`}
//               onClick={()=>setSelected(row.cluster_id)}>
//               <td className="font-jetbrains text-[10px] md:text-[11px] text-cyan-400 py-2.5 pr-5">{row.cluster_id}</td>
//               <td className="font-jetbrains text-[10px] md:text-[11px] text-slate-300 pr-5 max-w-[140px] truncate">{row.topic}</td>
//               <td className="font-jetbrains text-[10px] md:text-[11px] text-slate-300 pr-5">{row.subcluster}</td>
//               <td className="font-jetbrains text-[10px] md:text-[11px] text-slate-500 pr-5 max-w-[260px] truncate">{row.template}</td>
//               <td className="font-jetbrains text-[10px] md:text-[11px] text-white font-bold pr-5">{row.count}</td>
//               <td className="font-jetbrains text-[10px] md:text-[11px] text-slate-300 pr-5">{row.cluster_size}</td>
//               <td className="font-jetbrains text-[10px] md:text-[11px] pr-5">{row.freq_anomalies>0?<span className="text-amber-400 font-bold">{row.freq_anomalies}</span>:<span className="text-slate-700">0</span>}</td>
//               <td className="font-jetbrains text-[10px] md:text-[11px] text-slate-300">{row.avg_ml_p_alert?.toFixed(3)??"—"}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );

//   return (
//     <div className="space-y-4">
//       <ClusterVectorSpace qp={qp} onSelect={setSelected} />
//       <Panel>
//         <SectionHead title="All Clusters" icon={GitMerge}
//           extra={
//             <div className="flex items-center gap-3">
//               <span className="font-jetbrains text-[10px] text-slate-600 uppercase tracking-widest hidden md:inline">Click row to drill</span>
//               <button
//                 onClick={() => setExpanded(true)}
//                 className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
//               >
//                 Big View
//               </button>
//             </div>
//           } />
//         {clusterTable}
//       </Panel>

//       <AnimatePresence>
//         {selectedCluster != null && (
//           <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
//             <Panel>
//               <SectionHead title={`Drilldown — Cluster #${selectedCluster}`} icon={Crosshair}
//                 extra={<button onClick={()=>setSelected(null)} className="text-slate-600 hover:text-white transition-colors"><X size={14}/></button>} />
//               {drillLoading ? <Loader /> : (
//                 <DataTable rows={drill??[]} cols={[
//                   {key:"timestamp",label:"Time",render:v=><span className="text-slate-500">{fmtTs(v)}</span>},
//                   {key:"host"},{key:"topic"},{key:"subcluster"},
//                   {key:"severity",label:"Sev",render:v=><SevBadge v={v}/>},
//                   {key:"ml_severity",label:"ML Sev",render:v=><SevBadge v={v}/>},
//                   {key:"ml_confidence",label:"Conf",render:v=>v!=null?v.toFixed(3):"—"},
//                   {key:"template"},{key:"raw_log",label:"Raw Log"},
//                 ]}/>
//               )}
//             </Panel>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {data.new_clusters?.length>0 && (
//         <Panel>
//           <SectionHead title="Newly Discovered Clusters" icon={Zap}/>
//           <DataTable rows={data.new_clusters} cols={[
//             {key:"timestamp",label:"Time",render:v=><span className="text-slate-500">{fmtTs(v)}</span>},
//             {key:"host"},{key:"topic"},
//             {key:"cluster_id",label:"ID",render:v=><span className="text-cyan-400">{v}</span>},
//             {key:"template"},{key:"raw_log",label:"Raw"},
//           ]}/>
//         </Panel>
//       )}

//       {data.growth?.length>0 && (
//         <Panel>
//           <SectionHead title="Cluster Size Growth" icon={BarChart2}/>
//           <ResponsiveContainer width="100%" height={220}>
//             <LineChart data={data.growth.slice(-500)}>
//               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
//               <XAxis dataKey="timestamp" hide/>
//               <YAxis tick={{fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.2)"}} axisLine={false} tickLine={false}/>
//               <Tooltip content={<CT/>}/>
//               <Line type="monotone" dataKey="cluster_size" stroke="#a855f7" dot={false} strokeWidth={1.5}/>
//             </LineChart>
//           </ResponsiveContainer>
//         </Panel>
//       )}

//       <AnimatePresence>
//         {expanded && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[1200] bg-[#020617]/95 backdrop-blur-md p-4 md:p-8"
//           >
//             <motion.div
//               initial={{ scale: 0.98, y: 8 }}
//               animate={{ scale: 1, y: 0 }}
//               exit={{ scale: 0.98, y: 8 }}
//               className="h-full max-w-[1800px] mx-auto bg-[#070d1a] border border-white/10 rounded-3xl p-5 md:p-6 overflow-hidden"
//             >
//               <SectionHead
//                 title="Cluster Map — Big View"
//                 icon={GitMerge}
//                 extra={
//                   <button
//                     onClick={() => setExpanded(false)}
//                     className="text-slate-500 hover:text-white transition-colors"
//                   >
//                     <X size={18} />
//                   </button>
//                 }
//               />
//               <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)] gap-5 h-[calc(100%-3rem)]">
//                 <div className="min-w-0">
//                   {clusterTable}
//                 </div>
//                 <Panel className="h-full overflow-auto">
//                   <SectionHead
//                     title={selectedCluster != null ? `Drilldown — Cluster #${selectedCluster}` : "Cluster Drilldown"}
//                     icon={Crosshair}
//                     extra={selectedCluster == null ? <span className="font-jetbrains text-[10px] text-slate-600 uppercase">Select a cluster row</span> : null}
//                   />
//                   {selectedCluster == null ? (
//                     <Empty msg="Select a cluster to inspect events" />
//                   ) : drillLoading ? (
//                     <Loader />
//                   ) : (
//                     <DataTable rows={drill??[]} cols={[
//                       {key:"timestamp",label:"Time",render:v=><span className="text-slate-500">{fmtTs(v)}</span>},
//                       {key:"host"},{key:"topic"},{key:"subcluster"},
//                       {key:"severity",label:"Sev",render:v=><SevBadge v={v}/>},
//                       {key:"ml_severity",label:"ML Sev",render:v=><SevBadge v={v}/>},
//                       {key:"ml_confidence",label:"Conf",render:v=>v!=null?v.toFixed(3):"—"},
//                       {key:"template"},{key:"raw_log",label:"Raw Log"},
//                     ]} maxRows={250}/>
//                   )}
//                 </Panel>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }







// ══════════════════════════════════════════════════════════════════════════════
//  CLUSTER MAP — FULL REDESIGN
//  Drop-in replacement for ClusterVectorSpace + ClusterMap in ClusterDashboard
//
//  Design direction: "Tactical Ops Room" — dark military-grade aesthetic,
//  scanline texture, glowing nodes, split-panel drilldown, animated radar sweep.
//  Every interaction has weight and feedback.
// ══════════════════════════════════════════════════════════════════════════════

// ── paste these imports at the top of your existing file if not present ───────
// import { motion, AnimatePresence } from "framer-motion";
// The rest of the helpers (useFetch, qs, fmtTs, SevBadge, etc.) come from
// your existing ClusterDashboard file — this file only exports replacements
// for ClusterVectorSpace and ClusterMap.

const TOPIC_COLORS = {
  "filesystem.monitor": "#22d3ee",
  "network.monitor":    "#f43f5e",
  "process.monitor":    "#fbbf24",
  "module.monitor":     "#c084fc",
  "auth.monitor":       "#34d399",
  "registry.monitor":   "#60a5fa",
  "log.monitor":        "#f472b6",
  "dns.monitor":        "#a3e635",
};
const topicColor = t => TOPIC_COLORS[t] ?? "#64748b";

// ── Severity gradient fills ───────────────────────────────────────────────────
const SEV_GLOW = {
  INFO:  "drop-shadow(0 0 6px rgba(34,211,238,0.55))",
  WARN:  "drop-shadow(0 0 8px rgba(251,191,36,0.65))",
  ALERT: "drop-shadow(0 0 12px rgba(239,68,68,0.8))",
};

// ── Tiny sparkline for cluster event count bar ────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = Math.max(4, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div className="h-1 rounded-full bg-white/5 overflow-hidden w-full">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ── Animated scan-line overlay (pure CSS, no JS cost) ────────────────────────
const ScanLines = () => (
  <div
    className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden z-10"
    style={{
      backgroundImage:
        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
    }}
  />
);

// ── Radar sweep ring (SVG animation) ─────────────────────────────────────────
function RadarSweep({ cx, cy, r }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(34,211,238,0.06)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r * 0.67} fill="none" stroke="rgba(34,211,238,0.04)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r * 0.33} fill="none" stroke="rgba(34,211,238,0.04)" strokeWidth="1" />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="rgba(34,211,238,0.04)" strokeWidth="1" />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="rgba(34,211,238,0.04)" strokeWidth="1" />
      {/* Sweep hand */}
      <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: "radarSpin 4s linear infinite" }}>
        <line
          x1={cx} y1={cy} x2={cx} y2={cy - r}
          stroke="rgba(34,211,238,0.5)" strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx} ${cy} L ${cx + r * Math.sin(-0.6)} ${cy - r * Math.cos(-0.6)} A ${r} ${r} 0 0 1 ${cx} ${cy - r} Z`}
          fill="url(#sweepGrad)"
          opacity="0.18"
        />
      </g>
    </g>
  );
}

// ── Main redesigned vector space ──────────────────────────────────────────────
function ClusterVectorSpace({ qp, onSelect, selectedId }) {
  const { data, loading } = useFetch(`${API_BASE}/cluster-vector${qs(qp)}`);
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const W = 900, H = 500, PAD = 60;

  const handleMouseMove = e => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  if (loading) return (
    <div className="h-[500px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border border-cyan-500/30 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping" />
          <RefreshCw size={20} className="animate-spin text-cyan-400" />
        </div>
        <span className="font-jetbrains text-[9px] text-cyan-500/60 uppercase tracking-[0.4em]">Vectorising clusters…</span>
      </div>
    </div>
  );

  if (!data?.points?.length) return (
    <div className="h-[500px] flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-xl border border-white/10 flex items-center justify-center">
          <GitMerge size={20} className="text-slate-600" />
        </div>
        <p className="font-jetbrains text-[10px] text-slate-600 uppercase tracking-widest">
          {data?.error === "need_2_clusters" ? "Need ≥ 2 clusters" : "No data yet"}
        </p>
      </div>
    </div>
  );

  const pts = data.points;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xR = xMax - xMin || 1, yR = yMax - yMin || 1;
  const nx = x => PAD + ((x - xMin) / xR) * (W - PAD * 2);
  const ny = y => PAD + ((y - yMin) / yR) * (H - PAD * 2);
  const maxCount = Math.max(...pts.map(p => p.count), 1);
  const bubbleR = count => Math.max(8, Math.sqrt(count / maxCount) * 52);
  const uniqueTopics = [...new Set(pts.map(p => p.topic))].sort();
  const cxRadar = W / 2, cyRadar = H / 2, rRadar = Math.min(W, H) / 2 - PAD;

  return (
    <div className="relative" ref={containerRef} onMouseMove={handleMouseMove}>
      <style>{`
        @keyframes radarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseRing { 0%,100% { opacity:.6; r:0; } 60% { opacity:0; } }
        @keyframes nodeAppear { from { opacity:0; transform:scale(0); } to { opacity:1; transform:scale(1); } }
      `}</style>

      {/* Header bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-6 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          <span className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">
            Template Vector Space
          </span>
          <span className="font-jetbrains text-[9px] text-slate-600 uppercase tracking-widest">
            TF-IDF + PCA · {pts.length} clusters
          </span>
        </div>
        <div className="flex items-center gap-4">
          {[
            { dot: "w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]", label: "ML Alert" },
            { dot: "w-3 h-3 rounded-full border border-dashed border-amber-400", label: "Freq Anom" },
            { shape: "diamond", label: "ALERT cluster" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {item.dot && <span className={`shrink-0 inline-block ${item.dot}`} />}
              {item.shape === "diamond" && (
                <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
                  <rect x="2" y="2" width="6" height="6" fill="#ef4444" fillOpacity="0.8" transform="rotate(45,5,5)" />
                </svg>
              )}
              <span className="font-jetbrains text-[8.5px] text-slate-500 uppercase tracking-wider">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.06]"
        style={{ background: "linear-gradient(135deg, #020917 0%, #040d1f 50%, #020917 100%)" }}>
        <ScanLines />

        {/* Corner decorations */}
        {[["top-0 left-0","0 0,16 0,0 16"],["top-0 right-0","0 0,0 16,16 0"],
          ["bottom-0 left-0","0 16,16 16,0 0"],["bottom-0 right-0","16 0,16 16,0 16"]].map(([pos, pts], i) => (
          <div key={i} className={`absolute ${pos} w-4 h-4 z-20`}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <polyline points={pts} fill="none" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" />
            </svg>
          </div>
        ))}

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full select-none"
          style={{ display: "block" }}
        >
          <defs>
            <radialGradient id="sweepGrad" cx="0%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.3" />
            </radialGradient>
            <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Ambient background glow */}
          <ellipse cx={W/2} cy={H/2} rx={W*0.4} ry={H*0.4} fill="url(#bgGlow)" />

          {/* Radar grid */}
          <RadarSweep cx={cxRadar} cy={cyRadar} r={rRadar} />

          {/* Fine grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map(t => (
            <g key={t} opacity="0.06">
              <line x1={PAD + t*(W-PAD*2)} y1={PAD} x2={PAD + t*(W-PAD*2)} y2={H-PAD} stroke="#22d3ee" strokeWidth="1"/>
              <line x1={PAD} y1={PAD + t*(H-PAD*2)} x2={W-PAD} y2={PAD + t*(H-PAD*2)} stroke="#22d3ee" strokeWidth="1"/>
            </g>
          ))}

          {/* Axis labels */}
          <text x={W/2} y={H-10} textAnchor="middle" fill="rgba(34,211,238,0.2)" fontSize="8" fontFamily="JetBrains Mono" letterSpacing="3">PCA-1</text>
          <text x={14} y={H/2} textAnchor="middle" fill="rgba(34,211,238,0.2)" fontSize="8" fontFamily="JetBrains Mono" letterSpacing="3" transform={`rotate(-90,14,${H/2})`}>PCA-2</text>

          {/* Connection lines between selected and hovered */}
          {hovered && selectedId && hovered.cluster_id !== selectedId && (() => {
            const sel = pts.find(p => p.cluster_id === selectedId);
            if (!sel) return null;
            return (
              <line
                x1={nx(hovered.x)} y1={ny(hovered.y)}
                x2={nx(sel.x)} y2={ny(sel.y)}
                stroke="rgba(34,211,238,0.12)" strokeWidth="1" strokeDasharray="4 3"
              />
            );
          })()}

          {/* Bubbles — largest first (behind), smallest last (on top) */}
          {[...pts].sort((a, b) => b.count - a.count).map((pt, i) => {
            const cx  = nx(pt.x);
            const cy  = ny(pt.y);
            const r   = bubbleR(pt.count);
            const col = topicColor(pt.topic);
            const isHov = hovered?.cluster_id === pt.cluster_id;
            const isSel = selectedId === pt.cluster_id;
            const isAlert = pt.severity === "ALERT";
            const isWarn  = pt.severity === "WARN";
            const isMlAlert  = isAlert && (pt.ml_alert_count ?? 0) > 5;
            const isFreqAnom = (pt.freq_anomalies ?? 0) > 0;

            return (
              <g
                key={pt.cluster_id ?? i}
                style={{
                  cursor: "pointer",
                  filter: isHov || isSel ? SEV_GLOW[pt.severity] : undefined,
                  opacity: mounted ? 1 : 0,
                  animation: mounted ? `nodeAppear 0.4s ease-out ${Math.min(i * 0.03, 1)}s both` : undefined,
                }}
                onMouseEnter={() => setHovered(pt)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect?.(pt.cluster_id)}
              >
                {/* Selected ring — pulsing */}
                {isSel && (
                  <>
                    <circle cx={cx} cy={cy} r={r + 10} fill="none"
                      stroke="rgba(34,211,238,0.6)" strokeWidth="1.5"
                      strokeDasharray="6 3"
                      style={{ animation: "radarSpin 8s linear infinite", transformOrigin: `${cx}px ${cy}px` }}
                    />
                    <circle cx={cx} cy={cy} r={r + 4} fill="none"
                      stroke="rgba(34,211,238,0.3)" strokeWidth="1"
                    />
                  </>
                )}

                {/* Freq-anomaly dashed ring */}
                {isFreqAnom && (
                  <circle cx={cx} cy={cy} r={r + 7}
                    fill="none" stroke="#fbbf24" strokeWidth="1.5"
                    strokeDasharray="4 3" opacity={isHov ? 1 : 0.6}
                  />
                )}

                {/* ML-alert glow ring */}
                {isMlAlert && (
                  <circle cx={cx} cy={cy} r={r + (isFreqAnom ? 14 : 7)}
                    fill="none" stroke="#ef4444" strokeWidth="1.5"
                    opacity={isHov ? 1 : 0.7}
                  />
                )}

                {/* Hover glow aura */}
                {(isHov || isSel) && (
                  <circle cx={cx} cy={cy} r={r + 3} fill={col} fillOpacity="0.12" />
                )}

                {/* Main shape */}
                {isAlert ? (
                  // Diamond for ALERT
                  <rect
                    x={cx - r * 0.78} y={cy - r * 0.78}
                    width={r * 1.56} height={r * 1.56}
                    fill={col}
                    fillOpacity={isHov || isSel ? 0.95 : 0.82}
                    stroke={isHov || isSel ? "white" : col}
                    strokeWidth={isHov || isSel ? 2 : 0.5}
                    strokeOpacity={0.6}
                    transform={`rotate(45, ${cx}, ${cy})`}
                    rx="2"
                    style={{ transition: "fill-opacity 0.15s, stroke-width 0.15s" }}
                  />
                ) : (
                  // Circle for WARN/INFO
                  <circle
                    cx={cx} cy={cy} r={r}
                    fill={col}
                    fillOpacity={isHov || isSel ? 0.92 : isWarn ? 0.78 : 0.58}
                    stroke={isHov || isSel ? "rgba(255,255,255,0.8)" : isWarn ? col : "rgba(0,0,0,0.3)"}
                    strokeWidth={isHov || isSel ? 1.5 : isWarn ? 1 : 0.5}
                    style={{ transition: "fill-opacity 0.15s, r 0.15s" }}
                  />
                )}

                {/* Inner detail for large bubbles */}
                {r > 18 && (
                  isAlert ? (
                    <rect
                      x={cx - r * 0.35} y={cy - r * 0.35}
                      width={r * 0.7} height={r * 0.7}
                      fill="none"
                      stroke="rgba(0,0,0,0.3)"
                      strokeWidth="1"
                      transform={`rotate(45, ${cx}, ${cy})`}
                      rx="1"
                    />
                  ) : (
                    <circle cx={cx} cy={cy} r={r * 0.45}
                      fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
                  )
                )}

                {/* Label for very large bubbles */}
                {r > 26 && (
                  <text
                    x={cx} y={cy + r + 14}
                    textAnchor="middle"
                    fill={col} fillOpacity="0.7"
                    fontSize="8" fontFamily="JetBrains Mono"
                    style={{ pointerEvents: "none" }}
                  >
                    {pt.subcluster?.split("·").slice(-1)[0]?.slice(0, 14) ?? ""}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              key={hovered.cluster_id}
              initial={{ opacity: 0, scale: 0.92, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.12 }}
              className="absolute z-30 pointer-events-none w-72"
              style={{
                left: Math.min(mousePos.x + 16, (containerRef.current?.clientWidth ?? 500) - 296),
                top:  Math.max(mousePos.y - 8, 8),
              }}
            >
              {/* Tooltip */}
              <div className="bg-[#040d1f]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Colored top strip */}
                <div className="h-1" style={{ background: topicColor(hovered.topic) }} />

                <div className="p-4">
                  {/* Title */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-jetbrains text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">
                        {hovered.topic?.replace(".monitor", "")}
                      </p>
                      <p className="font-roboto-condensed text-[11px] font-black text-white uppercase tracking-wide leading-tight truncate">
                        {hovered.subcluster}
                      </p>
                    </div>
                    <div className={`shrink-0 px-2.5 py-1 rounded-lg font-jetbrains text-[9px] font-bold uppercase tracking-widest border ${
                      hovered.severity === "ALERT" ? "bg-red-500/15 text-red-400 border-red-500/25" :
                      hovered.severity === "WARN"  ? "bg-amber-500/15 text-amber-400 border-amber-500/25" :
                      "bg-cyan-500/15 text-cyan-400 border-cyan-500/25"
                    }`}>
                      {hovered.severity}
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { label: "Cluster ID", val: `#${hovered.cluster_id}`, color: "text-cyan-400" },
                      { label: "Events",     val: hovered.count?.toLocaleString(), color: "text-white font-bold" },
                      { label: "P(Alert)",   val: hovered.avg_ml_p_alert?.toFixed(3),
                        color: hovered.avg_ml_p_alert > 0.75 ? "text-red-400 font-bold" : "text-slate-300" },
                      { label: "ML Alerts",  val: hovered.ml_alert_count ?? 0,
                        color: (hovered.ml_alert_count ?? 0) > 5 ? "text-red-400 font-bold" : "text-slate-400" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="bg-white/[0.04] rounded-lg px-2.5 py-2">
                        <p className="font-jetbrains text-[8px] text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
                        <p className={`font-jetbrains text-[11px] ${color}`}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Badges */}
                  <div className="flex gap-2 flex-wrap">
                    {hovered.freq_anomalies > 0 && (
                      <span className="font-jetbrains text-[8px] px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-wider">
                        ⚠ {hovered.freq_anomalies} freq anom
                      </span>
                    )}
                    {(hovered.ml_alert_count ?? 0) > 5 && (
                      <span className="font-jetbrains text-[8px] px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 uppercase tracking-wider">
                        ◈ ML flagged
                      </span>
                    )}
                  </div>

                  {/* Template */}
                  <p className="mt-3 font-jetbrains text-[8px] text-slate-600 leading-relaxed truncate"
                    title={hovered.template}>
                    {hovered.template}
                  </p>

                  <p className="mt-2 font-jetbrains text-[8px] text-cyan-500/40 uppercase tracking-widest">
                    Click to drill down →
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 px-1 items-center">
        {uniqueTopics.map(t => (
          <div key={t} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: topicColor(t), boxShadow: `0 0 5px ${topicColor(t)}` }}/>
            <span className="font-jetbrains text-[8.5px] text-slate-500 uppercase tracking-wider">{t.replace(".monitor","")}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 shadow-[0_0_5px_#ef4444]"/>
            <span className="font-jetbrains text-[8.5px] text-slate-500 uppercase">ML Alert ring</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-dashed border-amber-400 shrink-0 inline-block"/>
            <span className="font-jetbrains text-[8.5px] text-slate-500 uppercase">Freq Anomaly</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
              <rect x="2" y="2" width="6" height="6" fill="#ef4444" fillOpacity="0.8" transform="rotate(45,5,5)"/>
            </svg>
            <span className="font-jetbrains text-[8.5px] text-slate-500 uppercase">ALERT cluster</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Redesigned ClusterMap tab ─────────────────────────────────────────────────
function ClusterMap({ qp }) {
  const { data, loading } = useFetch(`${API_BASE}/cluster-map${qs(qp)}`);
  const [selectedCluster, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("count"); // count | freq | p_alert
  const [expanded, setExpanded] = useState(false);

  const { data: drill, loading: drillLoading } = useFetch(
    selectedCluster != null ? `${API_BASE}/cluster-drilldown/${selectedCluster}${qs(qp)}` : null
  );

  const handleSelect = id => setSelected(prev => prev === id ? null : id);

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-cyan-400/40 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <GitMerge size={14} className="text-cyan-400" />
          </div>
        </div>
        <span className="font-jetbrains text-[9px] text-cyan-500/50 uppercase tracking-[0.4em]">Loading cluster map…</span>
      </div>
    </div>
  );
  if (!data) return <Empty />;

  // Filter + sort cluster list
  const filtered = (data.clusters ?? [])
    .filter(r =>
      !searchTerm ||
      r.subcluster?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.template?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.topic?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) =>
      sortBy === "freq"    ? (b.freq_anomalies - a.freq_anomalies) :
      sortBy === "p_alert" ? (b.avg_ml_p_alert - a.avg_ml_p_alert) :
      (b.count - a.count)
    );

  const maxCount = Math.max(...filtered.map(r => r.count), 1);

  // ── Cluster row ─────────────────────────────────────────────────────────────
  const ClusterRow = ({ row, i }) => {
    const isSel = selectedCluster === row.cluster_id;
    const col   = topicColor(row.topic);
    return (
      <motion.div
        key={row.cluster_id}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(i * 0.02, 0.4) }}
        onClick={() => handleSelect(row.cluster_id)}
        className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all border ${
          isSel
            ? "bg-cyan-500/[0.07] border-cyan-500/25 shadow-[inset_0_0_20px_rgba(34,211,238,0.04)]"
            : "border-transparent hover:bg-white/[0.03] hover:border-white/[0.06]"
        }`}
      >
        {/* Selection indicator */}
        {isSel && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-r-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        )}

        {/* Topic color dot */}
        <div className="shrink-0 w-2.5 h-2.5 rounded-full" style={{ background: col, boxShadow: `0 0 6px ${col}60` }} />

        {/* Main info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-jetbrains text-[10px] text-cyan-400/70">#{row.cluster_id}</span>
            <span className="font-roboto-condensed text-[10px] font-black text-white uppercase tracking-wide truncate">
              {row.subcluster}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <MiniBar value={row.count} max={maxCount} color={col} />
            <span className="font-jetbrains text-[9px] text-slate-500 shrink-0">{row.count?.toLocaleString()}</span>
          </div>
        </div>

        {/* Monitor badge */}
        <span className="shrink-0 font-jetbrains text-[8px] text-slate-600 uppercase tracking-wider hidden xl:block">
          {row.topic?.replace(".monitor", "")}
        </span>

        {/* Anomaly indicators */}
        <div className="shrink-0 flex items-center gap-1.5">
          {row.freq_anomalies > 0 && (
            <span className="font-jetbrains text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/15">
              ⚡{row.freq_anomalies}
            </span>
          )}
          {row.avg_ml_p_alert > 0.5 && (
            <span className={`font-jetbrains text-[8px] px-1.5 py-0.5 rounded border ${
              row.avg_ml_p_alert > 0.75
                ? "bg-red-500/10 text-red-400 border-red-500/15"
                : "bg-amber-500/10 text-amber-400 border-amber-500/15"
            }`}>
              {row.avg_ml_p_alert?.toFixed(2)}
            </span>
          )}
          <ChevronLeft
            size={12}
            className={`transition-transform ${isSel ? "rotate-180 text-cyan-400" : "rotate-90 text-slate-700 group-hover:text-slate-500"}`}
          />
        </div>
      </motion.div>
    );
  };

  // ── Drilldown panel content ─────────────────────────────────────────────────
  const DrillPanel = () => {
    if (!selectedCluster) return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl border border-white/[0.06] flex items-center justify-center">
          <Crosshair size={24} className="text-slate-700" />
        </div>
        <div>
          <p className="font-roboto-condensed text-[11px] font-black text-slate-500 uppercase tracking-widest">Select a cluster</p>
          <p className="font-jetbrains text-[9px] text-slate-700 uppercase tracking-wider mt-1">Click any cluster to inspect events</p>
        </div>
        <div className="mt-4 space-y-2 w-full max-w-xs">
          {[
            { label: "Total Clusters", val: (data.clusters?.length ?? 0).toLocaleString(), color: "text-cyan-400" },
            { label: "With Freq Anom", val: (data.clusters?.filter(c => c.freq_anomalies > 0).length ?? 0).toLocaleString(), color: "text-amber-400" },
            { label: "New Clusters",   val: (data.new_clusters?.length ?? 0).toLocaleString(), color: "text-emerald-400" },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <span className="font-jetbrains text-[9px] text-slate-600 uppercase tracking-widest">{label}</span>
              <span className={`font-jetbrains text-[11px] font-bold ${color}`}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    );

    const selRow = data.clusters?.find(c => c.cluster_id === selectedCluster);

    return (
      <div className="h-full flex flex-col">
        {/* Drilldown header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/[0.06]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Crosshair size={12} className="text-cyan-400 shrink-0" />
              <span className="font-jetbrains text-[8px] text-slate-500 uppercase tracking-widest">Cluster #{selectedCluster}</span>
            </div>
            <p className="font-roboto-condensed text-[12px] font-black text-white uppercase tracking-wide truncate">
              {selRow?.subcluster ?? "—"}
            </p>
            <p className="font-jetbrains text-[9px] text-slate-600 mt-1 truncate">{selRow?.template}</p>
          </div>
          <button
            onClick={() => setSelected(null)}
            className="shrink-0 w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-white/20 transition-all"
          >
            <X size={13} />
          </button>
        </div>

        {/* Stats row */}
        {selRow && (
          <div className="grid grid-cols-3 gap-px bg-white/[0.04] border-b border-white/[0.04]">
            {[
              { label: "Events", val: selRow.count?.toLocaleString(), color: "text-white" },
              { label: "Size",   val: selRow.cluster_size, color: "text-purple-400" },
              { label: "Freq ⚡", val: selRow.freq_anomalies, color: selRow.freq_anomalies > 0 ? "text-amber-400" : "text-slate-600" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-[#040d1f] px-3 py-2.5 text-center">
                <p className="font-jetbrains text-[8px] text-slate-600 uppercase tracking-widest">{label}</p>
                <p className={`font-jetbrains text-[13px] font-bold ${color}`}>{val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Event list */}
        <div className="flex-1 overflow-auto cyber-scroll">
          {drillLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={16} className="animate-spin text-cyan-400 mr-2" />
              <span className="font-jetbrains text-[9px] text-slate-600 uppercase tracking-widest">Loading events…</span>
            </div>
          ) : !drill?.length ? (
            <div className="py-12 text-center">
              <p className="font-jetbrains text-[9px] text-slate-600 uppercase tracking-widest">No events found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {drill.map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  className="px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-jetbrains text-[8.5px] text-slate-600">{fmtTs(row.timestamp)}</span>
                    <div className="flex items-center gap-1.5">
                      <SevBadge v={row.severity} />
                      {row.ml_severity && row.ml_severity !== row.severity && (
                        <span className="font-jetbrains text-[8px] text-slate-600">→</span>
                      )}
                      {row.ml_severity && row.ml_severity !== row.severity && (
                        <SevBadge v={row.ml_severity} />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-jetbrains text-[9px] text-cyan-400/70">{row.host}</span>
                    {row.ml_confidence != null && (
                      <span className="font-jetbrains text-[8px] text-slate-600">
                        conf: <span className="text-slate-400">{row.ml_confidence?.toFixed(3)}</span>
                      </span>
                    )}
                  </div>
                  <p className="font-jetbrains text-[9px] text-slate-400 truncate leading-relaxed" title={row.raw_log}>
                    {row.raw_log}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* ── Vector space ── */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl">
        <ClusterVectorSpace qp={qp} onSelect={handleSelect} selectedId={selectedCluster} />
      </div>

      {/* ── Split panel: cluster list + drilldown ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4">

        {/* Left: cluster list */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-xl">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2 min-w-0">
              <GitMerge size={13} className="text-cyan-400 shrink-0" />
              <span className="font-roboto-condensed text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
                All Clusters
              </span>
              <span className="font-jetbrains text-[9px] text-slate-600 uppercase">
                ({filtered.length} / {data.clusters?.length ?? 0})
              </span>
            </div>
            <div className="flex-1 relative">
              <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                className="w-full font-jetbrains text-[10px] bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-slate-300 outline-none focus:border-cyan-500/30 uppercase placeholder:text-slate-700 transition-colors"
                placeholder="search subcluster / template…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {[
                { key: "count",   label: "Events" },
                { key: "freq",    label: "Freq ⚡" },
                { key: "p_alert", label: "P(Alert)" },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={`font-jetbrains text-[8px] uppercase tracking-widest px-2.5 py-1.5 rounded-lg border transition-all ${
                    sortBy === s.key
                      ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-400"
                      : "border-white/[0.06] text-slate-600 hover:text-slate-400 hover:border-white/10"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setExpanded(true)}
              className="shrink-0 font-jetbrains text-[8px] uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 text-slate-500 hover:text-white hover:border-white/20 transition-all"
            >
              ⤢ Full
            </button>
          </div>

          {/* Cluster rows */}
          <div className="overflow-y-auto max-h-[480px] cyber-scroll py-2 px-2">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <p className="font-jetbrains text-[9px] text-slate-600 uppercase tracking-widest">No clusters match filter</p>
              </div>
            ) : (
              filtered.slice(0, 200).map((row, i) => <ClusterRow key={row.cluster_id} row={row} i={i} />)
            )}
          </div>
        </div>

        {/* Right: drilldown panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCluster ?? "empty"}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-xl"
            style={{ minHeight: "400px" }}
          >
            <DrillPanel />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── New clusters alert ── */}
      <AnimatePresence>
        {data.new_clusters?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.02] border border-emerald-500/15 rounded-2xl p-5 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap size={13} className="text-emerald-400" />
              <span className="font-roboto-condensed text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
                Newly Discovered Clusters
              </span>
              <span className="font-jetbrains text-[9px] text-slate-600 uppercase">
                {data.new_clusters.length} new
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {data.new_clusters.slice(0, 6).map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSelect(c.cluster_id)}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 cursor-pointer hover:border-emerald-500/20 hover:bg-emerald-500/[0.04] transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-jetbrains text-[9px] text-cyan-400/70">#{c.cluster_id}</span>
                    <span className="font-jetbrains text-[8px] text-slate-600 uppercase">{c.topic?.replace(".monitor","")}</span>
                    <span className="ml-auto font-jetbrains text-[8px] text-slate-700 group-hover:text-emerald-400 transition-colors">→</span>
                  </div>
                  <p className="font-jetbrains text-[9px] text-slate-400 truncate">{c.raw_log}</p>
                  <p className="font-jetbrains text-[8px] text-slate-600 mt-1">{fmtTs(c.timestamp)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cluster growth chart ── */}
      {data.growth?.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={13} className="text-purple-400" />
            <span className="font-roboto-condensed text-[10px] font-black uppercase tracking-[0.25em] text-purple-400">
              Cluster Size Growth
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.growth.slice(-600)}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false}/>
              <XAxis dataKey="timestamp" hide/>
              <YAxis tick={{fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.2)"}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Area type="monotone" dataKey="cluster_size" stroke="#a855f7" strokeWidth={1.5} fill="url(#growthGrad)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Fullscreen modal ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] bg-[#010810]/97 backdrop-blur-xl p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.97, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: 12 }}
              className="h-full max-w-[1800px] mx-auto bg-[#040d1f] border border-white/[0.08] rounded-3xl overflow-hidden flex flex-col"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <span className="font-roboto-condensed text-[11px] font-black uppercase tracking-[0.3em] text-cyan-400">
                    Cluster Intelligence — Full View
                  </span>
                  <span className="font-jetbrains text-[9px] text-slate-600 uppercase">
                    {data.clusters?.length} clusters
                  </span>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-white hover:border-white/20 transition-all"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal body — 3-column layout */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 xl:grid-cols-[280px_1fr_380px]">

                {/* Col 1: compact cluster list */}
                <div className="border-r border-white/[0.05] overflow-y-auto cyber-scroll py-2 px-2">
                  <div className="px-3 py-2 mb-2">
                    <input
                      className="w-full font-jetbrains text-[9px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-300 outline-none focus:border-cyan-500/30 uppercase placeholder:text-slate-700"
                      placeholder="search…"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {filtered.slice(0, 500).map((row, i) => {
                    const isSel = selectedCluster === row.cluster_id;
                    const col   = topicColor(row.topic);
                    return (
                      <div
                        key={row.cluster_id}
                        onClick={() => handleSelect(row.cluster_id)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-0.5 ${
                          isSel ? "bg-cyan-500/[0.08] border border-cyan-500/20" : "hover:bg-white/[0.03] border border-transparent"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: col }} />
                        <span className="font-jetbrains text-[9px] text-slate-400 truncate flex-1">{row.subcluster}</span>
                        <span className="font-jetbrains text-[9px] text-slate-600 shrink-0">{row.count}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Col 2: vector space */}
                <div className="overflow-auto p-5 border-r border-white/[0.05]">
                  <ClusterVectorSpace qp={qp} onSelect={handleSelect} selectedId={selectedCluster} />
                </div>

                {/* Col 3: drilldown */}
                <div className="overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedCluster ?? "empty-modal"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full"
                    >
                      <DrillPanel />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// ══ TAB: ML INTEL ═════════════════════════════════════════════════════════════
function MLIntel({ qp }) {
  const { data, loading } = useFetch(`${API_BASE}/ml-intelligence${qs(qp)}`);
  if (loading) return <Loader />;
  if (!data) return <Empty msg="ML Intel API unreachable" />;
  if (!data.has_data) return (
    <Panel>
      <StatusBadge type="info">No events in current filter window</StatusBadge>
    </Panel>
  );

  const k        = data.kpis ?? {};
  const hasML    = data.has_ml === true;
  const sevDist  = data.severity_dist  ?? [];
  const scDist   = data.subcluster_sev ?? [];
  const scatterGroups = buildMlScatterGroups(data.scatter?.slice(0, 600) ?? []);

  // Top subclusters by alert count for the stacked bar
  const topSubs = [...new Set(scDist.map(r => r.subcluster))]
    .map(sc => {
      const rows = scDist.filter(r => r.subcluster === sc);
      const total = rows.reduce((s, r) => s + (r.count ?? 0), 0);
      const obj   = { subcluster: sc.length > 22 ? sc.slice(0, 22) + "…" : sc, total };
      rows.forEach(r => { obj[r.severity] = r.count ?? 0; });
      return obj;
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 14);

  return (
    <div className="space-y-4">

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Events",    value: fmtNum(k.total_events),              color: "text-cyan-400" },
          { label: "ML Scored",       value: fmtNum(k.ml_scored),                 color: "text-purple-400" },
          { label: "ISO Anomalies",   value: fmtNum(k.iso_anomalies),             color: "text-red-400" },
          { label: "Rule↔ML Disagree",value: fmtNum(k.disagreements),            color: "text-amber-400" },
        ].map(c => (
          <div key={c.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            <p className="font-roboto-condensed text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1.5">{c.label}</p>
            <p className={`font-jetbrains text-xl md:text-2xl font-black ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* No ML model notice */}
      {!hasML && (
        <Panel>
          <StatusBadge type="info">
            ML model not yet trained — showing rule-based severity analytics
          </StatusBadge>
          <p className="font-jetbrains text-[10px] text-slate-500 mt-3 leading-relaxed uppercase tracking-wider">
            Run <code className="text-cyan-400">python retrain.py</code> from{" "}
            <code className="text-purple-400">clustering/</code> to enable ML scoring.
          </p>
        </Panel>
      )}

      {/* Severity distribution — always shown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel>
          <SectionHead title="Final Severity Distribution" icon={ShieldAlert} />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sevDist} barCategoryGap="38%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="severity"
                tick={{ fontFamily: "JetBrains Mono", fontSize: 9, fill: "rgba(255,255,255,0.35)" }}
                axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontFamily: "JetBrains Mono", fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<CT />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {sevDist.map((d, i) => (
                  <Cell key={i} fill={SEV_COLOR[d.severity] ?? "#06b6d4"} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <SectionHead title="Top Subclusters by Severity" icon={Layers} />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topSubs} layout="vertical" barCategoryGap="22%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number"
                tick={{ fontFamily: "JetBrains Mono", fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
                axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="subcluster" width={150}
                tick={{ fontFamily: "JetBrains Mono", fontSize: 8, fill: "rgba(255,255,255,0.45)" }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<CT />} />
              {["ALERT", "WARN", "INFO"].map(s => (
                <Bar key={s} dataKey={s} stackId="a"
                  fill={SEV_COLOR[s]} fillOpacity={0.82} radius={s === "INFO" ? [0, 3, 3, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* ML-specific charts — only when model is active */}
      {hasML && (
        <>
          {k.avg_confidence != null && (
            <Panel>
              <SectionHead title="Confidence Distribution" icon={BrainCircuit}
                extra={<span className="font-jetbrains text-[10px] text-slate-600 uppercase">Avg: {k.avg_confidence}</span>} />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.confidence_hist ?? []} barCategoryGap="10%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="bin"
                    tick={{ fontFamily: "JetBrains Mono", fontSize: 8, fill: "rgba(255,255,255,0.3)" }}
                    axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontFamily: "JetBrains Mono", fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
                    axisLine={false} tickLine={false} />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {(data.confidence_hist ?? []).map((d, i) => (
                      <Cell key={i} fill={SEV_COLOR[d.severity] ?? "#06b6d4"} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          )}

          {scatterGroups.some(g => g.data.length > 0) && (
            <Panel>
              <SectionHead title="P(Alert) vs P(Warn) — ML Scatter"
                icon={Activity}
                extra={
                  <div className="flex items-center gap-3">
                    {scatterGroups.map(g => (
                      <div key={g.severity} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                        <span className="font-jetbrains text-[9px] uppercase tracking-widest text-slate-500">{g.severity}</span>
                      </div>
                    ))}
                  </div>
                }
              />
              <ResponsiveContainer width="100%" height={420}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis type="number" dataKey="ml_p_warn" name="P(WARN)" domain={[0, 1]} tickCount={6}
                    tick={{ fontFamily: "JetBrains Mono", fontSize: 9, fill: "rgba(255,255,255,0.28)" }}
                    axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey="ml_p_alert" name="P(ALERT)" domain={[0, 1]} tickCount={6}
                    tick={{ fontFamily: "JetBrains Mono", fontSize: 9, fill: "rgba(255,255,255,0.28)" }}
                    axisLine={false} tickLine={false} />
                  {/* <ReferenceLine y={ML_ALERT_THRESHOLD} stroke="#f43f5e" strokeDasharray="4 4" strokeOpacity={0.9}
                    ifOverflow="extendDomain"
                    label={{ value: "ALERT threshold", position: "insideTopRight", fill: "#f43f5e", fontSize: 9, fontFamily: "JetBrains Mono" }} /> */}
                  <Tooltip content={<CT />} />
                  {scatterGroups.map(g => (
                    <Scatter key={g.severity} name={g.severity} data={g.data}
                      fill={g.color} fillOpacity={g.severity === "INFO" ? 0.72 : 0.88}
                      stroke={g.color} strokeOpacity={0.55}
                      strokeWidth={g.severity === "ALERT" ? 1.2 : 0.6}
                      r={g.severity === "ALERT" ? 4 : 3} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </Panel>
          )}

          {(data.iso_anomalies?.length ?? 0) > 0 && (
            <Panel>
              <StatusBadge type="warn">{data.iso_anomalies.length} events flagged by IsolationForest</StatusBadge>
              <div className="mt-3">
                <DataTable rows={data.iso_anomalies} cols={[
                  { key: "timestamp", label: "Time", render: v => <span className="text-slate-500">{fmtTs(v)}</span> },
                  { key: "host" }, { key: "topic" }, { key: "subcluster" },
                  { key: "ml_confidence", label: "Conf", render: v => v?.toFixed(3) ?? "—" },
                  { key: "ml_p_alert",    label: "P(Alert)", render: v => v?.toFixed(3) ?? "—" },
                  { key: "severity", label: "Sev", render: v => <SevBadge v={v} /> },
                  { key: "raw_log", label: "Raw" },
                ]} />
              </div>
            </Panel>
          )}

          {(data.disagreements?.length ?? 0) > 0 && (
            <Panel>
              <StatusBadge type="warn">{data.disagreements.length} events where rule severity ≠ ML severity</StatusBadge>
              <div className="mt-3">
                <DataTable rows={data.disagreements} cols={[
                  { key: "timestamp", label: "Time", render: v => <span className="text-slate-500">{fmtTs(v)}</span> },
                  { key: "host" }, { key: "subcluster" },
                  { key: "rule_severity", label: "Rule", render: v => <SevBadge v={v} /> },
                  { key: "ml_severity",   label: "ML",   render: v => <SevBadge v={v} /> },
                  { key: "ml_confidence", label: "Conf", render: v => v?.toFixed(3) ?? "—" },
                  { key: "template" },
                ]} />
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
// ══ TAB: SEQUENCES ═══════════════════════════════════════════════════════════
function Sequences({ qp }) {
  const [selHost,setSelHost] = useState(null);
  const [winLen,setWinLen]   = useState(8);
  const {data,loading} = useFetch(`${API_BASE}/sequences${qs({...qp,host:selHost,window:winLen})}`);
  useEffect(()=>{ if(data?.hosts?.length && !selHost) setSelHost(data.hosts[0]); },[data]);
  if (loading) return <Loader/>;
  if (!data) return <Empty/>;
  return (
    <div className="space-y-4">
      {data.seq_anomalies?.length>0
        ?<Panel><StatusBadge type="alert">{data.seq_anomalies.length} sequence anomaly events</StatusBadge><div className="mt-3"><DataTable rows={data.seq_anomalies} cols={[
            {key:"timestamp",label:"Time",render:v=><span className="text-slate-500">{fmtTs(v)}</span>},
            {key:"host"},{key:"topic"},{key:"subcluster"},{key:"seq_anomaly",label:"Anomaly"},{key:"raw_log",label:"Raw"},
          ]}/></div></Panel>
        :<Panel><StatusBadge type="ok">No sequence anomalies in this window</StatusBadge></Panel>
      }
      {data.attack_patterns?.length>0 && (
        <Panel>
          <StatusBadge type="alert">{data.attack_patterns.length} known attack patterns matched</StatusBadge>
          <div className="mt-3">
            <DataTable rows={data.attack_patterns} cols={[
              {key:"host"},{key:"pattern"},
              {key:"at",label:"At",render:v=><span className="text-slate-500">{fmtTs(v)}</span>},
              {key:"chain"},
            ]}/>
          </div>
        </Panel>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel>
          <SectionHead title="Transition Bigrams (Top 30)" icon={GitMerge}/>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.bigrams?.slice(0,30)} layout="vertical" barCategoryGap="22%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
              <XAxis type="number" tick={{fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.2)"}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="from_sc" width={130} tick={{fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.45)"}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="count" fill="#06b6d4" radius={[0,3,3,0]} fillOpacity={0.75}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <SectionHead title="Rare Transitions (<1%)" icon={AlertCircle}/>
          {data.rare_transitions?.length
            ?<DataTable rows={data.rare_transitions.slice(0,25)} cols={[
                {key:"from_sc",label:"From"},{key:"to_sc",label:"To"},
                {key:"count"},{key:"freq_pct",label:"%",render:v=>`${v}%`},
              ]}/>
            :<StatusBadge type="ok">No rare transitions detected</StatusBadge>
          }
        </Panel>
      </div>
      <Panel>
        <SectionHead title="Per-Host Behavior Chain" icon={Activity}
          extra={
            <div className="flex items-center gap-3">
              <select className="font-jetbrains text-[9px] bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-slate-300 uppercase outline-none"
                value={selHost??""} onChange={e=>setSelHost(e.target.value)}>
                {data.hosts?.map(h=><option key={h} value={h} className={nativeOptionClass}>{h}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <span className="font-roboto-condensed text-[9px] text-slate-600 uppercase tracking-widest">Win:</span>
                <input type="range" min={3} max={15} value={winLen} onChange={e=>setWinLen(+e.target.value)} className="w-20 accent-cyan-500"/>
                <span className="font-jetbrains text-[11px] text-cyan-400 font-bold">{winLen}</span>
              </div>
            </div>
          }
        />
        {data.host_chains?.length?<DataTable rows={data.host_chains} cols={[{key:"chain"},{key:"count"}]}/>:<Empty/>}
      </Panel>
    </div>
  );
}

// ══ TAB: FREQUENCY ════════════════════════════════════════════════════════════
function Frequency({ qp }) {
  const [rarity,setRarity]=useState(5);
  const {data,loading}=useFetch(`${API_BASE}/frequency${qs({...qp,rarity_threshold:rarity})}`);
  if(loading) return <Loader/>;
  if(!data) return <Empty/>;
  return (
    <div className="space-y-4">
      <Panel>
        <SectionHead title={`Frequency Anomaly Events — ${data.freq_anomaly_count??0} total`} icon={BarChart2}/>
        {data.freq_anomalies?.length
          ?<DataTable rows={data.freq_anomalies} cols={[
              {key:"timestamp",label:"Time",render:v=><span className="text-slate-500">{fmtTs(v)}</span>},
              {key:"host"},{key:"topic"},{key:"cluster_id",label:"Cluster"},
              {key:"template"},{key:"cluster_size",label:"Size"},{key:"raw_log",label:"Raw"},
            ]}/>
          :<StatusBadge type="ok">No frequency anomalies in this window</StatusBadge>
        }
      </Panel>
      {data.cluster_rates?.length>0 && (
        <Panel>
          <SectionHead title="Cluster Event Rate — 1-min bins" icon={Activity}/>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.cluster_rates}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="timestamp" hide/>
              <YAxis tick={{fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.2)"}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Line type="monotone" dataKey="rate" stroke="#f59e0b" dot={false} strokeWidth={1.5}/>
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel>
          <SectionHead title="Z-score Spike Detection (z > 3)" icon={Zap}/>
          {data.spike_clusters?.length
            ?<><StatusBadge type="warn">{data.spike_clusters.length} clusters with z-score &gt; 3</StatusBadge>
              <div className="mt-3"><DataTable rows={data.spike_clusters} cols={[
                {key:"cluster_id",label:"Cluster"},
                {key:"mean",render:v=>v?.toFixed(2)},
                {key:"max_",label:"Max"},
                {key:"z_max",label:"Z-max",render:v=><span className="text-amber-400 font-bold">{v?.toFixed(2)}</span>},
              ]}/></div></>
            :<StatusBadge type="ok">No significant frequency spikes</StatusBadge>
          }
        </Panel>
        <Panel>
          <SectionHead title="Rare Clusters" icon={Fingerprint}
            extra={
              <div className="flex items-center gap-2">
                <span className="font-roboto-condensed text-[8px] text-slate-600 uppercase">max events:</span>
                <input type="number" value={rarity} min={1} max={100} onChange={e=>setRarity(+e.target.value)}
                  className="w-16 font-jetbrains text-[11px] bg-white/[0.05] border border-white/10 rounded-lg px-2.5 py-1.5 text-cyan-400 outline-none"/>
              </div>
            }
          />
          {data.rare_clusters?.length
            ?<DataTable rows={data.rare_clusters} cols={[
                {key:"cluster_id",label:"Cluster"},{key:"topic"},{key:"subcluster"},
                {key:"total",label:"Events",render:v=><span className="text-white font-bold">{v}</span>},{key:"template"},
              ]}/>
            :<Empty msg="No rare clusters at this threshold"/>
          }
        </Panel>
      </div>
    </div>
  );
}

// ══ TAB: THREAT INTEL ════════════════════════════════════════════════════════
function ThreatIntel({ qp }) {
  const {data,loading}=useFetch(`${API_BASE}/threat-intel${qs(qp)}`);
  if(loading) return <Loader/>;
  if(!data) return <Empty/>;
  return (
    <div className="space-y-4">
      {data.alert_count>0
        ?<Panel>
          <StatusBadge type="alert">{data.alert_count} ALERT-level events in current window</StatusBadge>
          <div className="mt-3">
            <DataTable rows={data.alerts} cols={[
              {key:"timestamp",label:"Time",render:v=><span className="text-slate-500">{fmtTs(v)}</span>},
              {key:"host"},{key:"topic"},{key:"subcluster"},
              {key:"freq_anomaly",label:"Freq Anom",render:v=>v?<span className="text-amber-400 text-[9px] font-bold">⚠ Yes</span>:<span className="text-slate-700">—</span>},
              {key:"raw_log",label:"Raw"},
            ]}/>
          </div>
        </Panel>
        :<Panel><StatusBadge type="ok">Zero ALERT-level events in current window</StatusBadge></Panel>
      }
      {data.correlated?.length>0 && (
        <Panel>
          <StatusBadge type="alert">Correlated multi-monitor alerts — possible active incident</StatusBadge>
          <div className="mt-3">
            <DataTable rows={data.correlated} cols={[
              {key:"host"},
              {key:"monitors_alerted",label:"Monitors Alerted",render:v=><span className="text-red-400 font-bold">{v}</span>},
            ]}/>
          </div>
        </Panel>
      )}
      <Panel>
        <SectionHead title="MITRE ATT&CK Technique Hints" icon={ShieldAlert}/>
        {data.mitre?.length
          ?<div className="overflow-auto cyber-scroll max-h-72">
            <table className="w-full text-left border-collapse">
              <thead><tr>{["Subcluster","MITRE Technique","Tactic","Events"].map(h=>(
                <th key={h} className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-500 pb-3 pr-5 border-b border-white/5">{h}</th>
              ))}</tr></thead>
              <tbody>{data.mitre.map((row,i)=>(
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="font-jetbrains text-[10px] md:text-[11px] text-cyan-400 py-2.5 pr-5">{row.subcluster}</td>
                  <td className="font-jetbrains text-[10px] md:text-[11px] text-slate-300 pr-5">{row.mitre}</td>
                  <td className="pr-5"><span className="font-jetbrains text-[10px] px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">{row.tactic}</span></td>
                  <td className="font-jetbrains text-[10px] md:text-[11px] text-white font-bold">{row.events}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          :<Empty msg="No threat-mapped subclusters observed"/>
        }
      </Panel>
      {data.alert_heatmap?.length>0 && (
        <Panel>
          <SectionHead title="Alert Density — Host × Monitor" icon={Target}/>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.alert_heatmap} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="host" tick={{fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.35)"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.2)"}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="alerts" fill="#ef4444" radius={[4,4,0,0]} fillOpacity={0.8}/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}
    </div>
  );
}

// ══ TAB: LOG EXPLORER ════════════════════════════════════════════════════════
function LogExplorer({ qp }) {
  const [subclusters,setSubs]=useState("");
  const [page,setPage]=useState(1);
  const {data,loading}=useFetch(`${API_BASE}/logs${qs({...qp,subclusters,page,page_size:100})}`);
  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="flex-1">
            <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">Filter Subcluster</p>
            <input className="w-full font-jetbrains text-[11px] bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-cyan-500/40 transition-all uppercase"
              placeholder="comma-separated subclusters…" value={subclusters} onChange={e=>{setSubs(e.target.value);setPage(1);}}/>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}
              className="font-roboto-condensed text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 transition-all">
              ← Prev
            </button>
            <span className="font-jetbrains text-[10px] text-slate-500 uppercase whitespace-nowrap">
              pg {page} · {data?.total?.toLocaleString()??0} total
            </span>
            <button onClick={()=>setPage(p=>p+1)}
              className="font-roboto-condensed text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white transition-all">
              Next →
            </button>
          </div>
        </div>
      </Panel>
      <Panel>
        {loading?<Loader/>:(
          <DataTable rows={data?.logs??[]} cols={[
            {key:"timestamp",label:"Time",render:v=><span className="text-slate-500">{fmtTs(v)}</span>},
            {key:"host"},{key:"topic"},{key:"cluster_id",label:"Cluster"},{key:"subcluster"},
            {key:"severity",label:"Sev",render:v=><SevBadge v={v}/>},
            {key:"ml_severity",label:"ML Sev",render:v=><SevBadge v={v}/>},
            {key:"ml_confidence",label:"Conf",render:v=>v?.toFixed(3)??"—"},
            {key:"ml_p_alert",label:"P(Alert)",render:v=>v?.toFixed(3)??"—"},
            {key:"ml_iso_anomaly",label:"ISO",render:v=>v===true?<span className="text-amber-400 text-[9px] font-bold">⚠</span>:<span className="text-slate-700">—</span>},
            {key:"raw_log",label:"Raw Log"},
          ]} maxRows={100}/>
        )}
      </Panel>
    </div>
  );
}

// ══ FILTER SIDEBAR ════════════════════════════════════════════════════════════
function FilterPanel({ filterData, filters, setFilters, activeTab, setActiveTab, lockedHosts = [], homePath = "/" }) {
  const {hosts=[],topics=[]}=filterData??{};
  const {selHosts,selTopics,selSev,timeRange,search}=filters;
  const navigate = useNavigate();
  const hostLockEnabled = lockedHosts.length > 0;
  const toggleHost  = h=>setFilters(f=>({...f,selHosts:  f.selHosts.includes(h)?f.selHosts.filter(x=>x!==h)  :[...f.selHosts,h]}));
  const toggleTopic = t=>setFilters(f=>({...f,selTopics: f.selTopics.includes(t)?f.selTopics.filter(x=>x!==t):[...f.selTopics,t]}));
  const toggleSev   = s=>setFilters(f=>({...f,selSev:    f.selSev.includes(s)?f.selSev.filter(x=>x!==s)      :[...f.selSev,s]}));
  return (
    <aside className="hidden lg:flex w-[300px] xl:w-[340px] flex-shrink-0">
      <div className="sticky top-0 h-screen w-full border-r border-white/5 bg-[#030817]/95 backdrop-blur-xl">
        <div className="h-full overflow-y-auto cyber-scroll px-6 py-7 space-y-7">
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 pt-2">
              <button onClick={()=>navigate(homePath)} className="group flex flex-col items-center gap-4">
                <img src={eyeLogo} alt="AURORA" className="w-14 h-14 object-contain brightness-125 transition-transform group-hover:scale-105" />
                <span className="font-roboto-condensed text-[11px] font-black tracking-[0.7em] text-cyan-500 uppercase italic leading-none">AURORA</span>
              </button>
            </div>

            <button
              onClick={()=>navigate(homePath)}
              className="relative flex items-center w-full h-14 rounded-xl overflow-hidden bg-white text-[#020617] active:scale-95 transition-all shadow-lg"
            >
              <div className="relative flex items-center justify-start gap-4 w-full px-5">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-roboto-condensed text-[11px] font-black uppercase tracking-widest leading-none">
                  {hostLockEnabled ? "Client_Details" : "System_Home"}
                </span>
              </div>
            </button>
          </div>

          <div className="space-y-3">
            <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Cluster Modules</p>
            <div className="space-y-3">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex w-full items-center gap-3 rounded-xl border px-5 py-4 text-left transition-all ${
                      isActive
                        ? "border-cyan-500/30 bg-cyan-500/10 text-white"
                        : "border-white/5 bg-white/[0.025] text-slate-500 hover:border-white/10 hover:text-white"
                    }`}
                  >
                    {isActive && <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-cyan-500 shadow-[0_0_12px_#06b6d4]" />}
                    <Icon size={16} className={isActive ? "text-cyan-400" : "text-slate-500"} />
                    <span className="font-roboto-condensed text-[11px] font-black uppercase tracking-[0.22em]">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 space-y-6">
            <div>
              <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2.5">Time Window</p>
              <select className="w-full font-jetbrains text-[11px] bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-slate-200 uppercase outline-none"
                value={timeRange} onChange={e=>setFilters(f=>({...f,timeRange:e.target.value}))}>
                <option value="" className={nativeOptionClass}>All Time</option>
                <option value="1h" className={nativeOptionClass}>Last 1h</option>
                <option value="6h" className={nativeOptionClass}>Last 6h</option>
                <option value="24h" className={nativeOptionClass}>Last 24h</option>
                <option value="7d" className={nativeOptionClass}>Last 7d</option>
              </select>
            </div>
            <div>
              <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2.5">Severity</p>
              <div className="flex flex-wrap gap-2">
                {["INFO","WARN","ALERT"].map(s=>{
                  const colors={INFO:"border-cyan-500/40 bg-cyan-500/10 text-cyan-400",WARN:"border-amber-500/40 bg-amber-500/10 text-amber-400",ALERT:"border-red-500/40 bg-red-500/10 text-red-400"};
                  return(
                    <button key={s} onClick={()=>toggleSev(s)}
                      className={`font-jetbrains text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider transition-all ${selSev.includes(s)?colors[s]:"border-white/10 text-slate-600 hover:border-white/20"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            {hostLockEnabled ? (
              <div>
                <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2.5">Client Scope</p>
                <div className="flex flex-wrap gap-2">
                  {lockedHosts.map(h=>(
                    <span key={h} className="font-jetbrains text-[10px] font-bold px-3 py-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 uppercase tracking-wider">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            ) : hosts.length>0 && (
              <div>
                <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2.5">Hosts</p>
                <div className="flex flex-col gap-1">
                  {hosts.map(h=>(
                    <button key={h} onClick={()=>toggleHost(h)}
                      className={`text-left font-jetbrains text-[10px] px-3 py-2 rounded-lg transition-all ${selHosts.includes(h)||selHosts.length===0?"text-cyan-400 bg-cyan-500/10":"text-slate-600 hover:text-slate-400"}`}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {topics.length>0 && (
              <div>
                <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2.5">Monitors</p>
                <div className="flex flex-col gap-1">
                  {topics.map(t=>(
                    <button key={t} onClick={()=>toggleTopic(t)}
                      className={`text-left font-jetbrains text-[10px] px-3 py-2 rounded-lg transition-all ${selTopics.includes(t)||selTopics.length===0?"text-purple-400 bg-purple-500/10":"text-slate-600 hover:text-slate-400"}`}>
                      {t.replace(".monitor","")}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2.5">Search</p>
              <div className="relative group">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors"/>
                <input className="w-full font-jetbrains text-[11px] bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-slate-200 outline-none focus:border-cyan-500/40 uppercase"
                  placeholder="template / log…" value={search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ══ MAIN PAGE ═════════════════════════════════════════════════════════════════
const ClusterDashboard = ({
  setLoading,
  setError,
  lockedHosts = [],
  homePath = "/",
  title = "Cluster Dashboard",
  compactLayout = false,
}) => {
  const navigate = useNavigate();
  const [activeTab,setActiveTab] = useState("pulse");
  const [tick,setTick]           = useState(0);
  const timerRef                 = useRef(null);
  const hostLockEnabled          = lockedHosts.length > 0;
  const lockedHostsKey           = lockedHosts.join(",");

  const [filters,setFilters] = useState({
    selHosts: lockedHosts, selTopics:[],selSev:["INFO","WARN","ALERT"],timeRange:"",search:"",
  });

  useEffect(() => {
    if (!hostLockEnabled) return;
    setFilters(f => ({ ...f, selHosts: lockedHosts }));
  }, [hostLockEnabled, lockedHostsKey]);

  const filterQuery = hostLockEnabled ? qs({ hosts: lockedHostsKey }) : "";
  const {data:filterData} = useFetch(`${API_BASE}/filters${filterQuery}`);
  const {selHosts,selTopics,selSev,timeRange,search} = filters;
  const allHosts  = filterData?.hosts  ?? [];
  const allTopics = filterData?.topics ?? [];

  const qp = {
    hosts:      hostLockEnabled ? lockedHostsKey : (selHosts.length>0  && selHosts.length<allHosts.length   ? selHosts.join(",")  : undefined),
    topics:     selTopics.length>0 && selTopics.length<allTopics.length ? selTopics.join(",") : undefined,
    severities: selSev.length<3    ? selSev.join(",")                   : undefined,
    time_range: timeRange || undefined,
    search:     search    || undefined,
  };

  const {data:kpis,loading:kpiLoad} = useFetch(`${API_BASE}/kpis${qs({ ...qp, _t: tick })}`);

  useEffect(()=>{
    setLoading?.(true); setError?.(null);
    fetch(`${API_BASE}/filters${filterQuery}`)
      .then(r=>{ if(!r.ok) throw new Error(); return r.json(); })
      .then(()=>setLoading?.(false))
      .catch(()=>{ setLoading?.(false); setError?.("Cluster API unreachable."); });
  },[setLoading, setError, filterQuery]);

  useEffect(()=>{
    timerRef.current = setTimeout(()=>setTick(t=>t+1), POLL_INTERVAL);
    return ()=>clearTimeout(timerRef.current);
  },[tick]);

  const tabKey = JSON.stringify({activeTab,qp});

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-inter selection:bg-cyan-500/30">
      <div className="flex min-h-screen">
        {!compactLayout && !hostLockEnabled && (
          <FilterPanel
            filterData={filterData}
            filters={filters}
            setFilters={setFilters}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            lockedHosts={lockedHosts}
            homePath={homePath}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="max-w-[1800px] mx-auto px-5 pb-24 md:px-10 md:pt-8 space-y-6">
            {/* ── HEADER ── */}
{/* ── TACTICAL HEADER (Mobile Optimized) ── */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-8 md:pt-0 pb-2 md:border-b border-white/5">
              <div className="flex items-center justify-center md:justify-start w-full md:w-auto relative">
                {/* Back Button: Laptop Only */}
                <button 
                  onClick={() => navigate(-1)} 
                  className="hidden md:flex absolute left-0 p-3 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/5"
                >
                  <ChevronLeft size={20} className="text-cyan-400" />
                </button>
                
                <div className="text-center md:text-left md:ml-16">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
                    {title}
                  </h1>
                  {/* Description: Laptop Only */}
                  <p className="hidden md:block font-roboto-condensed text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em] mt-1">
                    Drain3_Clustering // RF_GB_IsoForest // Seq_Freq_Anomaly
                  </p>
                </div>
              </div>

              {/* Laptop-Only Refresh Cluster */}
              <div className="hidden md:flex items-center justify-center gap-3">
                {filterData && (
                  <span className="font-jetbrains text-[9px] text-slate-600 uppercase tracking-widest">
                    {filterData.total?.toLocaleString()} records
                  </span>
                )}
                <button onClick={()=>setTick(t=>t+1)}
                  className="flex items-center gap-2 font-roboto-condensed text-[9px] font-black uppercase tracking-widest px-5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all active:scale-95">
                  <RefreshCw size={12} className={kpiLoad?"animate-spin text-cyan-400":""}/>
                  Refresh
                </button>
              </div>
            </header>

            {/* ── MOBILE HIGH-CONTRAST REFRESH BUBBLE ── */}
            <AnimatePresence>
              {!kpiLoad && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: 20 }}
                  className="md:hidden fixed bottom-32 right-6 z-[2000]"
                >
                  <button
                    onClick={() => setTick(t => t + 1)}
                    className="
                      w-16 h-16 flex items-center justify-center 
                      rounded-full bg-white text-slate-950 
                      shadow-[0_20px_50px_rgba(0,0,0,0.5)] 
                      active:scale-90 transition-all border border-white/20
                    "
                  >
                    <RefreshCw size={26} strokeWidth={2.5} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Loading State */}
            {kpiLoad && (
              <div className="md:hidden fixed bottom-32 right-6 z-[2000] w-16 h-16 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                <RefreshCw size={26} className="animate-spin text-cyan-400" />
              </div>
            )}

            {/* ── KPI ROW ── */}
            <KPIRow kpis={kpis}/>

            {(hostLockEnabled || compactLayout) && (
              <CompactControls
                filterData={filterData}
                filters={filters}
                setFilters={setFilters}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                lockedHosts={lockedHosts}
              />
            )}

            {/* ── BODY ── */}
            <div className="flex gap-5">
              <div className="flex-1 min-w-0 space-y-4">
                {/* Tab Bar */}
                {!compactLayout && !hostLockEnabled && (
                  <div className="flex gap-1.5 flex-wrap lg:hidden">
                  {TABS.map(t=>{
                    const Icon=t.icon;
                    return(
                      <button key={t.id} onClick={()=>setActiveTab(t.id)}
                        className={`flex items-center gap-1.5 font-roboto-condensed text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3 md:px-4 py-2 md:py-2.5 rounded-xl border transition-all
                          ${activeTab===t.id
                            ?"bg-white text-slate-950 border-white"
                            :"bg-white/[0.03] border-white/10 text-slate-500 hover:text-white hover:bg-white/[0.06]"}`}>
                        <Icon size={11}/>
                        <span className="hidden sm:inline">{t.label}</span>
                      </button>
                    );
                  })}
                  </div>
                )}

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  <motion.div key={tabKey} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.18}}>
                    {activeTab==="pulse"    && <LivePulse   qp={qp}/>}
                    {activeTab==="clusters" && <ClusterMap  qp={qp}/>}
                    {activeTab==="ml"       && <MLIntel     qp={qp}/>}
                    {activeTab==="seq"      && <Sequences   qp={qp}/>}
                    {activeTab==="freq"     && <Frequency   qp={qp}/>}
                    {activeTab==="threat"   && <ThreatIntel qp={qp}/>}
                    {activeTab==="logs"     && <LogExplorer qp={qp}/>}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ClusterDashboard;