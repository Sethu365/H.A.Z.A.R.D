import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar, { TOPBAR_HEIGHT } from "../components/Topbar";

// Sidebar is w-20 = 5rem
const SIDEBAR_WIDTH = "80px";

export default function DashboardLayout() {
  const [headerData, setHeaderData] = useState({ 
    name: "Dashboard", 
    desc: "Infrastructure Operational Link" 
  });

  return (
    <div className="h-screen w-screen flex bg-[#eceef2] dark:bg-[#020617] text-slate-900 font-inter overflow-hidden relative transition-colors duration-700">
      
      {/* ── BACKGROUND BLOBS ─────────────────────────────────────────────────
          These are the "ink" the glass blurs against.
          Slightly higher opacity so backdrop-blur has colour to catch.
      */}
      <div className="absolute top-[-5%] left-[-2%] w-[55%] h-[55%]
                      bg-blue-400/20 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[0%] right-[-5%] w-[45%] h-[45%]
                      bg-indigo-400/25 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] right-[15%] w-[25%] h-[25%]
                      bg-purple-300/20 blur-[100px] rounded-full pointer-events-none" />

      {/* ── SIDEBAR (fixed, flush left) ──────────────────────────────────── */}
      <Sidebar />

      {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
      {/*
          ml offsets the column past the fixed sidebar on desktop.
          On mobile the sidebar is hidden, so no offset needed.
      */}
      <div
        className="flex flex-col flex-1 min-w-0 relative lg:ml-[80px]"
      >
        {/* Topbar (fixed, flush top, starts after sidebar) */}
        <Topbar name={headerData.name} desc={headerData.desc} />

        {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
        {/*
            pt  = TOPBAR_HEIGHT (72px) so content starts below the topbar
            pb  = 7rem on mobile to clear the bottom nav bar
            px  = comfortable reading gutters
        */}
        <main
          className="flex-1 overflow-y-auto cyber-scroll relative z-10 selection:bg-indigo-100
                     px-4 md:px-8 xl:px-12
                     pb-28 lg:pb-12"
          style={{ paddingTop: TOPBAR_HEIGHT }}
        >
          <div className="max-w-[1600px] mx-auto w-full min-h-full py-6">
            <Outlet context={{ setHeaderData }} />
          </div>
        </main>
      </div>
    </div>
  );
}