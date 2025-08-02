import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Badge = ({ 
  badge, 
  size = 'md', 
  showTooltip = true, 
  className = '',
  onClick = null 
}) => {
  const [showTooltipState, setShowTooltipState] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const badgeClass = `
    ${sizeClasses[size]} 
    rounded-full 
    bg-gradient-to-br 
    from-yellow-400 
    to-orange-500 
    flex 
    items-center 
    justify-center 
    shadow-lg 
    border-2 
    border-yellow-300 
    cursor-pointer 
    transition-all 
    duration-200 
    hover:scale-110 
    hover:shadow-xl
    ${className}
  `;

  const formatValue = (value, badgeName) => {
    if (badgeName === 'speed_demon' && value) {
      // Convert milliseconds to seconds
      return `${(value / 1000).toFixed(1)}s`;
    }
    if (badgeName === 'quiz_king' && value) {
      return `${value.toFixed(1)}%`;
    }
    return value?.toString() || '0';
  };

  const getBadgeColor = (badgeName) => {
    const colors = {
      sharpest_mind: 'from-blue-400 to-blue-600',
      quiz_king: 'from-purple-400 to-purple-600',
      battle_champion: 'from-red-400 to-red-600',
      speed_demon: 'from-green-400 to-green-600',
      leader_of_leaders: 'from-yellow-400 to-orange-500'
    };
    return colors[badgeName] || 'from-gray-400 to-gray-600';
  };

  return (
    <div className="relative inline-block">
      <motion.div
        className={`${badgeClass} ${getBadgeColor(badge.badgeName)}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => showTooltip && setShowTooltipState(true)}
        onMouseLeave={() => setShowTooltipState(false)}
        onClick={onClick}
      >
        <span className="font-bold text-white drop-shadow-sm">
          {badge.icon}
        </span>
      </motion.div>

      {/* Tooltip */}
      {showTooltip && showTooltipState && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.8 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
        >
          <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 shadow-xl border border-gray-700 min-w-48 max-w-64">
            <div className="font-bold text-yellow-400 mb-1">
              {badge.displayName}
            </div>
            <div className="text-gray-300 mb-2">
              {badge.description}
            </div>
            {badge.currentHolderUsername && (
              <div className="text-xs text-blue-400">
                Current holder: <span className="font-semibold">{badge.currentHolderUsername}</span>
                {badge.currentValue && (
                  <span className="ml-1">
                    ({formatValue(badge.currentValue, badge.badgeName)})
                  </span>
                )}
              </div>
            )}
            {badge.earnedAt && (
              <div className="text-xs text-green-400 mt-1">
                Earned: {new Date(badge.earnedAt).toLocaleDateString()}
              </div>
            )}
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Badge;