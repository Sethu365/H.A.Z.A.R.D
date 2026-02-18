import React from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="h-screen w-screen flex bg-[#020617] text-gray-100 overflow-hidden">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN COLUMN */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* TOPBAR */}
        <Topbar />

        {/* CONTENT AREA */}
        <main
          className="
            flex-1
            overflow-y-auto
            px-6 py-6
            bg-[#020617]
          "
        >
          {/* Page content */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
