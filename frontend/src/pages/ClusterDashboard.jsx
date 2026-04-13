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
const API_BASE = "http://192.168.1.193:8000";
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
  const { data, loading } = useFetch(`${API_BASE}/api/live-pulse${qs(qp)}`);
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

// ══ TAB: CLUSTER MAP ═════════════════════════════════════════════════════════
function ClusterMap({ qp }) {
  const { data, loading } = useFetch(`${API_BASE}/api/cluster-map${qs(qp)}`);
  const [selectedCluster, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const { data: drill, loading: drillLoading } = useFetch(
    selectedCluster != null ? `${API_BASE}/api/cluster-drilldown/${selectedCluster}${qs(qp)}` : null
  );

  if (loading) return <Loader />;
  if (!data) return <Empty />;

  const clusterTable = (
    <div className="overflow-auto cyber-scroll max-h-[70vh]">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-[#070d1a] z-10">
          <tr>{["ID","Monitor","Subcluster","Template","Events","Size","Freq Anom","Avg P(Alert)"].map(h=>(
            <th key={h} className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest text-slate-500 pb-3 pr-5 border-b border-white/5 whitespace-nowrap">{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {data.clusters?.slice(0,500).map((row,i)=>(
            <tr key={i}
              className={`border-b border-white/[0.03] cursor-pointer transition-all ${selectedCluster===row.cluster_id?"bg-cyan-500/[0.06]":"hover:bg-white/[0.02]"}`}
              onClick={()=>setSelected(row.cluster_id)}>
              <td className="font-jetbrains text-[10px] md:text-[11px] text-cyan-400 py-2.5 pr-5">{row.cluster_id}</td>
              <td className="font-jetbrains text-[10px] md:text-[11px] text-slate-300 pr-5 max-w-[140px] truncate">{row.topic}</td>
              <td className="font-jetbrains text-[10px] md:text-[11px] text-slate-300 pr-5">{row.subcluster}</td>
              <td className="font-jetbrains text-[10px] md:text-[11px] text-slate-500 pr-5 max-w-[260px] truncate">{row.template}</td>
              <td className="font-jetbrains text-[10px] md:text-[11px] text-white font-bold pr-5">{row.count}</td>
              <td className="font-jetbrains text-[10px] md:text-[11px] text-slate-300 pr-5">{row.cluster_size}</td>
              <td className="font-jetbrains text-[10px] md:text-[11px] pr-5">{row.freq_anomalies>0?<span className="text-amber-400 font-bold">{row.freq_anomalies}</span>:<span className="text-slate-700">0</span>}</td>
              <td className="font-jetbrains text-[10px] md:text-[11px] text-slate-300">{row.avg_ml_p_alert?.toFixed(3)??"—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      <Panel>
        <SectionHead title="All Clusters" icon={GitMerge}
          extra={
            <div className="flex items-center gap-3">
              <span className="font-jetbrains text-[10px] text-slate-600 uppercase tracking-widest hidden md:inline">Click row to drill</span>
              <button
                onClick={() => setExpanded(true)}
                className="font-roboto-condensed text-[9px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
              >
                Big View
              </button>
            </div>
          } />
        {clusterTable}
      </Panel>

      <AnimatePresence>
        {selectedCluster != null && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
            <Panel>
              <SectionHead title={`Drilldown — Cluster #${selectedCluster}`} icon={Crosshair}
                extra={<button onClick={()=>setSelected(null)} className="text-slate-600 hover:text-white transition-colors"><X size={14}/></button>} />
              {drillLoading ? <Loader /> : (
                <DataTable rows={drill??[]} cols={[
                  {key:"timestamp",label:"Time",render:v=><span className="text-slate-500">{fmtTs(v)}</span>},
                  {key:"host"},{key:"topic"},{key:"subcluster"},
                  {key:"severity",label:"Sev",render:v=><SevBadge v={v}/>},
                  {key:"ml_severity",label:"ML Sev",render:v=><SevBadge v={v}/>},
                  {key:"ml_confidence",label:"Conf",render:v=>v!=null?v.toFixed(3):"—"},
                  {key:"template"},{key:"raw_log",label:"Raw Log"},
                ]}/>
              )}
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      {data.new_clusters?.length>0 && (
        <Panel>
          <SectionHead title="Newly Discovered Clusters" icon={Zap}/>
          <DataTable rows={data.new_clusters} cols={[
            {key:"timestamp",label:"Time",render:v=><span className="text-slate-500">{fmtTs(v)}</span>},
            {key:"host"},{key:"topic"},
            {key:"cluster_id",label:"ID",render:v=><span className="text-cyan-400">{v}</span>},
            {key:"template"},{key:"raw_log",label:"Raw"},
          ]}/>
        </Panel>
      )}

      {data.growth?.length>0 && (
        <Panel>
          <SectionHead title="Cluster Size Growth" icon={BarChart2}/>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.growth.slice(-500)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="timestamp" hide/>
              <YAxis tick={{fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.2)"}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Line type="monotone" dataKey="cluster_size" stroke="#a855f7" dot={false} strokeWidth={1.5}/>
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] bg-[#020617]/95 backdrop-blur-md p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.98, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 8 }}
              className="h-full max-w-[1800px] mx-auto bg-[#070d1a] border border-white/10 rounded-3xl p-5 md:p-6 overflow-hidden"
            >
              <SectionHead
                title="Cluster Map — Big View"
                icon={GitMerge}
                extra={
                  <button
                    onClick={() => setExpanded(false)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                }
              />
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)] gap-5 h-[calc(100%-3rem)]">
                <div className="min-w-0">
                  {clusterTable}
                </div>
                <Panel className="h-full overflow-auto">
                  <SectionHead
                    title={selectedCluster != null ? `Drilldown — Cluster #${selectedCluster}` : "Cluster Drilldown"}
                    icon={Crosshair}
                    extra={selectedCluster == null ? <span className="font-jetbrains text-[10px] text-slate-600 uppercase">Select a cluster row</span> : null}
                  />
                  {selectedCluster == null ? (
                    <Empty msg="Select a cluster to inspect events" />
                  ) : drillLoading ? (
                    <Loader />
                  ) : (
                    <DataTable rows={drill??[]} cols={[
                      {key:"timestamp",label:"Time",render:v=><span className="text-slate-500">{fmtTs(v)}</span>},
                      {key:"host"},{key:"topic"},{key:"subcluster"},
                      {key:"severity",label:"Sev",render:v=><SevBadge v={v}/>},
                      {key:"ml_severity",label:"ML Sev",render:v=><SevBadge v={v}/>},
                      {key:"ml_confidence",label:"Conf",render:v=>v!=null?v.toFixed(3):"—"},
                      {key:"template"},{key:"raw_log",label:"Raw Log"},
                    ]} maxRows={250}/>
                  )}
                </Panel>
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
  const {data,loading} = useFetch(`${API_BASE}/api/ml-intelligence${qs(qp)}`);
  if (loading) return <Loader/>;
  if (!data) return <Empty/>;
  if (!data.has_data) return (
    <Panel>
      <StatusBadge type="info">No ML-scored records in current filter window</StatusBadge>
      <p className="font-jetbrains text-[11px] text-slate-500 mt-4 leading-relaxed uppercase tracking-wider">
        Run <code className="text-cyan-400">kafka_consumer_ml.py</code> then <code className="text-purple-400">python retrain.py</code> from <code>clustering/</code> to generate ML-scored records.
      </p>
    </Panel>
  );
  const k = data.kpis;
  const scatterGroups = buildMlScatterGroups(data.scatter?.slice(0, 600) ?? []);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:"ML Scored",        value:fmtNum(k.ml_scored),          color:"text-purple-400"},
          {label:"Avg Confidence",   value:k.avg_confidence?.toFixed(3), color:"text-cyan-400"},
          {label:"ISO Anomalies",    value:fmtNum(k.iso_anomalies),      color:"text-red-400"},
          {label:"Rule↔ML Disagree", value:fmtNum(k.disagreements),     color:"text-amber-400"},
        ].map(c=>(
          <div key={c.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"/>
            <p className="font-roboto-condensed text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1.5">{c.label}</p>
            <p className={`font-jetbrains text-xl md:text-2xl font-black ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4">
        <Panel className="xl:min-h-[36rem]">
          <SectionHead
            title="P(Alert) vs P(Warn)"
            icon={Activity}
            extra={
              <div className="flex items-center gap-3">
                {scatterGroups.map(group => (
                  <div key={group.severity} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                    <span className="font-jetbrains text-[9px] uppercase tracking-widest text-slate-500">
                      {group.severity}
                    </span>
                  </div>
                ))}
              </div>
            }
          />
          <ResponsiveContainer width="100%" height={520}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis
                type="number"
                dataKey="ml_p_warn"
                name="P(WARN)"
                domain={[0, 1]}
                tickCount={6}
                tick={{fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.28)"}}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="ml_p_alert"
                name="P(ALERT)"
                domain={[0, 1]}
                tickCount={6}
                tick={{fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.28)"}}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine
                y={ML_ALERT_THRESHOLD}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                strokeOpacity={0.9}
                ifOverflow="extendDomain"
                label={{
                  value: "ALERT threshold",
                  position: "insideTopRight",
                  fill: "#f43f5e",
                  fontSize: 9,
                  fontFamily: "JetBrains Mono",
                }}
              />
              <Tooltip content={<CT/>}/>
              {scatterGroups.map(group => (
                <Scatter
                  key={group.severity}
                  name={group.severity}
                  data={group.data}
                  fill={group.color}
                  fillOpacity={group.severity === "INFO" ? 0.72 : 0.88}
                  stroke={group.color}
                  strokeOpacity={0.55}
                  strokeWidth={group.severity === "ALERT" ? 1.2 : 0.6}
                  r={group.severity === "ALERT" ? 4 : 3}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <SectionHead title="Confidence Distribution" icon={BrainCircuit}/>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.confidence_hist} barCategoryGap="10%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="bin" tick={{fontFamily:"JetBrains Mono",fontSize:8,fill:"rgba(255,255,255,0.3)"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontFamily:"JetBrains Mono",fontSize:9,fill:"rgba(255,255,255,0.2)"}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="count" radius={[3,3,0,0]}>
                {data.confidence_hist.map((d,i)=><Cell key={i} fill={SEV_COLOR[d.severity]??"#06b6d4"} fillOpacity={0.8}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      {data.iso_anomalies?.length>0 && (
        <Panel>
          <StatusBadge type="warn">{data.iso_anomalies.length} events flagged by IsolationForest — unsupervised zero-day detector</StatusBadge>
          <div className="mt-3">
            <DataTable rows={data.iso_anomalies} cols={[
              {key:"timestamp",label:"Time",render:v=><span className="text-slate-500">{fmtTs(v)}</span>},
              {key:"host"},{key:"topic"},{key:"subcluster"},
              {key:"ml_confidence",label:"Conf",render:v=>v?.toFixed(3)??"—"},
              {key:"ml_p_alert",label:"P(Alert)",render:v=>v?.toFixed(3)??"—"},
              {key:"severity",label:"Sev",render:v=><SevBadge v={v}/>},
              {key:"raw_log",label:"Raw"},
            ]}/>
          </div>
        </Panel>
      )}
      {data.disagreements?.length>0 && (
        <Panel>
          <StatusBadge type="warn">{data.disagreements.length} events where rule severity ≠ ML severity</StatusBadge>
          <div className="mt-3">
            <DataTable rows={data.disagreements} cols={[
              {key:"timestamp",label:"Time",render:v=><span className="text-slate-500">{fmtTs(v)}</span>},
              {key:"host"},{key:"subcluster"},
              {key:"rule_severity",label:"Rule",render:v=><SevBadge v={v}/>},
              {key:"ml_severity",label:"ML",render:v=><SevBadge v={v}/>},
              {key:"ml_confidence",label:"Conf",render:v=>v?.toFixed(3)??"—"},
              {key:"template"},
            ]}/>
          </div>
        </Panel>
      )}
    </div>
  );
}

// ══ TAB: SEQUENCES ═══════════════════════════════════════════════════════════
function Sequences({ qp }) {
  const [selHost,setSelHost] = useState(null);
  const [winLen,setWinLen]   = useState(8);
  const {data,loading} = useFetch(`${API_BASE}/api/sequences${qs({...qp,host:selHost,window:winLen})}`);
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
  const {data,loading}=useFetch(`${API_BASE}/api/frequency${qs({...qp,rarity_threshold:rarity})}`);
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
  const {data,loading}=useFetch(`${API_BASE}/api/threat-intel${qs(qp)}`);
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
  const {data,loading}=useFetch(`${API_BASE}/api/logs${qs({...qp,subclusters,page,page_size:100})}`);
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
  const {data:filterData} = useFetch(`${API_BASE}/api/filters${filterQuery}`);
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

  const {data:kpis,loading:kpiLoad} = useFetch(`${API_BASE}/api/kpis${qs({ ...qp, _t: tick })}`);

  useEffect(()=>{
    setLoading?.(true); setError?.(null);
    fetch(`${API_BASE}/api/filters${filterQuery}`)
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
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 md:border-b border-white/5">

                <div className="flex items-center justify-center md:justify-start w-full md:w-auto relative">
            {/* Laptop Back Button Only */}
            <button 
              onClick={() => navigate(-1)} 
              className="hidden md:flex absolute left-0 p-3 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/5"
            >
              <ChevronLeft size={20} className="text-cyan-400" />
            </button>
            
            <div className="text-center md:text-left md:ml-16">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">{title}</h1>
              {/* Description Only for Laptop */}
              <p className="hidden md:block font-roboto-condensed text-[10px] font-bold text-cyan-500/60 uppercase tracking-[0.2em] mt-1">
                Drain3_Clustering // RF_GB_IsoForest // Seq_Freq_Anomaly
              </p>
            </div>
          </div>
              <div className="flex items-center justify-center gap-3">
                {filterData && (
                  <span className="font-jetbrains text-[9px] text-slate-600 uppercase tracking-widest hidden md:block">
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
