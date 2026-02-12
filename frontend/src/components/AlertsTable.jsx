import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Clock } from 'lucide-react';

const AlertsTable = ({ alerts = [] }) => {
  const getStatusColor = (severity) => {
    switch ((severity || "").toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (severity) => {
    switch ((severity || "").toLowerCase()) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      case 'low':
        return <Shield className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Security Alerts</h3>
        <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
          View All
        </button>
      </div>

      <div className="overflow-hidden">
        <div className="space-y-3">
          {Array.isArray(alerts) && alerts.map((alert, index) => (
            <motion.div
              key={alert.id || index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-700/30 rounded-xl p-4 hover:bg-gray-700/50 transition-colors border border-gray-600/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div
                    className={`px-3 py-1 rounded-lg text-xs font-medium border flex items-center space-x-2 ${getStatusColor(alert.severity)}`}
                  >
                    {getStatusIcon(alert.severity)}
                    <span>{alert.severity || "Unknown"}</span>
                  </div>

                  <div className="flex-1">
                    <p className="text-gray-300 text-sm">
                      {alert.message || "No description"}
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-gray-400 text-xs">
                    {new Date(alert.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {(!alerts || alerts.length === 0) && (
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No recent alerts</p>
          <p className="text-gray-500 text-sm mt-1">System is secure</p>
        </div>
      )}
    </motion.div>
  );
};

export default AlertsTable;
