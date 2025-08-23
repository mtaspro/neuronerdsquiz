import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { FaTh, FaList, FaTrophy, FaMedal, FaAward } from "react-icons/fa";
import BattleEventBanner from "../components/BattleEventBanner";
import BattleLeaderboardCard from "../components/BattleLeaderboardCard";
import QuizLeaderboardCard from "../components/QuizLeaderboardCard";
import soundManager from "../utils/soundUtils";
import '../styles/leaderboard.css';

const TableView = ({ players, activeTab }) => {
  const getRankIcon = (rank) => {
    if (rank === 1) return <FaTrophy className="text-yellow-500" />;
    if (rank === 2) return <FaMedal className="text-gray-400" />;
    if (rank === 3) return <FaAward className="text-amber-600" />;
    return <span className="text-gray-500 font-bold">#{rank}</span>;
  };
  
  const getDivisionInfo = (player) => {
    const avgScore = player.averageScore || 0;
    const totalQuizzes = player.totalQuizzes || 0;
    
    if (avgScore >= 90 && totalQuizzes >= 50) return { name: 'Champion', stage: Math.min(Math.floor(avgScore/10), 10), color: 'text-purple-600' };
    if (avgScore >= 80 && totalQuizzes >= 30) return { name: 'Legendary', stage: 'I', color: 'text-yellow-600' };
    if (avgScore >= 70 && totalQuizzes >= 20) return { name: 'World Class', stage: 'I', color: 'text-green-600' };
    if (avgScore >= 60 && totalQuizzes >= 15) return { name: 'Pro', stage: 'I', color: 'text-blue-600' };
    if (avgScore >= 50 && totalQuizzes >= 10) return { name: 'Semi Pro', stage: 'I', color: 'text-indigo-600' };
    return { name: 'Amateur', stage: 'III', color: 'text-gray-600' };
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Rank</th>
              <th className="px-6 py-4 text-left font-semibold">Player</th>
              <th className="px-6 py-4 text-center font-semibold">Score</th>
              {activeTab === 'general' ? (
                <>
                  <th className="px-6 py-4 text-center font-semibold">Division</th>
                  <th className="px-6 py-4 text-center font-semibold">Quizzes</th>
                  <th className="px-6 py-4 text-center font-semibold">Streak</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4 text-center font-semibold">Battles</th>
                  <th className="px-6 py-4 text-center font-semibold">Win Rate</th>
                  <th className="px-6 py-4 text-center font-semibold">Badges</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <motion.tr
                key={player.username}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  index < 3 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(index + 1)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={player.avatar}
                      alt={player.username}
                      className="w-10 h-10 rounded-full border-2 border-cyan-500"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.username)}&background=random`;
                      }}
                    />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{player.username}</div>
                      {player.badges && player.badges.length > 0 && (
                        <div className="text-xs text-gray-500">{player.badges.length} badges</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="font-bold text-lg text-cyan-600 dark:text-cyan-400">
                    {player.score}
                  </div>
                </td>
                {activeTab === 'general' ? (
                  <>
                    <td className="px-6 py-4 text-center">
                      <div className={`font-semibold ${getDivisionInfo(player).color}`}>
                        {getDivisionInfo(player).name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Stage {getDivisionInfo(player).stage}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-semibold text-gray-700 dark:text-gray-300">
                        {player.totalQuizzes || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-semibold text-orange-600 dark:text-orange-400">
                        {player.currentStreak || 0}
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-center">
                      <div className="font-semibold text-gray-700 dark:text-gray-300">
                        {player.totalBattles || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        {player.winRate ? `${player.winRate}%` : '0%'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center space-x-1">
                        {player.badges && player.badges.slice(0, 3).map((badge, i) => (
                          <span key={i} className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                            {badge.name}
                          </span>
                        ))}
                        {player.badges && player.badges.length > 3 && (
                          <span className="text-xs text-gray-500">+{player.badges.length - 3}</span>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default function Leaderboard() {
  // State management
  const [generalLeaderboard, setGeneralLeaderboard] = useState([]);
  const [battleLeaderboard, setBattleLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [viewMode, setViewMode] = useState('cards');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "";

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        setLoading(true);
        const [generalResponse, battleResponse] = await Promise.all([
          axios.get(`${API_URL}/api/leaderboard/general`),
          axios.get(`${API_URL}/api/leaderboard/battle`)
        ]);
        setGeneralLeaderboard(generalResponse.data);
        setBattleLeaderboard(battleResponse.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch leaderboards:", err);
        setError("Failed to fetch leaderboard data");
        // Fallback to dummy data if API fails
        setGeneralLeaderboard([]);
        setBattleLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboards();
    
    // Auto-refresh every 30 seconds to show updated battle scores
    const interval = setInterval(fetchLeaderboards, 30000);
    return () => clearInterval(interval);
  }, [API_URL]);

  // Get current leaderboard data
  const currentLeaderboard = activeTab === 'general' ? generalLeaderboard : battleLeaderboard;
  const sortedPlayers = [...currentLeaderboard].sort((a, b) => b.score - a.score);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-gray-800 dark:text-white text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 text-xl mb-4">⚠️</div>
          <div className="text-gray-800 dark:text-white text-xl mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-12 px-4 transition-colors duration-200 overflow-x-auto">
      <div className="max-w-4xl mx-auto">
        {/* Event Banner */}
        <BattleEventBanner />
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 dark:text-white mb-4">
            🏆 Leaderboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Top performers in Neuronerds Quiz
          </p>
          
          {/* Tab Buttons */}
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => {
                setActiveTab('general');
                soundManager.play('click');
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'general'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              📚 Divisional Ranking
            </button>
            <button
              onClick={() => {
                setActiveTab('battle');
                soundManager.play('click');
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'battle'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              ⚔️ Global Ranking
            </button>
          </div>
          
          {/* View Toggle */}
          <div className="flex justify-center space-x-2 mb-8">
            <button
              onClick={() => {
                setViewMode('cards');
                soundManager.play('click');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                viewMode === 'cards'
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FaTh className="text-sm" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => {
                setViewMode('table');
                soundManager.play('click');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                viewMode === 'table'
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FaList className="text-sm" />
              <span>Table</span>
            </button>
          </div>
          
          {/* Info Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-8 text-left max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              {activeTab === 'general' ? '🏆 Division System:' : '👑 Global Ranking:'}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              {activeTab === 'general' ? (
                <>
                  <p>• <strong>Amateur → Semi Pro → Pro → World Class → Legendary → Champion</strong></p>
                  <p>• <strong>Each division:</strong> 3 stages (III, II, I)</p>
                  <p>• <strong>Champion:</strong> Unlimited multipliers (2x, 3x, etc.)</p>
                  <p>• <strong>Ranking:</strong> Based on quiz performance and streaks</p>
                </>
              ) : (
                <>
                  <p>• <strong>Global ranking</strong> includes battle + quiz bonus scores</p>
                  <p>• <strong>Top 5 ranks:</strong> Premium cards with unique designs</p>
                  <p>• <strong>Prize winners:</strong> Top 3 battle champions get rewards</p>
                  <p>• <strong>Battle formula:</strong> 2 + speed_bonus + quiz_bonus (max 8 points)</p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Leaderboard Content */}
        {viewMode === 'cards' ? (
          <div className={activeTab === 'battle' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-0' : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-0'}>
            {sortedPlayers.map((player, index) => {
              if (activeTab === 'battle') {
                return (
                  <BattleLeaderboardCard
                    key={player.username}
                    player={player}
                    rank={index + 1}
                    index={index}
                  />
                );
              } else {
                return (
                  <QuizLeaderboardCard
                    key={player.username}
                    player={player}
                    index={index}
                  />
                );
              }
            })}
          </div>
        ) : (
          <TableView players={sortedPlayers} activeTab={activeTab} />
        )}

        {/* Empty State */}
        {sortedPlayers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              No scores yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Be the first to {activeTab === 'general' ? 'take a quiz and earn your division rank' : 'win battles and claim the global throne'}!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}