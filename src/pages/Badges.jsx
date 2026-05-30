import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrophy, FaUsers, FaClock, FaChartLine } from 'react-icons/fa';
import axios from 'axios';
import Badge from '../components/Badge';
import { getAvatarUrl, getFallbackAvatar } from '../utils/avatarUtils';
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';

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
      <PageShell className="flex items-center justify-center">
        <div className="text-slate-200 text-xl">Loading badges...</div>
      </PageShell>
    );
  }

  return (
    <PageShell className="min-h-[calc(100vh-3.5rem)] text-slate-100">
      {/* Header */}
      <div className="aura-glass p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <FaArrowLeft />
              <span>Back to Dashboard</span>
            </Button>
          </div>
          <h1 className="aura-headline text-4xl mb-2">🏆 Badge System</h1>
          <p className="aura-subhead">Competitive achievements and rankings</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* All Badges */}
          <div className="lg:col-span-2">
            <h2 className="aura-headline text-2xl mb-6 flex items-center">
              <FaTrophy className="mr-2 text-yellow-500" />
              Available Badges
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {allBadges.map((badge) => (
                <motion.div
                  key={badge.badgeName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="aura-glass aura-glass-card p-6 cursor-pointer hover:border-cyan-500/50 transition-all duration-200"
                  onClick={() => handleBadgeClick(badge)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <Badge
                      badge={badge}
                      size="lg"
                      showTooltip={false}
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-200">{badge.displayName}</h3>
                      <p className="text-sm text-slate-400">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Current Holder */}
                  {badge.currentHolderUsername ? (
                    <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-yellow-300">
                            Current Holder
                          </div>
                          <div className="text-yellow-200">
                            {badge.currentHolderUsername}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-yellow-400">
                            {formatValue(badge.currentValue, badge.badgeName)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/20 rounded-lg p-3 border border-cyan-500/10">
                      <div className="text-center text-slate-500">
                        No current holder
                      </div>
                    </div>
                  )}
                  
                  {/* User's Progress */}
                  {userStats && (
                    <div className="mt-3 pt-3 border-t border-cyan-500/10">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Your progress:</span>
                        <span className="font-semibold text-slate-200">
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
                className="aura-glass aura-glass-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Badge
                    badge={selectedBadge}
                    size="lg"
                    showTooltip={false}
                  />
                  <div>
                    <h3 className="font-bold text-lg text-slate-200">{selectedBadge.displayName}</h3>
                    <p className="text-sm text-slate-400">
                      Leaderboard
                    </p>
                  </div>
                </div>

                {leaderboardLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
                    <p className="text-sm text-slate-400 mt-2">Loading leaderboard...</p>
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
                            flex items-center gap-3 p-3 rounded-lg
                            ${index === 0 
                              ? 'bg-yellow-500/10 border border-yellow-500/30' 
                              : 'bg-black/20'
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
                              : 'bg-slate-600 text-slate-200'
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
                            <div className="font-semibold text-sm text-slate-200">{user.username}</div>
                          </div>
                          
                          <div className="text-sm font-bold text-slate-200">
                            {formatValue(user.value, selectedBadge.badgeName)}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        No data available
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="aura-glass aura-glass-card p-6">
                <div className="text-center py-8">
                  <FaUsers className="text-4xl text-slate-500 mx-auto mb-4" />
                  <h3 className="aura-headline text-lg mb-2">Select a Badge</h3>
                  <p className="aura-subhead">
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
                className="aura-glass aura-glass-card p-6 mt-6"
              >
                <h3 className="aura-display text-lg mb-4 flex items-center">
                  <FaChartLine className="mr-2 text-blue-500" />
                  Your Stats
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Badges:</span>
                    <span className="font-semibold text-slate-200">{userStats.currentBadges?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Quizzes:</span>
                    <span className="font-semibold text-slate-200">{userStats.stats?.totalQuizzes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Correct Answers:</span>
                    <span className="font-semibold text-slate-200">{userStats.stats?.totalCorrectAnswers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Average Score:</span>
                    <span className="font-semibold text-slate-200">{userStats.stats?.averageScore?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Battles Won:</span>
                    <span className="font-semibold text-slate-200">{userStats.stats?.battlesWon || 0}</span>
                  </div>
                </div>

                {/* Current Badges */}
                {userStats.currentBadges && userStats.currentBadges.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-cyan-500/10">
                    <div className="text-sm font-semibold mb-2 text-slate-200">Your Badges:</div>
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
    </PageShell>
  );
};

export default Badges;