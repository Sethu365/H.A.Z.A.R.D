// SshTerminal.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Wifi, WifiOff, Loader, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WS_SSH_URL = "ws://172.24.16.81:8001/ws/ssh";

const CONNECTION_STATUS = {
  DISCONNECTED: "disconnected",
  CONNECTING:   "connecting",
  CONNECTED:    "connected",
  ERROR:        "error",
};

const SshTerminal = ({ isOpen, onClose, apiBase }) => {
  const terminalRef  = useRef(null);
  const xtermRef     = useRef(null);
  const fitAddonRef  = useRef(null);
  const wsRef        = useRef(null);
  const resizeObRef  = useRef(null);

  const [status, setStatus]     = useState(CONNECTION_STATUS.DISCONNECTED);
  const [isMaximized, setIsMax] = useState(false);

  // REFINED: Improved Fit Logic to prevent trimming
  const fitTerminal = useCallback(() => {
    if (!fitAddonRef.current || !xtermRef.current) return;
    
    // 1. Force xterm to sync with its container dimensions
    fitAddonRef.current.fit();
    
    // 2. Transmit the precise grid size to the backend PTY
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const { cols, rows } = xtermRef.current;
      wsRef.current.send(JSON.stringify({ type: "resize", cols, rows }));
    }
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
      if (cancelled || !terminalRef.current) return;

      const term = new Terminal({
        cursorBlink:     true,
        cursorStyle:     "bar",
        fontSize:        13,
        fontFamily:      '"JetBrains Mono", monospace',
        // IMPORTANT: Allow the terminal to handle scrollback internally
        scrollback:      5000, 
        theme: {
          background:    "#000000",
          foreground:    "#e2e8f0",
          cursor:        "#22d3ee",
          cursorAccent:  "#000000",
          selectionBackground: "rgba(34,211,238,0.25)",
        },
        allowProposedApi: true,
      });

      const fitAddon      = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());

      term.open(terminalRef.current);
      
      // Initial fit after a tiny delay to ensure DOM layout is painted
      setTimeout(() => fitAddon.fit(), 50);

      xtermRef.current    = term;
      fitAddonRef.current = fitAddon;

      setStatus(CONNECTION_STATUS.CONNECTING);
      const ws = new WebSocket(WS_SSH_URL);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) { ws.close(); return; }
        setStatus(CONNECTION_STATUS.CONNECTED);
        fitTerminal(); // Send dimensions as soon as link is up
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
      ws.onclose = () => { if (!cancelled) setStatus(CONNECTION_STATUS.DISCONNECTED); };

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "data", data }));
        }
      });

      // Observer keeps the terminal fitted during manual resizes or keyboard pops
      resizeObRef.current = new ResizeObserver(() => fitTerminal());
      resizeObRef.current.observe(terminalRef.current);
    });

    return () => {
      cancelled = true;
      resizeObRef.current?.disconnect();
      xtermRef.current?.dispose();
      wsRef.current?.close();
    };
  }, [isOpen, fitTerminal]);

  // Re-fit when switching between maximized/normal view
  useEffect(() => {
    const id = setTimeout(fitTerminal, 150);
    return () => clearTimeout(id);
  }, [isMaximized, fitTerminal]);

  const StatusDot = () => {
    const cfg = {
      [CONNECTION_STATUS.CONNECTING]:   { color: "text-yellow-400", icon: <Loader size={10} className="animate-spin" />,  label: "Syncing" },
      [CONNECTION_STATUS.CONNECTED]:    { color: "text-emerald-400", icon: <Wifi size={10} />,    label: "Link_Active" },
      [CONNECTION_STATUS.ERROR]:        { color: "text-red-400",     icon: <WifiOff size={10} />, label: "Fault" },
      [CONNECTION_STATUS.DISCONNECTED]: { color: "text-gray-500",    icon: <WifiOff size={10} />, label: "Offline" },
    }[status];

    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 font-roboto-condensed text-[8px] font-black uppercase tracking-widest ${cfg.color}`}>
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
          className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`bg-[#000000] flex flex-col overflow-hidden transition-all duration-300 ${
              isMaximized ? "w-full h-full" : "w-full h-full md:w-[90%] md:h-[80vh] md:rounded-[2.5rem] md:border md:border-white/10"
            }`}
          >
            {/* Header */}
            <div className="bg-[#03050a] px-5 py-4 flex items-center justify-between border-b border-white/5 shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} className="text-gray-400 hover:text-white" />
                </button>
                <div className="w-[1px] h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <TerminalIcon size={14} className="text-cyan-400" />
                  <span className="font-roboto-condensed text-[10px] font-bold text-white uppercase tracking-widest leading-none">
                    Console_Uplink
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <StatusDot />
                <button
                  onClick={() => { setIsMax(!isMaximized); }}
                  className="hidden md:flex p-2 rounded-lg bg-white/5 border border-white/5 text-gray-500 hover:text-cyan-400 transition-all"
                >
                  {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>
            </div>

            {/* THE TERMINAL MOUNT - Optimized to prevent trimming */}
            <div
              ref={terminalRef}
              className="flex-1 w-full overflow-hidden bg-black relative"
            >
              {/* xterm will inject its canvas here */}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SshTerminal;