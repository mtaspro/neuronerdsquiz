import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { getAvatarUrl, getFallbackAvatar } from "../utils/avatarUtils";
import BattleEventBanner from "../components/BattleEventBanner";

// Utility for rank badge and card styles
const rankStyles = [
  {
    badge: "🥇",
    gradient: "from-yellow-400 via-yellow-200 to-yellow-500",
    glow: "shadow-yellow-400/60",
    border: "border-yellow-300",
  },
  {
    badge: "🥈",
    gradient: "from-gray-400 via-gray-200 to-gray-500",
    glow: "shadow-gray-300/60",
    border: "border-gray-300",
  },
  {
    badge: "🥉",
    gradient: "from-amber-700 via-amber-400 to-amber-600",
    glow: "shadow-amber-400/60",
    border: "border-amber-400",
  },
];

function getCardStyle(rank) {
  if (rank < 3) {
    return {
      gradient: rankStyles[rank].gradient,
      glow: rankStyles[rank].glow,
      border: rankStyles[rank].border,
      badge: rankStyles[rank].badge,
      size: "scale-105 md:scale-110",
      text: "text-white",
    };
  }
  return {
    gradient: "from-slate-800 via-slate-700 to-slate-900 dark:from-gray-700 dark:via-gray-600 dark:to-gray-800",
    glow: "shadow-slate-600/40 dark:shadow-gray-600/40",
    border: "border-slate-700 dark:border-gray-600",
    badge: rank + 1,
    size: "",
    text: "text-gray-200 dark:text-gray-100",
  };
}

export default function Leaderboard() {
  // State management
  const [generalLeaderboard, setGeneralLeaderboard] = useState([]);
  const [battleLeaderboard, setBattleLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
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
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'general'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              📚 General Quiz
            </button>
            <button
              onClick={() => setActiveTab('battle')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'battle'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              ⚔️ Battle Mode
            </button>
          </div>
          
          {/* Scoring Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-8 text-left max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">📊 Scoring System:</h3>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              {activeTab === 'general' ? (
                <>
                  <p>• <strong>Correct Answer:</strong> 10 points</p>
                  <p>• <strong>Time Bonus:</strong> Up to 5 extra points for quick answers</p>
                  <p>• <strong>Streak Bonus:</strong> +2 points for consecutive correct answers</p>
                </>
              ) : (
                <>
                  <p>• <strong>Correct Answer:</strong> 2 points base</p>
                  <p>• <strong>Speed Bonus:</strong> Up to 1 extra point (very fast answers)</p>
                  <p>• <strong>Balanced Bonus:</strong> 1% of general quiz score (max 5 points)</p>
                  <p>• <strong>Formula:</strong> 2 + speed_bonus + balanced_bonus</p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Leaderboard Cards */}
        <div className="space-y-6">
          {sortedPlayers.map((player, index) => {
            const style = getCardStyle(index);
            return (
              <motion.div
                key={player.username}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 ${style.size} transition-all duration-300 hover:shadow-xl max-w-full overflow-x-auto`}
              >
                <div className="flex flex-col sm:flex-row items-center sm:justify-between space-y-4 sm:space-y-0">
                  {/* Rank Badge */}
                  <div className="flex items-center space-x-4"> 
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${style.gradient} flex items-center justify-center text-2xl font-bold ${style.text} shadow-lg ${style.glow} border ${style.border}`}>
                      {style.badge}
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex items-center space-x-4">
                      <img
                        src={getAvatarUrl(player.avatar)}
                        alt={player.username}
                        className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600 object-cover"
                        onError={(e) => { e.target.src = getFallbackAvatar(player.username); }}
                      />
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                          {player.username}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Rank #{index + 1}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                      {player.score}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      points
                    </div>
                  </div>
                </div>

                {/* Special styling for top 3 */}
                {index < 3 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {index + 1}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

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
              Be the first to {activeTab === 'general' ? 'take a quiz' : 'join a battle'} and appear on the leaderboard!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}