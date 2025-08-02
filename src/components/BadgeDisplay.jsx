import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Badge from './Badge';
import axios from 'axios';

const BadgeDisplay = ({ 
  userId, 
  username, 
  size = 'md', 
  maxDisplay = 5, 
  showAll = false,
  className = '' 
}) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserBadges();
  }, [userId]);

  const fetchUserBadges = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('authToken');
      
      const response = await axios.get(`${apiUrl}/api/badges/user/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      setBadges(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching user badges:', err);
      setError('Failed to load badges');
      setBadges([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`
              ${size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8'}
              rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse
            `}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-xs text-red-500 ${className}`}>
        Failed to load badges
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}>
        No badges yet
      </div>
    );
  }

  const displayBadges = showAll ? badges : badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {displayBadges.map((badge, index) => (
        <motion.div
          key={badge.badgeName}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <Badge
            badge={badge}
            size={size}
            showTooltip={true}
          />
        </motion.div>
      ))}
      
      {!showAll && remainingCount > 0 && (
        <div className={`
          ${size === 'sm' ? 'w-6 h-6 text-xs' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-8 h-8 text-xs'}
          rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold
        `}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default BadgeDisplay;