import React from 'react';
import { motion } from 'framer-motion';
import { getAvatarUrl, getFallbackAvatar } from '../utils/avatarUtils';
import soundManager from '../utils/soundUtils';

// Premium card designs for top 5 ranks
const getPremiumCardStyle = (rank) => {
  const styles = {
    1: {
      gradient: 'from-yellow-400 via-yellow-200 to-yellow-600',
      glow: 'shadow-2xl shadow-yellow-400/50',
      border: 'border-yellow-300',
      crown: '👑',
      shine: true,
      title: 'GLOBAL CHAMPION'
    },
    2: {
      gradient: 'from-gray-300 via-gray-100 to-gray-400',
      glow: 'shadow-2xl shadow-gray-400/50',
      border: 'border-gray-300',
      crown: '🥈',
      shine: true,
      title: 'RUNNER-UP'
    },
    3: {
      gradient: 'from-amber-600 via-amber-400 to-amber-700',
      glow: 'shadow-2xl shadow-amber-500/50',
      border: 'border-amber-400',
      crown: '🥉',
      shine: true,
      title: 'THIRD PLACE'
    },
    4: {
      gradient: 'from-purple-500 via-purple-300 to-purple-600',
      glow: 'shadow-xl shadow-purple-400/40',
      border: 'border-purple-400',
      crown: '💎',
      shine: false,
      title: 'DIAMOND TIER'
    },
    5: {
      gradient: 'from-cyan-500 via-cyan-300 to-cyan-600',
      glow: 'shadow-xl shadow-cyan-400/40',
      border: 'border-cyan-400',
      crown: '⭐',
      shine: false,
      title: 'PLATINUM TIER'
    }
  };
  return styles[rank] || null;
};

// Standard card style for rank 6+
const getStandardCardStyle = () => ({
  gradient: 'from-slate-700 via-slate-600 to-slate-800',
  glow: 'shadow-lg shadow-slate-600/30',
  border: 'border-slate-600',
  crown: null,
  shine: false,
  title: null
});

export default function BattleLeaderboardCard({ player, rank, index }) {
  const isPremium = rank <= 5;
  const style = isPremium ? getPremiumCardStyle(rank) : getStandardCardStyle();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: isPremium ? 1.05 : 1.02,
        y: -5
      }}
      onHoverStart={() => {
        soundManager.play(isPremium ? 'premiumCard' : 'cardHover');
      }}
      className={`relative bg-gradient-to-br ${style.gradient} rounded-2xl p-6 ${style.glow} border-2 ${style.border} overflow-hidden ${isPremium ? 'transform-gpu float-animation' : ''} card-hover-glow`}
    >
      {/* Shine effect for top 3 */}
      {style.shine && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 holographic-shine" />
      )}
      
      {/* Premium title */}
      {style.title && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black/30 text-white text-xs font-bold px-3 py-1 rounded-full">
          {style.title}
        </div>
      )}
      
      {/* Rank badge */}
      <div className="flex items-center justify-between mb-4">
        <div className={`w-16 h-16 rounded-full bg-black/20 flex items-center justify-center text-2xl font-bold text-white border-2 border-white/30 ${isPremium ? 'badge-bounce sparkle' : ''}`}>
          {style.crown || `#${rank}`}
        </div>
        
        {/* Prize indicator for top 3 */}
        {rank <= 3 && (
          <div className="text-right">
            <div className="text-yellow-300 text-sm font-semibold">🏆 PRIZE WINNER</div>
            <div className="text-white/80 text-xs">Battle Champion</div>
          </div>
        )}
      </div>
      
      {/* Player info */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative">
          <img
            src={getAvatarUrl(player.avatar)}
            alt={player.username}
            className={`w-16 h-16 rounded-full border-3 border-white/50 object-cover ${isPremium ? 'ring-4 ring-white/30' : ''}`}
            onError={(e) => { e.target.src = getFallbackAvatar(player.username); }}
          />
          {isPremium && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs">
              ⭐
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">
            {player.username}
          </h3>
          <div className="text-white/80 text-sm">
            Global Rank #{rank}
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{player.score}</div>
          <div className="text-white/70 text-xs">Total Score</div>
        </div>
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{player.battlesWon || 0}</div>
          <div className="text-white/70 text-xs">Battles Won</div>
        </div>
      </div>
      
      {/* Additional stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-white font-semibold">{player.winRate || 0}%</div>
          <div className="text-white/60 text-xs">Win Rate</div>
        </div>
        <div>
          <div className="text-white font-semibold">{player.streak || 0}</div>
          <div className="text-white/60 text-xs">Streak</div>
        </div>
        <div>
          <div className="text-white font-semibold">{player.badges?.length || 0}</div>
          <div className="text-white/60 text-xs">Badges</div>
        </div>
      </div>
      
      {/* Badges showcase */}
      {player.badges && player.badges.length > 0 && (
        <div className="mt-4 flex justify-center space-x-1">
          {player.badges.slice(0, 5).map((badge, i) => (
            <div key={i} className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs">
              🏆
            </div>
          ))}
          {player.badges.length > 5 && (
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs text-white">
              +{player.badges.length - 5}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}