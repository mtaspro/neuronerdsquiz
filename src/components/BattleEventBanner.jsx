import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const BattleEventBanner = () => {
  const [currentEvent, setCurrentEvent] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const fetchCurrentEvent = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/events/current`);
        setCurrentEvent(response.data);
      } catch (error) {
        console.error('Failed to fetch current event:', error);
      }
    };

    fetchCurrentEvent();
  }, []);

  useEffect(() => {
    if (!currentEvent) return;

    const updateTimer = () => {
      const now = new Date();
      const endDate = new Date(currentEvent.endDate);
      const diff = endDate - now;

      if (diff <= 0) {
        setTimeLeft('Event Ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [currentEvent]);

  if (!currentEvent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white p-4 rounded-lg shadow-lg mb-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">🏆 {currentEvent.title}</h3>
          <p className="text-sm opacity-90">{currentEvent.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">💰 ${currentEvent.prizeAmount}</div>
          <div className="text-sm">⏰ {timeLeft}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default BattleEventBanner;