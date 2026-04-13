import React from "react";
import { Outlet } from "react-router-dom";

export default function ClusterLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020617] text-slate-200">
      <main className="h-full overflow-y-auto cyber-scroll">
        <Outlet />
      </main>
    </div>
  );
}
