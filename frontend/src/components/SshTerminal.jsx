// SshTerminal.jsx
// Requires: npm install @xterm/xterm @xterm/addon-fit @xterm/addon-web-links
// Also import xterm CSS in your root: import '@xterm/xterm/css/xterm.css'

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Wifi, WifiOff, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WS_SSH_URL = "ws://172.24.16.81:8001/ws/ssh"; // Your backend WebSocket endpoint

const CONNECTION_STATUS = {
  DISCONNECTED: "disconnected",
  CONNECTING:   "connecting",
  CONNECTED:    "connected",
  ERROR:        "error",
};

const SshTerminal = ({ isOpen, onClose, apiBase }) => {
  const terminalRef  = useRef(null); // DOM container div
  const xtermRef     = useRef(null); // xterm Terminal instance
  const fitAddonRef  = useRef(null); // FitAddon instance
  const wsRef        = useRef(null); // WebSocket instance
  const resizeObRef  = useRef(null); // ResizeObserver

  const [status, setStatus]     = useState(CONNECTION_STATUS.DISCONNECTED);
  const [isMaximized, setIsMax] = useState(false);

  // ---------- helpers ----------
  const writeToTerm = useCallback((data) => {
    xtermRef.current?.write(data);
  }, []);

  const fitTerminal = useCallback(() => {
    if (!fitAddonRef.current || !xtermRef.current) return;
    fitAddonRef.current.fit();
    // Tell the backend the new size so the PTY matches
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const { cols, rows } = xtermRef.current;
      wsRef.current.send(JSON.stringify({ type: "resize", cols, rows }));
    }
  }, []);

  // ---------- mount / unmount xterm ----------
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    // Dynamically import so the bundle only loads when the terminal opens
    Promise.all([
      import("@xterm/xterm"),
      import("@xterm/addon-fit"),
      import("@xterm/addon-web-links"),
      import("@xterm/xterm/css/xterm.css"),
    ]).then(([{ Terminal }, { FitAddon }, { WebLinksAddon }]) => {
      if (cancelled || !terminalRef.current) return;

      const term = new Terminal({
        cursorBlink:     true,
        cursorStyle:     "bar",
        fontSize:        13,
        fontFamily:      '"JetBrains Mono", "Fira Code", monospace',
        theme: {
          background:    "#03050a",
          foreground:    "#e2e8f0",
          cursor:        "#22d3ee",
          cursorAccent:  "#03050a",
          selectionBackground: "rgba(34,211,238,0.25)",
          black:   "#0f172a", brightBlack:   "#334155",
          red:     "#f87171", brightRed:     "#fca5a5",
          green:   "#4ade80", brightGreen:   "#86efac",
          yellow:  "#fbbf24", brightYellow:  "#fde68a",
          blue:    "#60a5fa", brightBlue:    "#93c5fd",
          magenta: "#c084fc", brightMagenta: "#d8b4fe",
          cyan:    "#22d3ee", brightCyan:    "#67e8f9",
          white:   "#e2e8f0", brightWhite:   "#f8fafc",
        },
        allowProposedApi: true,
        scrollback: 5000,
      });

      const fitAddon      = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);

      term.open(terminalRef.current);
      fitAddon.fit();

      xtermRef.current    = term;
      fitAddonRef.current = fitAddon;

      // ---------- WebSocket ----------
      setStatus(CONNECTION_STATUS.CONNECTING);
      const ws = new WebSocket(WS_SSH_URL);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) { ws.close(); return; }
        setStatus(CONNECTION_STATUS.CONNECTED);
        // Send initial size
        const { cols, rows } = term;
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      };

      ws.onmessage = (evt) => {
        if (evt.data instanceof ArrayBuffer) {
          term.write(new Uint8Array(evt.data));
        } else {
          try {
            const msg = JSON.parse(evt.data);
            if (msg.type === "data") term.write(msg.data);
          } catch {
            term.write(evt.data);
          }
        }
      };

      ws.onerror = () => setStatus(CONNECTION_STATUS.ERROR);
      ws.onclose = () => {
        if (!cancelled) setStatus(CONNECTION_STATUS.DISCONNECTED);
      };

      // Forward keystrokes to backend
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "data", data }));
        }
      });

      // ---------- ResizeObserver for auto-fit ----------
      resizeObRef.current = new ResizeObserver(() => fitTerminal());
      if (terminalRef.current) {
        resizeObRef.current.observe(terminalRef.current);
      }
    });

    return () => {
      cancelled = true;
      resizeObRef.current?.disconnect();
      xtermRef.current?.dispose();
      xtermRef.current    = null;
      fitAddonRef.current = null;
      if (wsRef.current) {
        wsRef.current.onclose = null; // suppress status update on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
      setStatus(CONNECTION_STATUS.DISCONNECTED);
    };
  }, [isOpen, fitTerminal]);

  // Re-fit when maximise state changes
  useEffect(() => {
    const id = setTimeout(fitTerminal, 120);
    return () => clearTimeout(id);
  }, [isMaximized, fitTerminal]);

  // ---------- Status indicator ----------
  const StatusDot = () => {
    const cfg = {
      [CONNECTION_STATUS.CONNECTING]:   { color: "text-yellow-400", icon: <Loader size={12} className="animate-spin" />,  label: "Connecting..." },
      [CONNECTION_STATUS.CONNECTED]:    { color: "text-emerald-400", icon: <Wifi size={12} />,    label: "Connected" },
      [CONNECTION_STATUS.ERROR]:        { color: "text-red-400",     icon: <WifiOff size={12} />, label: "Error" },
      [CONNECTION_STATUS.DISCONNECTED]: { color: "text-gray-500",    icon: <WifiOff size={12} />, label: "Disconnected" },
    }[status];

    return (
      <div className={`flex items-center gap-1.5 font-roboto-condensed text-[9px] font-bold uppercase tracking-widest ${cfg.color}`}>
        {cfg.icon}
        <span>{cfg.label}</span>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-12"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`bg-[#03050a] border border-white/10 flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.7)] rounded-[2rem] transition-all duration-300 ${
              isMaximized ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[72vh]"
            }`}
          >
            {/* ---- Header ---- */}
            <div className="bg-white/[0.03] px-5 py-3.5 flex items-center justify-between border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                {/* Traffic-light dots */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70 hover:bg-red-500 cursor-pointer transition-colors" onClick={onClose} />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70 transition-colors" />
                  <div
                    className="w-3 h-3 rounded-full bg-emerald-500/70 hover:bg-emerald-500 cursor-pointer transition-colors"
                    onClick={() => { setIsMax(v => !v); }}
                  />
                </div>
                <div className="w-[1px] h-5 bg-white/10" />
                <TerminalIcon size={13} className="text-cyan-400" />
                <span className="font-roboto-condensed text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  SSH_Remote_Console&nbsp;&nbsp;//&nbsp;&nbsp;{(apiBase ?? WS_SSH_URL).replace(/^https?:\/\//, "")}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <StatusDot />
                <div className="w-[1px] h-4 bg-white/10" />
                <button
                  onClick={() => { setIsMax(v => !v); setTimeout(fitTerminal, 120); }}
                  className="text-gray-500 hover:text-cyan-400 transition-colors"
                  title={isMaximized ? "Restore" : "Maximize"}
                >
                  {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" title="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ---- Connecting overlay ---- */}
            <AnimatePresence>
              {status === CONNECTION_STATUS.CONNECTING && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#03050a]/80 backdrop-blur-sm pointer-events-none"
                >
                  <Loader size={28} className="text-cyan-400 animate-spin mb-3" />
                  <p className="font-roboto-condensed text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-400">
                    Establishing_SSH_Link...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ---- Error banner ---- */}
            <AnimatePresence>
              {status === CONNECTION_STATUS.ERROR && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 flex items-center gap-2 text-red-400 font-roboto-condensed text-[9px] font-bold uppercase tracking-widest shrink-0"
                >
                  <WifiOff size={12} />
                  <span>WebSocket connection failed — check that the backend SSH proxy is running.</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ---- Xterm mount point ---- */}
            <div
              ref={terminalRef}
              className="flex-1 overflow-hidden p-2"
              style={{ background: "#03050a" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SshTerminal;
