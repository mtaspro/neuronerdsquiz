import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPalette } from "react-icons/fa";
import ThemeSelector from "../components/ThemeSelector";

// Import all theme videos
import techVideo from "../assets/tech-bg.mp4";
import techVideo1 from "../assets/tech-bg1.mp4";
import techVideo2 from "../assets/tech-bg2.mp4";
import techVideo3 from "../assets/tech-bg3.mp4";
import techVideo4 from "../assets/tech-bg4.mp4";

export default function IntroScreen() {
  const [showVideo, setShowVideo] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [particles, setParticles] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [currentTheme, setCurrentTheme] = useState('tech-bg');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Theme video mapping
  const themeVideos = {
    'tech-bg': techVideo,
    'tech-bg1': techVideo1,
    'tech-bg2': techVideo2,
    'tech-bg3': techVideo3,
    'tech-bg4': techVideo4,
  };

  // Load saved theme from localStorage and listen for changes
  useEffect(() => {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme && themeVideos[savedTheme]) {
      setCurrentTheme(savedTheme);
    }

    // Listen for theme changes from navbar
    const handleThemeChange = () => {
      const newTheme = localStorage.getItem('selectedTheme');
      if (newTheme && themeVideos[newTheme]) {
        setCurrentTheme(newTheme);
      }
    };

    window.addEventListener('storage', handleThemeChange);
    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  // Check auth state on mount & storage changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      setIsAuthenticated(Boolean(token && userData));
    };

    checkAuth();
    // Listen to storage events (multi-tab)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Generate floating particles
  useEffect(() => {
    const particleArray = [];
    for (let i = 0; i < 50; i++) {
      particleArray.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        speed: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    setParticles(particleArray);
  }, []);

  useEffect(() => {
    // Faster video appearance - reduced from 2000ms to 500ms
    const videoTimer = setTimeout(() => setShowVideo(true), 500);
    // Content appears shortly after video
    const contentTimer = setTimeout(() => setShowContent(true), 800);
    
    return () => {
      clearTimeout(videoTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  // Handle theme change
  const handleThemeChange = (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('selectedTheme', themeId);
    
    // Restart video with new theme
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  // Get theme-specific gradient colors
  const getThemeGradient = () => {
    const gradients = {
      'tech-bg': 'from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900',
      'tech-bg1': 'from-green-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-green-900 dark:to-teal-900',
      'tech-bg2': 'from-purple-50 via-pink-50 to-rose-50 dark:from-gray-900 dark:via-purple-900 dark:to-pink-900',
      'tech-bg3': 'from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900',
      'tech-bg4': 'from-slate-50 via-gray-50 to-zinc-50 dark:from-gray-900 dark:via-slate-900 dark:to-zinc-900',
    };
    return gradients[currentTheme] || gradients['tech-bg'];
  };

  const getThemeName = () => {
    const names = {
      'tech-bg': 'LOONY CIRCLES',
      'tech-bg1': 'CUTY KITTENS',
      'tech-bg2': 'LIVING KING',
      'tech-bg3': 'ALIEN ISOLATION',
      'tech-bg4': 'RADIOGRAPHY DNA',
    };
    return names[currentTheme] || 'LOONY CIRCLES';
  };

  return (
    <div className={`relative min-h-screen min-w-full flex flex-col items-center justify-center bg-gradient-to-br ${getThemeGradient()} overflow-hidden transition-all duration-1000`}>


      {/* Theme Selector Modal */}
      <ThemeSelector
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-cyan-400 dark:bg-cyan-300 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: particle.opacity,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, -10, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: particle.speed * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Background Video with theme switching */}
      <motion.div
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: showVideo ? 0.4 : 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        key={currentTheme} // Force re-render when theme changes
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={themeVideos[currentTheme]}
          autoPlay
          loop
          muted
          playsInline
          onError={(e) => {
            console.log(`Video ${themeVideos[currentTheme]} failed to load`);
            // Fallback to default theme
            if (currentTheme !== 'tech-bg') {
              setCurrentTheme('tech-bg');
            }
          }}
        />
      </motion.div>

      {/* Content Container */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Main Title */}
        <motion.h1
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: showContent ? 0 : 50, opacity: showContent ? 1 : 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent"
        >
          NeuroNerds Quiz
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: showContent ? 0 : 30, opacity: showContent ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-xl md:text-2xl text-gray-700 dark:text-gray-200 mb-8 font-medium"
        >
          Challenge Your Mind, Expand Your Knowledge
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: showContent ? 0 : 30, opacity: showContent ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="text-lg text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Embark on an exciting journey through interactive quizzes designed to test your knowledge 
          and push your cognitive boundaries. Join thousands of learners in this engaging educational experience.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: showContent ? 0 : 30, opacity: showContent ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {isAuthenticated ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 text-lg"
            >
              🚀 Go to Dashboard
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 text-lg"
              >
                🔐 Get Started
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-lg"
              >
                ✨ Create Account
              </motion.button>
            </>
          )}
        </motion.div>

        {/* Theme Indicator */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: showContent ? 0 : 30, opacity: showContent ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          className="mt-8"
        >
          <div className="inline-flex items-center space-x-2 bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 dark:border-gray-700/20">
            <FaPalette className="text-sm text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Current theme: {getThemeName()}
            </span>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: showContent ? 0 : 30, opacity: showContent ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-lg p-6 border border-white/30 dark:border-gray-700/30">
            <div className="text-3xl mb-3">🧠</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Smart Learning</h3>
            <p className="text-gray-600 dark:text-gray-300">Adaptive quizzes that challenge your knowledge and help you grow.</p>
          </div>
          <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-lg p-6 border border-white/30 dark:border-gray-700/30">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Track Progress</h3>
            <p className="text-gray-600 dark:text-gray-300">Monitor your performance and compete with others on the leaderboard.</p>
          </div>
          <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-lg p-6 border border-white/30 dark:border-gray-700/30">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Instant Feedback</h3>
            <p className="text-gray-600 dark:text-gray-300">Get immediate results and detailed explanations for every question.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}