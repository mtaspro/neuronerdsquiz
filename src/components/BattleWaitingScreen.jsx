import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaClock, FaUsers, FaTrophy, FaCheck, FaSpinner } from 'react-icons/fa';

const BattleWaitingScreen = ({ 
  currentUser, 
  allUsers, 
  questions, 
  userScore, 
  onLeaveRoom 
}) => {
  const [dots, setDots] = useState('');

  // Animate dots for loading effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const finishedUsers = allUsers.filter(user => 
    user.currentQuestion >= questions.length
  );
  
  const remainingUsers = allUsers.filter(user => 
    user.currentQuestion < questions.length
  );

  const totalUsers = allUsers.length;
  const finishedCount = finishedUsers.length;
  const progressPercentage = (finishedCount / totalUsers) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl w-full border border-white border-opacity-20"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <FaClock className="text-6xl text-yellow-400" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-white mb-2">
            Quiz Complete!
          </h2>
          
          <p className="text-xl text-gray-300">
            Waiting for other players to finish{dots}
          </p>
        </div>

        {/* User's Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-6 mb-6 text-center"
        >
          <div className="flex items-center justify-center space-x-4">
            <FaTrophy className="text-3xl text-yellow-300" />
            <div>
              <div className="text-2xl font-bold text-white">Your Score</div>
              <div className="text-4xl font-bold text-yellow-300">{userScore} points</div>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-semibold">Battle Progress</span>
            <span className="text-gray-300 text-sm">
              {finishedCount}/{totalUsers} players finished
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Players Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Finished Players */}
          <div className="bg-green-500 bg-opacity-20 rounded-lg p-4 border border-green-400 border-opacity-30">
            <h3 className="text-green-400 font-semibold mb-3 flex items-center">
              <FaCheck className="mr-2" />
              Finished ({finishedCount})
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {finishedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-white">{user.username}</span>
                  <span className="text-green-400 font-semibold">
                    {user.score} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Still Playing */}
          <div className="bg-orange-500 bg-opacity-20 rounded-lg p-4 border border-orange-400 border-opacity-30">
            <h3 className="text-orange-400 font-semibold mb-3 flex items-center">
              <FaSpinner className="mr-2 animate-spin" />
              Still Playing ({remainingUsers.length})
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {remainingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-white">{user.username}</span>
                  <span className="text-orange-400 text-xs">
                    Q{user.currentQuestion + 1}/{questions.length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Motivational Messages */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mb-6"
        >
          <div className="bg-blue-500 bg-opacity-20 rounded-lg p-4 border border-blue-400 border-opacity-30">
            <p className="text-blue-300 text-sm">
              🎉 Great job completing the quiz! Results will be shown once all players finish.
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLeaveRoom}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>Leave Room</span>
          </motion.button>
          
          <div className="flex-1 bg-gray-600 text-gray-300 py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 cursor-not-allowed">
            <FaClock />
            <span>Waiting...</span>
          </div>
        </div>

        {/* Estimated Time */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-400">
            Results will appear automatically when all players finish
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default BattleWaitingScreen;