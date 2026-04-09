import React from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    /* GLOBAL WRAPPER 
       - p-5: Consistent outer margin for the whole application.
       - gap-6: The specific gutter between the sidebar and content.
    */
    <div className="h-screen w-screen flex p-5 gap-6 bg-[#020617] text-slate-200 font-inter overflow-hidden">
      
      {/* SIDEBAR BLOCK 
          Defined only by its width and natural boundaries.
      */}
      <div className="h-full w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* MAIN CONTENT BLOCK 
          Simply displays the content within the right-hand column.
      */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto cyber-scroll selection:bg-cyan-500/30">
        {/* Internal density wrapper: 
           Prevents content from stretching too wide on 4K monitors while 
           staying perfectly aligned to the left of its block. 
        */}
        <div className="max-w-[1600px] w-full py-2">
          <Outlet />
        </div>
      </main>

    </div>
  );
}