import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPalette, FaTimes, FaCheck, FaPlay, FaPause } from 'react-icons/fa';

const ThemeSelector = ({ isOpen, onClose, currentTheme, onThemeChange }) => {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [previewPlaying, setPreviewPlaying] = useState({});

  const themes = [
    {
      id: 'tech-bg',
      name: 'LOONY CIRCLES',
      description: 'Circular shapes flying around the screen',
      video: '/src/assets/tech-bg.mp4',
      color: 'from-blue-600 to-purple-600',
      preview: '⭕'
    },
    {
      id: 'tech-bg1',
      name: 'CUTY KITTENS',
      description: 'CUTE KITTENS TOGETHER',
      video: '/src/assets/tech-bg1.mp4',
      color: 'from-green-500 to-teal-600',
      preview: '🐱'
    },
    {
      id: 'tech-bg2',
      name: 'LIVING KING',
      description: 'ANIME WARRIOR',
      video: '/src/assets/tech-bg2.mp4',
      color: 'from-purple-500 to-pink-600',
      preview: '⚔️'
    },
    {
      id: 'tech-bg3',
      name: 'ALIEN ISOLATION',
      description: 'SPACESHIP INTERIOR',
      video: '/src/assets/tech-bg3.mp4',
      color: 'from-orange-500 to-red-600',
      preview: '👽'
    },
    {
      id: 'tech-bg4',
      name: 'RADIOGRAPHY',
      description: 'RADIOGRAPHY DNA',
      video: '/src/assets/tech-bg4.mp4',
      color: 'from-slate-600 to-zinc-600',
      preview: '🔬'
    }
  ];

  useEffect(() => {
    setSelectedTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
  };

  const handleApplyTheme = () => {
    onThemeChange(selectedTheme);
    onClose();
  };

  const togglePreview = (themeId) => {
    setPreviewPlaying(prev => ({
      ...prev,
      [themeId]: !prev[themeId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaPalette className="text-3xl text-purple-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Choose Your Theme
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Select a background theme for your quiz experience
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-2"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {themes.map((theme) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: themes.indexOf(theme) * 0.1 }}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                selectedTheme === theme.id
                  ? 'ring-4 ring-purple-500 shadow-2xl scale-105'
                  : 'hover:scale-102 hover:shadow-xl'
              }`}
              onClick={() => handleThemeSelect(theme.id)}
            >
              {/* Video Preview */}
              <div className="relative aspect-video bg-gray-900">
                <video
                  src={theme.video}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  autoPlay={previewPlaying[theme.id]}
                  onError={(e) => {
                    console.log(`Video ${theme.video} failed to load`);
                    e.target.style.display = 'none';
                  }}
                />
                
                {/* Fallback gradient if video fails */}
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.color} opacity-80 flex items-center justify-center`}>
                  <span className="text-6xl">{theme.preview}</span>
                </div>

                {/* Play/Pause Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePreview(theme.id);
                  }}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                >
                  {previewPlaying[theme.id] ? <FaPause /> : <FaPlay />}
                </button>

                {/* Selection Indicator */}
                {selectedTheme === theme.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 left-2 bg-purple-500 text-white p-2 rounded-full shadow-lg"
                  >
                    <FaCheck />
                  </motion.div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              </div>

              {/* Theme Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-bold text-lg mb-1">{theme.name}</h3>
                <p className="text-sm text-gray-200 opacity-90">{theme.description}</p>
              </div>

              {/* Selection Border */}
              <div className={`absolute inset-0 border-4 rounded-xl transition-all ${
                selectedTheme === theme.id
                  ? 'border-purple-500 shadow-purple-500/50'
                  : 'border-transparent'
              }`} />
            </motion.div>
          ))}
        </div>

        {/* Current Selection Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${
              themes.find(t => t.id === selectedTheme)?.color || 'from-gray-400 to-gray-600'
            }`} />
            <div>
              <span className="font-semibold text-gray-800 dark:text-white">
                Selected: {themes.find(t => t.id === selectedTheme)?.name}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {themes.find(t => t.id === selectedTheme)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApplyTheme}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg"
          >
            Apply Theme
          </motion.button>
        </div>

        {/* Tips */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Tip: Click the play button to preview themes in action
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ThemeSelector;