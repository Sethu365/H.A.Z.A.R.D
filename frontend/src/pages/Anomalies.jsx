import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAnomalies, getRecentAlerts } from '../api';
import { AlertTriangle, Shield, Clock, Filter, Search } from 'lucide-react';

const Anomalies = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [anomaliesData, alertsData] = await Promise.all([
          getAnomalies(),
          getRecentAlerts(),
        ]);
        setAnomalies(anomaliesData);
        setAlerts(alertsData);
      } catch (error) {
        console.error('Error loading anomalies data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || alert.status.toLowerCase() === filter;
    const matchesSearch = alert.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.ip.includes(searchTerm) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
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
      Anomaly Detection
    </motion.h1>
    <p className="text-gray-400">
      Detailed analysis of detected anomalies and security alerts
    </p>
  </div>

      {/* Filter and Search */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 text-white pl-10 pr-4 py-2 rounded-xl border border-gray-600 focus:border-cyan-400 focus:outline-none transition-colors w-64"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-xl border border-gray-600 focus:border-cyan-400 focus:outline-none transition-colors"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Anomalies</p>
              <p className="text-2xl font-bold text-cyan-400">{anomalies.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-cyan-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-400">
                {alerts.filter(a => a.status === 'Critical').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Resolved</p>
              <p className="text-2xl font-bold text-green-400">
                {Math.floor(alerts.length * 0.7)}
              </p>
            </div>
            <Shield className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">
                {Math.floor(alerts.length * 0.3)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </motion.div>
      </div>

      {/* Alerts List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
      >
        <h3 className="text-lg font-semibold text-white mb-6">Security Alerts</h3>
        
        <div className="space-y-4">
          {filteredAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-700/30 rounded-xl p-6 hover:bg-gray-700/50 transition-colors border border-gray-600/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </div>
                    <span className="text-white font-medium">{alert.user}</span>
                    <span className="text-gray-400 text-sm">from {alert.ip}</span>
                  </div>
                  
                  <p className="text-gray-300 mb-3">{alert.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-400">
                    <div>
                      <span className="font-medium">Risk Score: </span>
                      <span className={`font-semibold ${
                        alert.riskScore >= 80 ? 'text-red-400' :
                        alert.riskScore >= 60 ? 'text-orange-400' :
                        alert.riskScore >= 40 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {alert.riskScore}%
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Time: </span>
                      {alert.timestamp}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Investigate
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Dismiss
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No alerts match your criteria</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Anomalies;