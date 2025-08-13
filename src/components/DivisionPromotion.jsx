import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDivisionInfo } from '../utils/divisionUtils';
import soundManager from '../utils/soundUtils';

export default function DivisionPromotion({ 
  oldDivision, 
  newDivision, 
  onContinue, 
  isVisible 
}) {
  const [showContinue, setShowContinue] = useState(false);
  
  const newDivisionInfo = getDivisionInfo(newDivision.division, newDivision.stage);
  const oldDivisionInfo = getDivisionInfo(oldDivision.division, oldDivision.stage);

  useEffect(() => {
    if (isVisible) {
      soundManager.play('levelUp');
      // Show continue button after animation
      const timer = setTimeout(() => setShowContinue(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getDivisionIcon = (division) => {
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    >
      <div className="relative max-w-md mx-4">
        {/* Background glow */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`absolute inset-0 bg-gradient-to-r ${newDivisionInfo.gradient} rounded-3xl blur-xl opacity-50`}
        />
        
        {/* Main card */}
        <motion.div
          initial={{ scale: 0, rotateY: -180 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`relative bg-gradient-to-br ${newDivisionInfo.gradient} rounded-3xl p-8 text-center overflow-hidden`}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
          
          {/* Content */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="relative z-10"
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              🎉 PROMOTION! 🎉
            </h1>
            
            <div className="flex items-center justify-center space-x-4 mb-6">
              {/* Old division */}
              <div className="text-center">
                <div className="text-4xl mb-2">{getDivisionIcon(oldDivision.division)}</div>
                <div className="text-white/80 text-sm">
                  {oldDivisionInfo.name} {oldDivisionInfo.stage}
                </div>
              </div>
              
              {/* Arrow */}
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-3xl text-white"
              >
                ➡️
              </motion.div>
              
              {/* New division */}
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="text-4xl mb-2"
                >
                  {getDivisionIcon(newDivision.division)}
                </motion.div>
                <div className="text-white font-bold">
                  {newDivisionInfo.name} {newDivisionInfo.stage}
                </div>
              </div>
            </div>
            
            <p className="text-white/90 text-lg mb-6">
              You've been promoted to a higher division!
            </p>
            
            {/* Continue button */}
            {showContinue && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onContinue}
                className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-8 rounded-full border-2 border-white/30 transition-all duration-300"
              >
                Continue to Results ✨
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}