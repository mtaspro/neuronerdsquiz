import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaPlay, FaTimes } from 'react-icons/fa';
import SpectatorMode from './SpectatorMode';

const SpectatorAccess = ({ isOpen, onClose, roomId: propRoomId, autoJoin = false }) => {
  const [roomId, setRoomId] = useState(propRoomId || '');
  const [spectatorMode, setSpectatorMode] = useState(false);
  const [error, setError] = useState('');

  // Auto-join if roomId is provided
  useEffect(() => {
    if (autoJoin && propRoomId && isOpen) {
      setRoomId(propRoomId);
      setSpectatorMode(true);
    }
  }, [autoJoin, propRoomId, isOpen]);

  const handleJoinAsSpectator = () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    setError('');
    setSpectatorMode(true);
  };

  const handleCloseSpectator = () => {
    setSpectatorMode(false);
    setRoomId('');
    onClose();
  };

  if (spectatorMode) {
    return (
      <SpectatorMode 
        roomId={roomId.trim()} 
        onClose={handleCloseSpectator}
      />
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaEye className="text-2xl text-purple-500" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Spectator Mode
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            Watch live quiz battles in real-time! See players' progress on the battle track and follow the competition as it unfolds.
          </p>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
              🎮 Spectator Features:
            </h3>
            <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
              <li>• Live battle track with player positions</li>
              <li>• Real-time score updates</li>
              <li>• Progress visualization</li>
              <li>• Sound notifications</li>
              <li>• Final results display</li>
            </ul>
          </div>
        </div>

        {/* Room ID Input */}
        <div className="mb-6">
          <label htmlFor="spectator-room-id" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Enter Battle Room ID
          </label>
          <input
            id="spectator-room-id"
            type="text"
            value={roomId}
            onChange={(e) => {
              setRoomId(e.target.value);
              setError('');
            }}
            placeholder="e.g., battle-1234567890-abc123"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors"
          />
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleJoinAsSpectator}
            disabled={!roomId.trim()}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
              roomId.trim()
                ? 'bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <FaPlay />
            <span>Watch Battle</span>
          </motion.button>
        </div>

        {/* Tips */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 Tip: Get room IDs from friends or check active battles
        </div>
      </motion.div>
    </div>
  );
};

export default SpectatorAccess;