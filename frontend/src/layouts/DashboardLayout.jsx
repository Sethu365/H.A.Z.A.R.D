import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function DashboardLayout() {
  // State to hold page title and description
  const [headerData, setHeaderData] = useState({ 
    name: "Dashboard", 
    desc: "Neural link active // System monitoring" 
  });

  return (
    <div className="h-screen w-screen flex bg-[#020617] text-slate-200 font-inter overflow-hidden">
      {/* 1. Sidebar stays fixed on the left */}
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* 2. Topbar sits at the top of the main column */}
        <Topbar name={headerData.name} desc={headerData.desc} />
        
        {/* Subtle glow accent */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

        {/* 3. Main Content Container */}
        <main className="flex-1 overflow-y-auto px-4 md:px-10 pt-28 pb-8 cyber-scroll relative z-10 selection:bg-cyan-500/30">
          <div className="max-w-[1440px] mx-auto w-full">
            {/* CRITICAL: Pass setHeaderData into the context.
               All your routes in App.js will be able to access this.
            */}
            <Outlet context={{ setHeaderData }} />
          </div>

          {/* Spacer for mobile menu clearance */}
          <div className="h-20 md:hidden" />
        </main>
      </div>
    </div>
  );
}