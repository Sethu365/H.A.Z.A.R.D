import React from "react";
import { motion } from "framer-motion";
import { Bell, Search, User } from "lucide-react";

const Topbar = () => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gray-800/50 border-b border-gray-700 p-4"
    >
      <div className="flex items-center justify-between">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-white">
            Security Operations Center
          </h2>
          <p className="text-gray-400 text-sm">
            Real-time threat monitoring and anomaly detection
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search threats..."
              className="bg-gray-700 text-white pl-10 pr-4 py-2 rounded-xl border border-gray-600 focus:border-cyan-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-300" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </motion.button>

          {/* User Info */}
          <div className="flex items-center space-x-2 bg-gray-700 px-3 py-2 rounded-xl">
            <User className="w-5 h-5 text-gray-300" />
            <span className="text-sm text-gray-300">System Monitor</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Topbar;
