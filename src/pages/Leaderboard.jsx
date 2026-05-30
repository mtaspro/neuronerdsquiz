import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { FaTh, FaList, FaTrophy, FaMedal, FaAward } from "react-icons/fa";
import BattleEventBanner from "../components/BattleEventBanner";
import BattleLeaderboardCard from "../components/BattleLeaderboardCard";
import QuizLeaderboardCard from "../components/QuizLeaderboardCard";
import soundManager from "../utils/soundUtils";
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';

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
    
    const points = (totalQuizzes * avgScore / 100) + ((player.currentStreak || 0) * 2);
    
    if (points >= 25) return { name: 'Champion', stage: 'I', color: 'text-purple-600' };
    if (points >= 20) return { name: 'Legendary', stage: 'I', color: 'text-yellow-600' };
    if (points >= 15) return { name: 'World Class', stage: 'I', color: 'text-green-600' };
    if (points >= 10) return { name: 'Pro', stage: 'I', color: 'text-blue-600' };
    if (points >= 5) return { name: 'Semi Pro', stage: 'I', color: 'text-indigo-600' };
    return { name: 'Amateur', stage: 'III', color: 'text-gray-600' };
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="aura-glass aura-glass-card overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-white">Rank</th>
              <th className="px-6 py-4 text-left font-semibold text-white">Player</th>
              <th className="px-6 py-4 text-center font-semibold text-white">Score</th>
              {activeTab === 'general' ? (
                <>
                  <th className="px-6 py-4 text-center font-semibold text-white">Division</th>
                  <th className="px-6 py-4 text-center font-semibold text-white">Quizzes</th>
                  <th className="px-6 py-4 text-center font-semibold text-white">Streak</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4 text-center font-semibold text-white">Battles</th>
                  <th className="px-6 py-4 text-center font-semibold text-white">Win Rate</th>
                  <th className="px-6 py-4 text-center font-semibold text-white">Badges</th>
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
                className={`border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors ${
                  index === 0 ? 'bg-cyan-500/10' : 
                  index === 1 ? 'bg-purple-500/5' : 
                  index === 2 ? 'bg-violet-500/5' : ''
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
                      <div className="font-semibold text-slate-200">{player.username}</div>
                      {player.badges && player.badges.length > 0 && (
                        <div className="text-xs text-slate-400">{player.badges.length} badges</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="font-bold text-lg text-cyan-400">
                    {player.score}
                  </div>
                </td>
                {activeTab === 'general' ? (
                  <>
                    <td className="px-6 py-4 text-center">
                      <div className={`font-semibold ${getDivisionInfo(player).color}`}>
                        {getDivisionInfo(player).name}
                      </div>
                      <div className="text-xs text-slate-400">
                        Stage {getDivisionInfo(player).stage}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-semibold text-slate-300">
                        {player.totalQuizzes || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-semibold text-orange-400">
                        {player.currentStreak || 0}
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-center">
                      <div className="font-semibold text-slate-300">
                        {player.totalBattles || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-semibold text-green-400">
                        {player.winRate ? `${player.winRate}%` : '0%'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1">
                        {player.badges && player.badges.slice(0, 3).map((badge, i) => (
                          <span key={i} className="text-xs bg-yellow-500/10 text-yellow-300 px-2 py-1 rounded">
                            {badge.name}
                          </span>
                        ))}
                        {player.badges && player.badges.length > 3 && (
                          <span className="text-xs text-slate-400">+{player.badges.length - 3}</span>
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
      <PageShell className="flex items-center justify-center">
        <div className="text-slate-200 text-xl">Loading leaderboard...</div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell className="flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️</div>
          <div className="text-slate-200 text-xl mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="min-h-[calc(100vh-3.5rem)] py-12 px-4 overflow-x-auto text-slate-100">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Event Banner */}
        <BattleEventBanner />
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="aura-headline text-4xl md:text-6xl mb-4">
            🏆 Leaderboard
          </h1>
          <p className="aura-subhead text-lg mb-6">
            Top performers in Neuronerds Quiz
          </p>
          
          {/* Tab Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant={activeTab === 'general' ? 'secondary' : 'ghost'}
              onClick={() => {
                setActiveTab('general');
                soundManager.play('click');
              }}
            >
              📚 Divisional Ranking
            </Button>
            <Button
              variant={activeTab === 'battle' ? 'primary' : 'ghost'}
              onClick={() => {
                setActiveTab('battle');
                soundManager.play('click');
              }}
            >
              ⚔️ Global Ranking
            </Button>
          </div>
          
          {/* View Toggle */}
          <div className="flex justify-center gap-2 mb-8">
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                setViewMode('cards');
                soundManager.play('click');
              }}
            >
              <FaTh className="text-sm mr-2" />
              <span>Cards</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                setViewMode('table');
                soundManager.play('click');
              }}
            >
              <FaList className="text-sm mr-2" />
              <span>Table</span>
            </Button>
          </div>
          
          {/* Info Panel */}
          <div className="aura-glass p-4 mb-8 text-left max-w-2xl mx-auto">
            <h3 className="aura-display font-semibold mb-2">
              {activeTab === 'general' ? '🏆 Division System:' : '👑 Global Ranking:'}
            </h3>
            <div className="text-sm text-slate-300 space-y-1">
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
            <h3 className="aura-headline text-2xl mb-2">
              No scores yet
            </h3>
            <p className="aura-subhead">
              Be the first to {activeTab === 'general' ? 'take a quiz and earn your division rank' : 'win battles and claim the global throne'}!
            </p>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}