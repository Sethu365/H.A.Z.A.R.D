import React from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    /* GLOBAL WRAPPER 
       - overflow-hidden: keeps the main viewport steady while content scrolls internally.
    */
    <div className="h-screen w-screen flex bg-[#020617] text-slate-200 font-inter overflow-hidden">
      
      {/* SIDEBAR BLOCK (Desktop)
          The fixed sidebar is handled inside the Sidebar component, 
          but we keep this div to maintain the grid gap on desktop.
      */}
      <div className="hidden lg:block h-full w-64 flex-shrink-0 border-r border-white/5">
        <Sidebar />
      </div>

      {/* MOBILE NAVIGATION (Floating)
          This renders the floating dock and top logo.
      */}
      <div className="lg:hidden">
        <Sidebar />
      </div>

      {/* MAIN CONTENT BLOCK 
          - pb-32: Padding at the bottom for mobile so content clears the floating bar.
          - lg:p-8: Generous padding for desktop high-density views.
      */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto cyber-scroll selection:bg-cyan-500/30 p-4 pb-32 lg:p-8 lg:pb-8">
        
        {/* Internal density wrapper */}
        <div className="max-w-[1600px] w-full mx-auto lg:mx-0">
          <Outlet />
        </div>
        
      </main>
    </div>
  );
}