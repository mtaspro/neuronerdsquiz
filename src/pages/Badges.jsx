import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrophy, FaUsers, FaClock, FaChartLine } from 'react-icons/fa';
import axios from 'axios';
import Badge from '../components/Badge';
import { getAvatarUrl, getFallbackAvatar } from '../utils/avatarUtils';

const Badges = () => {
  const navigate = useNavigate();
  const [allBadges, setAllBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [badgeLeaderboard, setBadgeLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    fetchAllBadges();
    fetchUserStats();
  }, []);

  const fetchAllBadges = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${apiUrl}/api/badges/all`);
      setAllBadges(response.data);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('authToken');
      
      if (!token) return;
      
      const response = await axios.get(`${apiUrl}/api/badges/my-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUserStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchBadgeLeaderboard = async (badgeName) => {
    try {
      setLeaderboardLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${apiUrl}/api/badges/leaderboard/${badgeName}?limit=10`);
      setBadgeLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching badge leaderboard:', error);
      setBadgeLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
    fetchBadgeLeaderboard(badge.badgeName);
  };

  const formatValue = (value, badgeName) => {
    if (!value) return '0';
    
    switch (badgeName) {
      case 'speed_demon':
        return `${(value / 1000).toFixed(1)}s`;
      case 'quiz_king':
        return `${value.toFixed(1)}%`;
      case 'battle_champion':
        return `${value} wins`;
      case 'sharpest_mind':
        return `${value} correct`;
      case 'leader_of_leaders':
        return `${value} points`;
      default:
        return value.toString();
    }
  };

  const getStatValue = (badgeName) => {
    if (!userStats?.stats) return 0;
    
    switch (badgeName) {
      case 'sharpest_mind':
        return userStats.stats.totalCorrectAnswers || 0;
      case 'quiz_king':
        return userStats.stats.averageScore || 0;
      case 'battle_champion':
        return userStats.stats.battlesWon || 0;
      case 'speed_demon':
        return userStats.stats.averageTimePerQuiz || 0;
      case 'leader_of_leaders':
        return 0; // This would need leaderboard position
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-800 dark:text-white text-xl">Loading badges...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 dark:from-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors"
            >
              <FaArrowLeft />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">🏆 Badge System</h1>
          <p className="text-purple-200">Competitive achievements and rankings</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* All Badges */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FaTrophy className="mr-2 text-yellow-500" />
              Available Badges
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {allBadges.map((badge) => (
                <motion.div
                  key={badge.badgeName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-all duration-200"
                  onClick={() => handleBadgeClick(badge)}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <Badge
                      badge={badge}
                      size="lg"
                      showTooltip={false}
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{badge.displayName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Current Holder */}
                  {badge.currentHolderUsername ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                            Current Holder
                          </div>
                          <div className="text-yellow-700 dark:text-yellow-300">
                            {badge.currentHolderUsername}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-yellow-600 dark:text-yellow-400">
                            {formatValue(badge.currentValue, badge.badgeName)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        No current holder
                      </div>
                    </div>
                  )}
                  
                  {/* User's Progress */}
                  {userStats && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Your progress:</span>
                        <span className="font-semibold">
                          {formatValue(getStatValue(badge.badgeName), badge.badgeName)}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Badge Details & Leaderboard */}
          <div className="lg:col-span-1">
            {selectedBadge ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Badge
                    badge={selectedBadge}
                    size="lg"
                    showTooltip={false}
                  />
                  <div>
                    <h3 className="font-bold text-lg">{selectedBadge.displayName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Leaderboard
                    </p>
                  </div>
                </div>

                {leaderboardLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading leaderboard...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {badgeLeaderboard.length > 0 ? (
                      badgeLeaderboard.map((user, index) => (
                        <motion.div
                          key={user.userId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`
                            flex items-center space-x-3 p-3 rounded-lg
                            ${index === 0 
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' 
                              : 'bg-gray-50 dark:bg-gray-700'
                            }
                          `}
                        >
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                            ${index === 0 
                              ? 'bg-yellow-500 text-white' 
                              : index === 1 
                              ? 'bg-gray-400 text-white'
                              : index === 2
                              ? 'bg-amber-600 text-white'
                              : 'bg-gray-300 text-gray-700'
                            }
                          `}>
                            {index + 1}
                          </div>
                          
                          <img
                            src={getAvatarUrl(user.avatar)}
                            alt={user.username}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => { e.target.src = getFallbackAvatar(user.username); }}
                          />
                          
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{user.username}</div>
                          </div>
                          
                          <div className="text-sm font-bold">
                            {formatValue(user.value, selectedBadge.badgeName)}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No data available
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-center py-8">
                  <FaUsers className="text-4xl text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Badge</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Click on any badge to see its leaderboard and details
                  </p>
                </div>
              </div>
            )}

            {/* User Stats Summary */}
            {userStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mt-6"
              >
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <FaChartLine className="mr-2 text-blue-500" />
                  Your Stats
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Current Badges:</span>
                    <span className="font-semibold">{userStats.currentBadges?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Quizzes:</span>
                    <span className="font-semibold">{userStats.stats?.totalQuizzes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Correct Answers:</span>
                    <span className="font-semibold">{userStats.stats?.totalCorrectAnswers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Average Score:</span>
                    <span className="font-semibold">{userStats.stats?.averageScore?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Battles Won:</span>
                    <span className="font-semibold">{userStats.stats?.battlesWon || 0}</span>
                  </div>
                </div>

                {/* Current Badges */}
                {userStats.currentBadges && userStats.currentBadges.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-sm font-semibold mb-2">Your Badges:</div>
                    <div className="flex flex-wrap gap-2">
                      {userStats.currentBadges.map((badge) => (
                        <Badge
                          key={badge.badgeName}
                          badge={badge}
                          size="md"
                          showTooltip={true}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Badges;