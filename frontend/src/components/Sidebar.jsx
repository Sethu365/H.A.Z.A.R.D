import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import eyeLogo from "../assets/eye.png";
import { 
  Users, 
  AlertTriangle, 
  Settings, 
  Activity,
  Lock
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: Activity, label: 'Dashboard' },
    { path: '/user-behavior', icon: Users, label: 'User Behavior' },
    { path: '/anomalies', icon: AlertTriangle, label: 'Anomalies' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <motion.div 
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col"
    >
   {/* Logo Section */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-1 rounded-xl">
            <img
              src={eyeLogo}
              alt="H.A.Z.A.R.D Logo"
              className="w-13 h-13 object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              H.A.Z.A.R.D
            </h1>
            <p className="text-xs text-gray-400">Anomaly Detection</p>
          </div>
        </div>
      </div>


      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-green-500/20 to-cyan-500/20 text-green-400 border border-green-500/30'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Security Status */}
      <div className="p-4 border-t border-gray-700">
        <div className="bg-gray-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Lock className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">Secure</span>
          </div>
          <p className="text-xs text-gray-400">All systems operational</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;

