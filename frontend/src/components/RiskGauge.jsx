import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const RiskGauge = ({ score = 45, trend = 'up', change = 5 }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 500);
    return () => clearTimeout(timer);
  }, [score]);

  const circumference = 2 * Math.PI * 70;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStrokeColor = (score) => {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f97316';
    if (score >= 40) return '#eab308';
    return '#22c55e';
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Threat Risk Score</h3>
        <div className="flex items-center space-x-1">
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-red-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-green-400" />
          )}
          <span className={`text-sm ${trend === 'up' ? 'text-red-400' : 'text-green-400'}`}>
            {change}%
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle cx="80" cy="80" r="70" stroke="#374151" strokeWidth="12" fill="none" />
            {/* Progress circle */}
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              stroke={getStrokeColor(animatedScore)}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                filter: `drop-shadow(0 0 8px ${getStrokeColor(animatedScore)}40)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                className={`text-3xl font-bold ${getScoreColor(animatedScore)}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
              >
                {animatedScore.toFixed(0)}
              </motion.div>
              <div className="text-xs text-gray-400 mt-1">Risk Level</div>
              <div className="text-xs mt-1 font-semibold text-white">
                {animatedScore >= 50 ? "⚠️ At Risk" : "✅ Normal"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RiskGauge;
