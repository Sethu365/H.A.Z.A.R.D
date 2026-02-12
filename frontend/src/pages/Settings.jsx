import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Users, 
  Database, 
  Wifi, 
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

const Settings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    criticalOnly: false,
  });

  const [security, setSecurity] = useState({
    twoFactor: true,
    autoLock: '30',
    sessionTimeout: '60',
  });

  const [detection, setDetection] = useState({
    sensitivity: 'high',
    autoBlock: true,
    learningMode: false,
    threshold: '75',
  });

  const [showApiKey, setShowApiKey] = useState(false);

  const SettingCard = ({ icon: Icon, title, children }) => (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      whileHover={{ scale: 1.01 }}
      className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-green-500/20 rounded-xl">
          <Icon className="w-6 h-6 text-cyan-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  );

  const Toggle = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-white font-medium">{label}</p>
        {description && <p className="text-gray-400 text-sm">{description}</p>}
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-cyan-500' : 'bg-gray-600'
        }`}
      >
        <motion.div
          animate={{ x: enabled ? 24 : 2 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
        />
      </motion.button>
    </div>
  );

  const Select = ({ value, onChange, options, label }) => (
    <div className="py-3">
      <label className="block text-white font-medium mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-700 text-white px-4 py-2 rounded-xl border border-gray-600 focus:border-cyan-400 focus:outline-none transition-colors"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

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
    System Settings
  </motion.h1>
  <p className="text-gray-400">
    Configure H.A.Z.A.R.D security parameters and preferences
  </p>
</div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Settings */}
        <SettingCard icon={Shield} title="Security Configuration">
          <div className="space-y-1">
            <Toggle
              enabled={security.twoFactor}
              onChange={(value) => setSecurity(prev => ({ ...prev, twoFactor: value }))}
              label="Two-Factor Authentication"
              description="Enable 2FA for enhanced security"
            />
            
            <Select
              value={security.autoLock}
              onChange={(value) => setSecurity(prev => ({ ...prev, autoLock: value }))}
              label="Auto-lock timeout (minutes)"
              options={[
                { value: '15', label: '15 minutes' },
                { value: '30', label: '30 minutes' },
                { value: '60', label: '1 hour' },
                { value: '120', label: '2 hours' },
              ]}
            />

            <Select
              value={security.sessionTimeout}
              onChange={(value) => setSecurity(prev => ({ ...prev, sessionTimeout: value }))}
              label="Session timeout (minutes)"
              options={[
                { value: '30', label: '30 minutes' },
                { value: '60', label: '1 hour' },
                { value: '120', label: '2 hours' },
                { value: '240', label: '4 hours' },
              ]}
            />
          </div>
        </SettingCard>

        {/* Detection Settings */}
        <SettingCard icon={Eye} title="Detection Parameters">
          <div className="space-y-1">
            <Select
              value={detection.sensitivity}
              onChange={(value) => setDetection(prev => ({ ...prev, sensitivity: value }))}
              label="Detection Sensitivity"
              options={[
                { value: 'low', label: 'Low - Fewer false positives' },
                { value: 'medium', label: 'Medium - Balanced detection' },
                { value: 'high', label: 'High - Maximum sensitivity' },
              ]}
            />

            <Toggle
              enabled={detection.autoBlock}
              onChange={(value) => setDetection(prev => ({ ...prev, autoBlock: value }))}
              label="Automatic Threat Blocking"
              description="Automatically block high-risk activities"
            />

            <Toggle
              enabled={detection.learningMode}
              onChange={(value) => setDetection(prev => ({ ...prev, learningMode: value }))}
              label="Machine Learning Mode"
              description="Enable adaptive threat detection"
            />

            <div className="py-3">
              <label className="block text-white font-medium mb-2">
                Risk Threshold: {detection.threshold}%
              </label>
              <input
                type="range"
                min="50"
                max="95"
                value={detection.threshold}
                onChange={(e) => setDetection(prev => ({ ...prev, threshold: e.target.value }))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${(detection.threshold - 50) / 45 * 100}%, #374151 ${(detection.threshold - 50) / 45 * 100}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>
          </div>
        </SettingCard>

        {/* Notification Settings */}
        <SettingCard icon={Bell} title="Alert Notifications">
          <div className="space-y-1">
            <Toggle
              enabled={notifications.email}
              onChange={(value) => setNotifications(prev => ({ ...prev, email: value }))}
              label="Email Notifications"
              description="Receive alerts via email"
            />

            <Toggle
              enabled={notifications.sms}
              onChange={(value) => setNotifications(prev => ({ ...prev, sms: value }))}
              label="SMS Notifications"
              description="Receive critical alerts via SMS"
            />

            <Toggle
              enabled={notifications.push}
              onChange={(value) => setNotifications(prev => ({ ...prev, push: value }))}
              label="Push Notifications"
              description="Browser push notifications"
            />

            <Toggle
              enabled={notifications.criticalOnly}
              onChange={(value) => setNotifications(prev => ({ ...prev, criticalOnly: value }))}
              label="Critical Alerts Only"
              description="Only notify for critical threats"
            />
          </div>
        </SettingCard>

        {/* API & Integration */}
        <SettingCard icon={Database} title="API & Integration">
          <div className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">API Key</label>
              <div className="flex items-center space-x-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value="hazard_api_key_2024_secure_token_12345"
                  readOnly
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-xl border border-gray-600"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-colors"
            >
              Generate New API Key
            </motion.button>

            <div className="pt-4 border-t border-gray-600">
              <h4 className="text-white font-medium mb-3">Integration Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">SIEM Connection</span>
                  <span className="text-green-400 text-sm">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Threat Intelligence</span>
                  <span className="text-green-400 text-sm">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Log Forwarding</span>
                  <span className="text-yellow-400 text-sm">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </SettingCard>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-end space-x-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
        >
          Reset to Defaults
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-green-600 hover:from-cyan-700 hover:to-green-700 text-white rounded-xl transition-all"
        >
          Save Changes
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Settings;