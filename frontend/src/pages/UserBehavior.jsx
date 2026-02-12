// // frontend/src/pages/UserBehavior.jsx
// import React, { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   Cell,
// } from "recharts";
// import { getUserBehavior } from "../api";
// import { Clock, TrendingUp, Users, Eye } from "lucide-react";

// const UserBehavior = () => {
//   const [behaviorData, setBehaviorData] = useState([]);
//   const [summary, setSummary] = useState({});
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const data = await getUserBehavior();
//         setBehaviorData(data.rows || []);
//         setSummary({
//           peakHour: data.peakHour,
//           anomalousUsers: data.anomalousUsers,
//           behavioralScore: data.behavioralScore,
//           underReview: data.underReview,
//         });
//       } catch (error) {
//         console.error("❌ Error loading user behavior data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//     const interval = setInterval(loadData, 60000); // refresh every 1 min
//     return () => clearInterval(interval);
//   }, []);

//   const CustomTooltip = ({ active, payload, label }) => {
//     if (active && payload?.length) {
//       return (
//         <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
//           <p className="text-gray-300 text-sm">
//             {new Date(label).toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             })}
//           </p>
//           <p className="text-cyan-400 font-semibold">
//             Activity: {payload[0]?.value ?? 0}%
//           </p>
//           <p className="text-orange-400 font-semibold">
//             Risk Level: {payload[1]?.value ?? 0}%
//           </p>
//         </div>
//       );
//     }
//     return null;
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <motion.div
//           animate={{ rotate: 360 }}
//           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//           className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"
//         />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div>
//         <motion.h1
//           initial={{ opacity: 0, scale: 0.95 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 0.5, ease: "easeOut" }}
//           className="text-3xl font-bold text-white mb-2"
//         >
//           User Behavior Analytics
//         </motion.h1>
//         <p className="text-gray-400">
//           24-hour activity patterns and risk assessment
//         </p>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//         <StatCard
//           title="Peak Activity Hour"
//           value={
//             summary.peakHour !== undefined && summary.peakHour !== null
//               ? `${summary.peakHour}:00`
//               : "N/A"
//           }
//           icon={Clock}
//           color="text-cyan-400"
//         />
//         <StatCard
//           title="Anomalous Users"
//           value={summary.anomalousUsers ?? 0}
//           icon={Users}
//           color="text-orange-400"
//         />
//         <StatCard
//           title="Behavioral Score"
//           value={`${summary.behavioralScore ?? 0}%`}
//           icon={TrendingUp}
//           color="text-green-400"
//         />
//         <StatCard
//           title="Under Review"
//           value={summary.underReview ?? 0}
//           icon={Eye}
//           color="text-yellow-400"
//         />
//       </div>

//       {/* Activity Chart */}
//       <motion.div
//         initial={{ y: 20, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ delay: 0.4 }}
//         className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
//       >
//         <h3 className="text-lg font-semibold text-white mb-6">
//           24-Hour Activity Pattern
//         </h3>
//         <div className="h-80">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={behaviorData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
//               <XAxis
//                 dataKey="created_at"
//                 tick={{ fill: "#9ca3af", fontSize: 12 }}
//                 tickFormatter={(value) =>
//                   new Date(value).toLocaleTimeString([], {
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   })
//                 }
//                 stroke="#6b7280"
//               />
//               <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} stroke="#6b7280" />
//               <Tooltip content={<CustomTooltip />} />
//               <Bar dataKey="activity" fill="#06b6d4" radius={[4, 4, 0, 0]}>
//                 {behaviorData.map((entry, index) => (
//                   <Cell
//                     key={`activity-${index}`}
//                     fill={entry.activity > 70 ? "#06b6d4" : "#6b7280"}
//                   />
//                 ))}
//               </Bar>
//               <Bar dataKey="risk" fill="#f97316" radius={[4, 4, 0, 0]}>
//                 {behaviorData.map((entry, index) => (
//                   <Cell
//                     key={`risk-${index}`}
//                     fill={entry.risk > 30 ? "#f97316" : "#94a3b8"}
//                   />
//                 ))}
//               </Bar>
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// const StatCard = ({ title, value, icon: Icon, color }) => (
//   <motion.div
//     initial={{ scale: 0.9, opacity: 0 }}
//     animate={{ scale: 1, opacity: 1 }}
//     className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
//   >
//     <div className="flex items-center justify-between">
//       <div>
//         <p className="text-gray-400 text-sm mb-1">{title}</p>
//         <p className={`text-2xl font-bold ${color}`}>{value}</p>
//       </div>
//       <Icon className={`w-8 h-8 ${color}`} />
//     </div>
//   </motion.div>
// );

// export default UserBehavior;

// frontend/src/pages/UserBehavior.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getUserBehavior } from "../api";
import { Clock, TrendingUp, Users, Eye } from "lucide-react";

const UserBehavior = () => {
  const [behaviorData, setBehaviorData] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getUserBehavior();
        setBehaviorData(data.rows || []);
        setSummary({
          peakHour: data.peakHour,
          anomalousUsers: data.anomalousUsers,
          behavioralScore: data.behavioralScore,
          underReview: data.underReview,
        });
      } catch (error) {
        console.error("❌ Error loading user behavior data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000); // auto-refresh every 1 min
    return () => clearInterval(interval);
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm">
            {new Date(label).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-cyan-400 font-semibold">
            Activity: {payload.find(p => p.dataKey === "activity")?.value ?? 0}%
          </p>
          <p className="text-orange-400 font-semibold">
            Risk Level: {payload.find(p => p.dataKey === "risk")?.value ?? 0}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-3xl font-bold text-white mb-2"
        >
          User Behavior Analytics
        </motion.h1>
        <p className="text-gray-400">
          24-hour activity patterns and risk assessment
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Peak Activity Hour"
          value={
            summary.peakHour !== undefined && summary.peakHour !== null
              ? `${summary.peakHour}:00`
              : "N/A"
          }
          icon={Clock}
          color="text-cyan-400"
        />
        <StatCard
          title="Anomalous Users"
          value={summary.anomalousUsers ?? 0}
          icon={Users}
          color="text-orange-400"
        />
        <StatCard
          title="Behavioral Score"
          value={`${summary.behavioralScore ?? 0}%`}
          icon={TrendingUp}
          color="text-green-400"
        />
        <StatCard
          title="Under Review"
          value={summary.underReview ?? 0}
          icon={Eye}
          color="text-yellow-400"
        />
      </div>

      {/* Activity Chart */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
      >
        <h3 className="text-lg font-semibold text-white mb-6">
          24-Hour Activity Pattern
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={behaviorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="created_at"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
                stroke="#6b7280"
              />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} stroke="#6b7280" />
              <Tooltip content={<CustomTooltip />} />

              <Bar dataKey="activity" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                {behaviorData.map((entry, index) => (
                  <Cell
                    key={`activity-${index}`}
                    fill={entry.activity > 70 ? "#06b6d4" : "#6b7280"}
                  />
                ))}
              </Bar>

              <Bar dataKey="risk" fill="#f97316" radius={[4, 4, 0, 0]}>
                {behaviorData.map((entry, index) => (
                  <Cell
                    key={`risk-${index}`}
                    fill={entry.risk > 30 ? "#f97316" : "#94a3b8"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <Icon className={`w-8 h-8 ${color}`} />
    </div>
  </motion.div>
);

export default UserBehavior;
