import React from 'react';
import BattleLeaderboardCard from './BattleLeaderboardCard';
import QuizLeaderboardCard from './QuizLeaderboardCard';
import '../styles/leaderboard.css';

// Test data for demonstration
const testBattleUsers = [
  {
    username: 'ChampionPlayer',
    avatar: 'avatar1.png',
    score: 2450,
    battlesWon: 45,
    totalBattles: 50,
    winRate: 90,
    streak: 12,
    badges: ['champion', 'streak_master', 'quiz_expert', 'speed_demon', 'perfectionist']
  },
  {
    username: 'BattleMaster',
    avatar: 'avatar2.png',
    score: 2200,
    battlesWon: 38,
    totalBattles: 45,
    winRate: 84,
    streak: 8,
    badges: ['battle_winner', 'consistent', 'quiz_lover']
  },
  {
    username: 'QuizWarrior',
    avatar: 'avatar3.png',
    score: 1980,
    battlesWon: 32,
    totalBattles: 40,
    winRate: 80,
    streak: 5,
    badges: ['warrior', 'dedicated']
  }
];

const testQuizUsers = [
  {
    username: 'StudyMaster',
    avatar: 'avatar4.png',
    score: 95,
    totalQuizzes: 120,
    averageScore: 95.5,
    currentStreak: 15,
    bestScore: 100,
    badges: ['perfectionist', 'study_master', 'consistent', 'speed_reader']
  },
  {
    username: 'QuizExpert',
    avatar: 'avatar5.png',
    score: 88,
    totalQuizzes: 85,
    averageScore: 88.2,
    currentStreak: 8,
    bestScore: 98,
    badges: ['expert', 'dedicated', 'quiz_lover']
  },
  {
    username: 'LearningEnthusiast',
    avatar: 'avatar6.png',
    score: 75,
    totalQuizzes: 45,
    averageScore: 75.8,
    currentStreak: 3,
    bestScore: 92,
    badges: ['enthusiast', 'learner']
  }
];

export default function LeaderboardTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 dark:text-white mb-12">
          🎮 Leaderboard Card Test
        </h1>
        
        {/* Battle Leaderboard Test */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 text-center">
            ⚔️ Battle Leaderboard Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testBattleUsers.map((player, index) => (
              <BattleLeaderboardCard
                key={player.username}
                player={player}
                rank={index + 1}
                index={index}
              />
            ))}
          </div>
        </section>
        
        {/* Quiz Leaderboard Test */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 text-center">
            📚 Quiz Leaderboard Cards (Divisional)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {testQuizUsers.map((player, index) => (
              <QuizLeaderboardCard
                key={player.username}
                player={player}
                index={index}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}