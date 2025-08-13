import React from 'react';
import { motion } from 'framer-motion';
import { getAvatarUrl, getFallbackAvatar } from '../utils/avatarUtils';
import { calculateDivision, getDivisionInfo, getChampionMultiplier } from '../utils/divisionUtils';
import soundManager from '../utils/soundUtils';
import worldClassCardBg from '../assets/pics/cd lgnd.png';
import legendaryCardBg from '../assets/pics/cd legendary.png';
import proCardBg from '../assets/pics/cd pro.png';
import championCardBg from '../assets/pics/cd champion.png';
import semiProCardBg from '../assets/pics/cd semi pro.png';
import amateurCardBg from '../assets/pics/cd amatuer.png';

// Add custom CSS animations
const cardStyles = `
  @keyframes shine {
    0% { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(200%) skewX(-12deg); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 20px currentColor; }
    50% { box-shadow: 0 0 40px currentColor, 0 0 60px currentColor; }
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('card-animations')) {
  const style = document.createElement('style');
  style.id = 'card-animations';
  style.textContent = cardStyles;
  document.head.appendChild(style);
}

export default function QuizLeaderboardCard({ player, index }) {
  // Add safety checks
  if (!player) return null;
  
  // Calculate user's division and stage
  const userStats = {
    totalQuizzes: player.totalQuizzes || 0,
    averageScore: player.averageScore || 0,
    streak: player.currentStreak || 0
  };
  
  const divisionResult = calculateDivision(userStats);
  const division = divisionResult?.division || 'AMATEUR';
  const stage = divisionResult?.stage || 0;
  const divisionInfo = getDivisionInfo(division, stage);
  const championMultiplier = division === 'CHAMPION' ? getChampionMultiplier(userStats) : 1;
  
  // Card styling based on division
  const getCardStyle = () => {
    const baseStyle = {
      glow: 'shadow-lg',
      border: 'border-2',
      shine: true
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
          textColor: 'text-white'
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
        scale: 1.05,
        rotateY: 8,
        y: -12,
        rotateX: 2
      }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => {
        soundManager.play(division === 'CHAMPION' || division === 'LEGENDARY' ? 'premiumCard' : 'cardHover');
      }}
      className={`relative bg-cover bg-center bg-no-repeat rounded-2xl p-6 ${cardStyle.glow} ${cardStyle.border} overflow-hidden transform-gpu transition-all duration-300 hover:shadow-2xl cursor-pointer`}
      style={division === 'WORLD_CLASS' ? { backgroundImage: `url(${worldClassCardBg})` } : division === 'LEGENDARY' ? { backgroundImage: `url(${legendaryCardBg})` } : division === 'PRO' ? { backgroundImage: `url(${proCardBg})` } : division === 'CHAMPION' ? { backgroundImage: `url(${championCardBg})` } : division === 'SEMI_PRO' ? { backgroundImage: `url(${semiProCardBg})` } : division === 'AMATEUR' ? { backgroundImage: `url(${amateurCardBg})` } : {}}
    >
      {/* Animated effects for all divisions */}
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute w-1 h-1 bg-white/60 rounded-full animate-ping" style={{top: '20%', left: '15%', animationDelay: '0s'}} />
        <div className="absolute w-1 h-1 bg-white/40 rounded-full animate-ping" style={{top: '60%', right: '20%', animationDelay: '1s'}} />
        <div className="absolute w-0.5 h-0.5 bg-white/50 rounded-full animate-ping" style={{top: '80%', left: '25%', animationDelay: '2s'}} />
      </div>
      
      {/* Animated shine sweep */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse opacity-0 hover:opacity-100 transition-opacity duration-500" style={{animation: 'shine 3s infinite'}} />
      
      {/* Division-specific glow effects */}
      {division === 'CHAMPION' && (
        <div className="absolute inset-0 rounded-2xl animate-pulse" style={{boxShadow: '0 0 30px rgba(255, 107, 107, 0.5), inset 0 0 30px rgba(255, 107, 107, 0.1)'}} />
      )}
      {division === 'LEGENDARY' && (
        <div className="absolute inset-0 rounded-2xl animate-pulse" style={{boxShadow: '0 0 25px rgba(34, 211, 238, 0.4), inset 0 0 25px rgba(34, 211, 238, 0.1)'}} />
      )}
      {division === 'WORLD_CLASS' && (
        <div className="absolute inset-0 rounded-2xl animate-pulse" style={{boxShadow: '0 0 20px rgba(148, 163, 184, 0.4), inset 0 0 20px rgba(148, 163, 184, 0.1)'}} />
      )}
      {division === 'PRO' && (
        <div className="absolute inset-0 rounded-2xl animate-pulse" style={{boxShadow: '0 0 20px rgba(251, 191, 36, 0.4), inset 0 0 20px rgba(251, 191, 36, 0.1)'}} />
      )}
      {division === 'SEMI_PRO' && (
        <div className="absolute inset-0 rounded-2xl animate-pulse" style={{boxShadow: '0 0 15px rgba(156, 163, 175, 0.3), inset 0 0 15px rgba(156, 163, 175, 0.1)'}} />
      )}
      {division === 'AMATEUR' && (
        <div className="absolute inset-0 rounded-2xl animate-pulse" style={{boxShadow: '0 0 15px rgba(245, 158, 11, 0.3), inset 0 0 15px rgba(245, 158, 11, 0.1)'}} />
      )}
      
      {/* Overlay for all custom card backgrounds to improve text readability */}
      <div className="absolute inset-0 bg-black/30 rounded-2xl" />
      
      {/* Division badge with pulse animation */}
      <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20 z-10 animate-pulse hover:animate-none transition-all duration-300 hover:scale-110">
        <div className="flex items-center space-x-1">
          <span className="animate-bounce" style={{animationDelay: '0.5s'}}>{getDivisionIcon()}</span>
          <span>{divisionInfo.name} {divisionInfo.stage}</span>
          {championMultiplier > 1 && <span className="text-yellow-300 animate-pulse">({championMultiplier}x)</span>}
        </div>
      </div>
      
      {/* Player header */}
      <div className="relative flex items-start space-x-3 mb-4 mt-8 z-10">
        <div className="relative flex-shrink-0">
          {/* Animated avatar ring */}
          <div className="absolute inset-0 rounded-full animate-spin" style={{animation: 'spin 8s linear infinite', background: `conic-gradient(from 0deg, ${cardStyle.gradient?.includes('red') ? '#ff6b6b' : cardStyle.gradient?.includes('cyan') ? '#22d3ee' : cardStyle.gradient?.includes('slate') ? '#94a3b8' : cardStyle.gradient?.includes('yellow') ? '#fbbf24' : cardStyle.gradient?.includes('gray') ? '#9ca3af' : '#f59e0b'}, transparent, ${cardStyle.gradient?.includes('red') ? '#ff6b6b' : cardStyle.gradient?.includes('cyan') ? '#22d3ee' : cardStyle.gradient?.includes('slate') ? '#94a3b8' : cardStyle.gradient?.includes('yellow') ? '#fbbf24' : cardStyle.gradient?.includes('gray') ? '#9ca3af' : '#f59e0b'})`}} />
          <img
            src={getAvatarUrl(player.avatar)}
            alt={player.username}
            className="relative w-14 h-14 rounded-full border-3 border-white/70 object-cover shadow-lg hover:scale-110 transition-transform duration-300"
            onError={(e) => { e.target.src = getFallbackAvatar(player.username); }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white mb-1 truncate drop-shadow-lg">
            {player.username}
          </h3>
          <div className="text-white/90 text-sm font-medium drop-shadow-md">
            Division Rank #{index + 1}
          </div>
        </div>
      </div>
      
      {/* Main stats with hover animations */}
      <div className="relative grid grid-cols-2 gap-3 mb-4 z-10">
        <div className="bg-black/40 rounded-lg p-3 text-center backdrop-blur-sm border border-white/20 hover:bg-black/50 hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="text-xl font-bold text-white drop-shadow-lg animate-pulse">
            {Math.round(player.averageScore || 0)}%
          </div>
          <div className="text-white/80 text-xs font-medium drop-shadow-md">
            Avg Score
          </div>
        </div>
        <div className="bg-black/40 rounded-lg p-3 text-center backdrop-blur-sm border border-white/20 hover:bg-black/50 hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="text-xl font-bold text-white drop-shadow-lg animate-pulse" style={{animationDelay: '0.5s'}}>
            {player.totalQuizzes || 0}
          </div>
          <div className="text-white/80 text-xs font-medium drop-shadow-md">
            Quizzes
          </div>
        </div>
      </div>
      
      {/* Additional stats */}
      <div className="relative grid grid-cols-3 gap-3 text-center mb-4 z-10">
        <div>
          <div className="text-white font-bold text-lg drop-shadow-lg">
            {player.currentStreak || 0}
          </div>
          <div className="text-white/70 text-xs font-medium drop-shadow-md">
            Streak
          </div>
        </div>
        <div>
          <div className="text-white font-bold text-lg drop-shadow-lg">
            {player.bestScore || 0}
          </div>
          <div className="text-white/70 text-xs font-medium drop-shadow-md">
            Best
          </div>
        </div>
        <div>
          <div className="text-white font-bold text-lg drop-shadow-lg">
            {player.badges?.length || 0}
          </div>
          <div className="text-white/70 text-xs font-medium drop-shadow-md">
            Badges
          </div>
        </div>
      </div>
      
      {/* Progress bar to next division */}
      <div className="relative mb-4 z-10">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-white/80 font-medium drop-shadow-md">
            Progress
          </span>
          <span className="text-white/80 font-medium drop-shadow-md">
            {stage === 2 ? 'Max Stage' : `To ${divisionInfo.name} ${divisionInfo.stages && divisionInfo.stages[stage + 1] ? divisionInfo.stages[stage + 1] : 'I'}`}
          </span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-2 backdrop-blur-sm border border-white/20">
          <div 
            className="bg-white/80 h-2 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${Math.min(((userStats.totalQuizzes * userStats.averageScore / 100) % 50) * 2, 100)}%` }}
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