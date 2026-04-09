import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TimelineAreaChart = ({ data = [], height = 300 }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!data.length) {
    return (
      <div 
        style={{ height }} 
        className="flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-gray-600 italic"
      >
        No_Neural_Stream_Data
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#020617]/95 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] z-[100]">
          <p className="text-[9px] font-black text-gray-500 mb-2 uppercase tracking-tighter italic border-b border-white/5 pb-1">
            Log_Time: {label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6 py-0.5">
              <span className="text-[9px] font-bold uppercase tracking-tight" style={{ color: entry.stroke }}>
                {entry.name}
              </span>
              <span className="text-xs font-mono font-black text-white">
                {entry.value}%
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[180px] relative">
      
      {/* --- HUD TACTICAL LEGEND --- */}
      <div className="absolute top-2 right-4 flex items-center gap-4 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]" />
          <span className="font-roboto-condensed text-[8px] font-black text-gray-500 uppercase tracking-widest">CPU_UTIL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#a855f7] shadow-[0_0_8px_#a855f7]" />
          <span className="font-roboto-condensed text-[8px] font-black text-gray-500 uppercase tracking-widest">MEM_UTIL</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={isMobile ? 220 : height}>
        <AreaChart
          data={data}
          margin={{ 
            top: 30, // Increased to clear HUD Legend
            right: isMobile ? 5 : 10, 
            left: isMobile ? -35 : -15, 
            bottom: 0 
          }}
        >
          <defs>
            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#ffffff" 
            vertical={false} 
            opacity={0.05} 
          />

          <XAxis
            dataKey="time"
            tick={{ fill: "#6b7280", fontSize: 8, fontWeight: 800, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            minTickGap={isMobile ? 40 : 30}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#6b7280", fontSize: 8, fontWeight: 800, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            hide={isMobile}
          />

          <Tooltip 
            content={<CustomTooltip />} 
            position={isMobile ? { y: 0 } : undefined}
          />

          <Area
            type="monotone"
            dataKey="cpu"
            name="CPU_Load"
            stroke="#f59e0b"
            strokeWidth={isMobile ? 1.5 : 2}
            fillOpacity={1}
            fill="url(#colorCpu)"
            isAnimationActive={false}
          />

          <Area
            type="monotone"
            dataKey="memory"
            name="MEM_Load"
            stroke="#a855f7"
            strokeWidth={isMobile ? 1.5 : 2}
            fillOpacity={1}
            fill="url(#colorMemory)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimelineAreaChart;