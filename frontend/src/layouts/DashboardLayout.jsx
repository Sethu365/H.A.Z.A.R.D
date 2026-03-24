import React from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="h-screen w-screen flex bg-[#020617] text-slate-200 font-inter overflow-hidden">
      {/* SIDEBAR - Fixed width, stays on the left */}
      <Sidebar />

      {/* MAIN COLUMN */}
      <div className="flex flex-col flex-1 min-w-0 relative">
        
        {/* TOP BACKGROUND GRADIENT ACCENT (Subtle Glow) */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

        {/* CONTENT AREA */}
        <main
          className="
            flex-1
            overflow-y-auto
            px-4 md:px-10 
            py-8
            bg-transparent
            cyber-scroll 
            relative 
            z-10
            selection:bg-cyan-500/30
          "
        >
          {/* The max-w-7xl ensures that on huge screens, 
             the dashboard doesn't "spread out" too far, 
             maintaining the tactical HUD density.
          */}
          <div className="max-w-[1440px] mx-auto w-full">
            <Outlet />
          </div>

          {/* Optional Footer Space for mobile accessibility */}
          <div className="h-20 md:hidden" />
        </main>
      </div>
    </div>
  );
}