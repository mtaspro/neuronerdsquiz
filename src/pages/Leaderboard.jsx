import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import BattleEventBanner from "../components/BattleEventBanner";
import BattleLeaderboardCard from "../components/BattleLeaderboardCard";
import QuizLeaderboardCard from "../components/QuizLeaderboardCard";
import soundManager from "../utils/soundUtils";
import '../styles/leaderboard.css';



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

        {/* Leaderboard Cards */}
        <div className={activeTab === 'battle' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'}>
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