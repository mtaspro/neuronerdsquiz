import React from 'react';
import { motion } from 'framer-motion';
import { getAvatarUrl, getFallbackAvatar } from '../utils/avatarUtils';
import { calculateDivision, getDivisionInfo, getChampionMultiplier } from '../utils/divisionUtils';
import soundManager from '../utils/soundUtils';

export default function QuizLeaderboardCard({ player, index }) {
  // Calculate user's division and stage
  const userStats = {
    totalQuizzes: player.totalQuizzes || 0,
    averageScore: player.averageScore || 0,
    streak: player.currentStreak || 0
  };
  
  const { division, stage } = calculateDivision(userStats);
  const divisionInfo = getDivisionInfo(division, stage);
  const championMultiplier = division === 'CHAMPION' ? getChampionMultiplier(userStats) : 1;
  
  // Card styling based on division
  const getCardStyle = () => {
    const baseStyle = {
      glow: 'shadow-lg',
      border: 'border-2',
      shine: false
    };
    
    switch (division) {
      case 'CHAMPION':
        return {
          ...baseStyle,
          gradient: 'from-red-500 via-pink-400 to-red-600',
          glow: 'shadow-2xl shadow-red-400/50',
          border: 'border-red-300',
          shine: true,
          textColor: 'text-white'
        };
      case 'LEGENDARY':
        return {
          ...baseStyle,
          gradient: 'from-cyan-400 via-blue-300 to-cyan-600',
          glow: 'shadow-xl shadow-cyan-400/40',
          border: 'border-cyan-300',
          shine: true,
          textColor: 'text-white'
        };
      case 'WORLD_CLASS':
        return {
          ...baseStyle,
          gradient: 'from-slate-400 via-slate-200 to-slate-500',
          glow: 'shadow-lg shadow-slate-400/30',
          border: 'border-slate-300',
          textColor: 'text-gray-800'
        };
      case 'PRO':
        return {
          ...baseStyle,
          gradient: 'from-yellow-400 via-yellow-200 to-yellow-600',
          glow: 'shadow-lg shadow-yellow-400/30',
          border: 'border-yellow-300',
          textColor: 'text-gray-800'
        };
      case 'SEMI_PRO':
        return {
          ...baseStyle,
          gradient: 'from-gray-400 via-gray-200 to-gray-500',
          glow: 'shadow-lg shadow-gray-400/30',
          border: 'border-gray-300',
          textColor: 'text-gray-800'
        };
      default: // AMATEUR
        return {
          ...baseStyle,
          gradient: 'from-amber-600 via-amber-400 to-amber-700',
          glow: 'shadow-lg shadow-amber-400/30',
          border: 'border-amber-300',
          textColor: 'text-white'
        };
    }
  };
  
  const cardStyle = getCardStyle();
  
  // Division icons
  const getDivisionIcon = () => {
    const icons = {
      CHAMPION: '👑',
      LEGENDARY: '💎',
      WORLD_CLASS: '⭐',
      PRO: '🏆',
      SEMI_PRO: '🥈',
      AMATEUR: '🥉'
    };
    return icons[division] || '🥉';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -50, rotateY: -15 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 80
      }}
      whileHover={{ 
        scale: 1.03,
        rotateY: 5,
        y: -8
      }}
      onHoverStart={() => {
        soundManager.play(division === 'CHAMPION' || division === 'LEGENDARY' ? 'premiumCard' : 'cardHover');
      }}
      className={`relative bg-gradient-to-br ${cardStyle.gradient} rounded-2xl p-6 ${cardStyle.glow} ${cardStyle.border} overflow-hidden transform-gpu card-hover-glow ${division === 'CHAMPION' ? 'pulse-glow' : ''}`}
    >
      {/* Shine effect for premium divisions */}
      {cardStyle.shine && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 holographic-shine" />
      )}
      
      {/* Division badge */}
      <div className="absolute top-3 right-3 bg-black/30 text-white text-xs font-bold px-2 py-1 rounded-full stage-indicator">
        {divisionInfo.name} {divisionInfo.stage}
        {championMultiplier > 1 && ` (${championMultiplier}x)`}
      </div>
      
      {/* Player header */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative">
          <img
            src={getAvatarUrl(player.avatar)}
            alt={player.username}
            className="w-16 h-16 rounded-full border-3 border-white/50 object-cover ring-2 ring-white/30"
            onError={(e) => { e.target.src = getFallbackAvatar(player.username); }}
          />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg sparkle">
            {getDivisionIcon()}
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${cardStyle.textColor} mb-1`}>
            {player.username}
          </h3>
          <div className={`${cardStyle.textColor === 'text-white' ? 'text-white/80' : 'text-gray-600'} text-sm`}>
            Division Rank #{index + 1}
          </div>
        </div>
      </div>
      
      {/* Main stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${cardStyle.textColor}`}>
            {Math.round(player.averageScore || 0)}%
          </div>
          <div className={`${cardStyle.textColor === 'text-white' ? 'text-white/70' : 'text-gray-600'} text-xs`}>
            Avg Score
          </div>
        </div>
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${cardStyle.textColor}`}>
            {player.totalQuizzes || 0}
          </div>
          <div className={`${cardStyle.textColor === 'text-white' ? 'text-white/70' : 'text-gray-600'} text-xs`}>
            Quizzes
          </div>
        </div>
      </div>
      
      {/* Additional stats */}
      <div className="grid grid-cols-3 gap-2 text-center mb-4">
        <div>
          <div className={`${cardStyle.textColor} font-semibold`}>
            {player.currentStreak || 0}
          </div>
          <div className={`${cardStyle.textColor === 'text-white' ? 'text-white/60' : 'text-gray-500'} text-xs`}>
            Streak
          </div>
        </div>
        <div>
          <div className={`${cardStyle.textColor} font-semibold`}>
            {player.bestScore || 0}
          </div>
          <div className={`${cardStyle.textColor === 'text-white' ? 'text-white/60' : 'text-gray-500'} text-xs`}>
            Best
          </div>
        </div>
        <div>
          <div className={`${cardStyle.textColor} font-semibold`}>
            {player.badges?.length || 0}
          </div>
          <div className={`${cardStyle.textColor === 'text-white' ? 'text-white/60' : 'text-gray-500'} text-xs`}>
            Badges
          </div>
        </div>
      </div>
      
      {/* Progress bar to next division */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className={cardStyle.textColor === 'text-white' ? 'text-white/70' : 'text-gray-600'}>
            Progress
          </span>
          <span className={cardStyle.textColor === 'text-white' ? 'text-white/70' : 'text-gray-600'}>
            {stage === 2 ? 'Max Stage' : `To ${divisionInfo.name} ${divisionInfo.stages[stage + 1] || 'I'}`}
          </span>
        </div>
        <div className="w-full bg-black/20 rounded-full h-2">
          <div 
            className="bg-white/60 h-2 rounded-full progress-animated"
            style={{ '--progress-width': `${Math.min(((userStats.totalQuizzes * userStats.averageScore / 100) % 50) * 2, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Badges showcase */}
      {player.badges && player.badges.length > 0 && (
        <div className="flex justify-center space-x-1">
          {player.badges.slice(0, 4).map((badge, i) => (
            <div key={i} className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs">
              🏆
            </div>
          ))}
          {player.badges.length > 4 && (
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs text-white">
              +{player.badges.length - 4}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}