import React from "react";
import { motion } from "framer-motion";

// Dummy data
const players = [
  {
    name: "Alice",
    score: 980,
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Bob",
    score: 920,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Charlie",
    score: 870,
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
  },
  {
    name: "Diana",
    score: 850,
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    name: "Ethan",
    score: 830,
    avatar: "https://randomuser.me/api/portraits/men/23.jpg",
  },
  {
    name: "Fay",
    score: 800,
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
  },
];

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
    gradient: "from-slate-800 via-slate-700 to-slate-900",
    glow: "shadow-slate-600/40",
    border: "border-slate-700",
    badge: rank + 1,
    size: "",
    text: "text-gray-200",
  };
}

export default function Leaderboard() {
  // Sort players by score descending
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-10 text-center drop-shadow-lg">
        Leaderboard
      </h1>
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {sorted.map((player, i) => {
          const style = getCardStyle(i);
          return (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 120 }}
              className={`relative flex flex-col items-center rounded-2xl border-4 ${style.border} bg-gradient-to-br ${style.gradient} ${style.glow} ${style.size} shadow-xl p-6 pt-8 group hover:scale-105 transition-transform duration-300`}
              style={{ minHeight: i < 3 ? 270 : 220 }}
            >
              {/* Rank Badge */}
              <div className={`absolute -top-5 left-1/2 -translate-x-1/2 z-10 text-3xl md:text-4xl font-bold ${i < 3 ? "drop-shadow-lg" : ""}`}>
                {style.badge}
              </div>
              {/* Avatar */}
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 ${style.border} shadow-lg mb-4 ${i < 3 ? "ring-4 ring-white/40 animate-pulse" : ""}`}>
                <img
                  src={player.avatar}
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Name */}
              <div className={`text-xl md:text-2xl font-bold mb-1 ${style.text}`}>{player.name}</div>
              {/* Score */}
              <div className="text-lg md:text-xl font-mono text-white/80 mb-2">{player.score} pts</div>
              {/* Subtle hover effect for non-top3 */}
              {i >= 3 && (
                <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
} 