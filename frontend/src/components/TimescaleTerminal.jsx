import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, X, Maximize2, Minimize2,
  Wifi, WifiOff, Loader, Copy, ChevronRight,
} from "lucide-react";

const STATUS = {
  DISCONNECTED: "disconnected",
  CONNECTING:   "connecting",
  CONNECTED:    "connected",
  ERROR:        "error",
};

const QUICK_CMDS = [
  { label: "\\dt",              desc: "List tables" },
  { label: "\\d logs",          desc: "Describe logs" },
  { label: "SELECT NOW();",     desc: "Server time" },
  { label: "\\x",               desc: "Toggle expanded" },
  { label: "SELECT * FROM logs ORDER BY event_time DESC LIMIT 10;", desc: "Latest 10" },
  { label: "SELECT count(*) FROM logs;", desc: "Row count" },
];

const TimescaleTerminal = ({ isOpen, onClose, apiBase = "http://172.24.16.81:8001" }) => {
  const wsUrl = apiBase.replace(/^http/, "ws") + "/ws/timescaledb";

  const termDivRef   = useRef(null);
  const xtermRef     = useRef(null);
  const fitAddonRef  = useRef(null);
  const wsRef        = useRef(null);
  const roRef        = useRef(null);

  const [status,      setStatus]   = useState(STATUS.DISCONNECTED);
  const [isMaximized, setIsMax]    = useState(false);
  const [copied,      setCopied]   = useState(false);
  const [isMobile,    setIsMobile] = useState(window.innerWidth < 768);

  // ── responsive check ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fit = useCallback(() => {
    if (!fitAddonRef.current || !xtermRef.current) return;
    try { fitAddonRef.current.fit(); } catch (_) {}
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const { cols, rows } = xtermRef.current;
      wsRef.current.send(JSON.stringify({ type: "resize", cols, rows }));
    }
  }, []);

  const sendCmd = useCallback((cmd) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "data", data: cmd + "\n" }));
    xtermRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    Promise.all([
      import("@xterm/xterm"),
      import("@xterm/addon-fit"),
      import("@xterm/addon-web-links"),
      import("@xterm/xterm/css/xterm.css"),
    ]).then(([{ Terminal }, { FitAddon }, { WebLinksAddon }]) => {
      if (cancelled || !termDivRef.current) return;

      const term = new Terminal({
        cursorBlink:     true,
        cursorStyle:     "underline",
        fontSize:        isMobile ? 11 : 13, // Smaller font for mobile
        lineHeight:      1.4,
        fontFamily:      '"JetBrains Mono", monospace',
        theme: {
          background: "#010409",
          foreground: "#c9d1d9",
          cursor: "#10b981",
          selectionBackground:"rgba(16,185,129,0.2)",
        },
        allowProposedApi: true,
        scrollback: 5000,
      });

      const fitAddon  = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());
      term.open(termDivRef.current);
      
      // Delay fit to ensure mobile viewport has settled
      setTimeout(() => fitAddon.fit(), 100);

      xtermRef.current    = term;
      fitAddonRef.current = fitAddon;

      setStatus(STATUS.CONNECTING);
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) { ws.close(); return; }
        setStatus(STATUS.CONNECTED);
        fit();
      };

      ws.onmessage = (evt) => {
        if (evt.data instanceof ArrayBuffer) {
          term.write(new Uint8Array(evt.data));
        } else {
          try {
            const msg = JSON.parse(evt.data);
            if (msg.type === "data") term.write(msg.data);
          } catch { term.write(evt.data); }
        }
      };

      ws.onerror = () => setStatus(STATUS.ERROR);
      ws.onclose = () => { if (!cancelled) setStatus(STATUS.DISCONNECTED); };

      term.onData((d) => {
        if (ws.readyState === WebSocket.OPEN)
          ws.send(JSON.stringify({ type: "data", data: d }));
      });

      roRef.current = new ResizeObserver(() => fit());
      if (termDivRef.current) roRef.current.observe(termDivRef.current);
    });

    return () => {
      cancelled = true;
      roRef.current?.disconnect();
      xtermRef.current?.dispose();
      wsRef.current?.close();
    };
  }, [isOpen, wsUrl, fit, isMobile]);

  useEffect(() => {
    const id = setTimeout(fit, 150);
    return () => clearTimeout(id);
  }, [isMaximized, fit, isMobile]);

  const statusCfg = {
    [STATUS.CONNECTING]:   { color: "text-amber-400",  label: "Syncing" },
    [STATUS.CONNECTED]:    { color: "text-emerald-400", label: "Live" },
    [STATUS.ERROR]:        { color: "text-red-400",     label: "Fault" },
    [STATUS.DISCONNECTED]: { color: "text-gray-600",    label: "Offline" },
  }[status];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-0 md:p-10"
          style={{ background: "rgba(1,4,9,0.92)", backdropFilter: "blur(14px)" }}
        >
          <motion.div
            initial={isMobile ? { y: "100%" } : { scale: 0.95, opacity: 0 }}
            animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
            exit={isMobile ? { y: "100%" } : { scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`flex flex-col overflow-hidden bg-[#010409] border-white/10 ${
              isMaximized || isMobile
                ? "w-full h-full md:h-[90vh] rounded-none md:rounded-[2rem] md:border"
                : "w-full max-w-6xl h-[80vh] rounded-[1.75rem] border shadow-2xl"
            }`}
          >
            {/* ════ TITLE BAR ════ */}
            <div className="shrink-0 flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <button onClick={onClose} className="p-1 text-gray-500 hover:text-white"><X size={18} /></button>
                  <div className="hidden md:block w-px h-4 bg-white/10 mx-1" />
                  <Database size={14} className="text-emerald-400" />
                  <span className="font-roboto-condensed text-[10px] md:text-[11px] font-black uppercase tracking-widest text-emerald-400">
                    Timescale_Shell
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/10 bg-black/40 text-[8px] font-black uppercase tracking-widest font-roboto-condensed ${statusCfg.color}`}>
                  <span className={`w-1 h-1 rounded-full bg-current ${status === STATUS.CONNECTED ? 'animate-pulse' : ''}`} />
                  {statusCfg.label}
                </div>
                {!isMobile && (
                  <button onClick={() => setIsMax(!isMaximized)} className="p-1.5 text-gray-500 hover:text-white">
                    {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                )}
              </div>
            </div>

            {/* ════ QUICK COMMANDS (Swipable on Mobile) ════ */}
            <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar border-b border-white/5 bg-black/20">
              <span className="font-roboto-condensed text-[8px] font-black uppercase text-gray-600 shrink-0">CMD:</span>
              {QUICK_CMDS.map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => sendCmd(cmd.label)}
                  disabled={status !== STATUS.CONNECTED}
                  className="shrink-0 px-3 py-1.5 rounded-lg font-jetbrains text-[9px] bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 active:scale-95 disabled:opacity-20 transition-all"
                >
                  {cmd.label}
                </button>
              ))}
            </div>

            {/* ════ XTERM MOUNT ════ */}
            <div
              ref={termDivRef}
              className="flex-1 w-full overflow-hidden"
              style={{ padding: "8px" }}
            />

            {/* ════ FOOTER ════ */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/40">
              <span className="font-jetbrains text-[8px] text-gray-700 truncate max-w-[60%]">
                {wsUrl}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(wsUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="font-roboto-condensed text-[8px] font-black uppercase text-gray-600 active:text-emerald-400"
              >
                {copied ? "COPIED" : "WS_URL"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TimescaleTerminal;