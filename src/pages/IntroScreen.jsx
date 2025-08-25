import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { FaPalette } from "react-icons/fa";
import ThemeSelector from "../components/ThemeSelector";
import EventShowdown from "../components/EventShowdown";

// Import theme videos
import techVideo from "../assets/tech-bg.mp4";
import techVideo1 from "../assets/tech-bg1.mp4";
import techVideo2 from "../assets/tech-bg2.mp4";
import techVideo3 from "../assets/tech-bg3.mp4";
import techVideo4 from "../assets/tech-bg4.mp4";
import techVideo5 from "../assets/tech-bg5.mp4";
import techVideo6 from "../assets/tech-bg6.mp4";

export default function IntroScreen() {
  const [showVideo, setShowVideo] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [particles, setParticles] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const [currentTheme, setCurrentTheme] = useState('tech-bg');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [eventData, setEventData] = useState(null);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const contentRef = useRef(null);
  const isContentInView = useInView(contentRef, { once: true, margin: "-100px" });

  // Theme video mapping
  const themeVideos = {
    'tech-bg': techVideo,
    'tech-bg1': techVideo1,
    'tech-bg2': techVideo2,
    'tech-bg3': techVideo3,
    'tech-bg4': techVideo4,
    'tech-bg5': techVideo5,
    'tech-bg6': techVideo6,
  };

  // Load theme
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = localStorage.getItem('selectedTheme');
      if (savedTheme && themeVideos[savedTheme]) {
        setCurrentTheme(savedTheme);
        return;
      }
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const response = await fetch(`${apiUrl}/api/theme/current`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.theme && themeVideos[data.theme]) {
            setCurrentTheme(data.theme);
          }
        } catch (error) {
          console.error('Error loading theme:', error);
        }
      }
    };
    loadTheme();
    const handleThemeChange = () => loadTheme();
    window.addEventListener('storage', handleThemeChange);
    window.addEventListener('themeChanged', handleThemeChange);
    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { secureStorage } = await import('../utils/secureStorage.js');
        const token = secureStorage.getToken();
        const userData = await secureStorage.getUserData();
        setIsAuthenticated(Boolean(token && userData));
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
    const handleAuthChange = () => checkAuth();
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('userAuthChange', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('userAuthChange', handleAuthChange);
    };
  }, []);

  // Load event data
  useEffect(() => {
    const loadEventData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/superadmin/showdown-event`);
        const data = await response.json();
        if (data.isActive) {
          setEventData(data);
        }
      } catch (error) {
        console.error('Error loading event data:', error);
      }
    };
    loadEventData();
    const interval = setInterval(loadEventData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Generate particles
  useEffect(() => {
    const particleArray = [];
    for (let i = 0; i < 30; i++) {
      particleArray.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 2,
        speed: Math.random() * 1.5 + 1,
        opacity: Math.random() * 0.4 + 0.3,
      });
    }
    setParticles(particleArray);
  }, []);

  // Handle loading animation
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      setShowVideo(true);
      setTimeout(() => setShowContent(true), 300);
    }, 3000); // 3-second preloader
    return () => clearTimeout(loadingTimer);
  }, []);

  // Custom cursor
  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  // Handle theme change
  const handleThemeChange = async (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('selectedTheme', themeId);
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        await fetch(`${apiUrl}/api/theme/set`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ theme: themeId })
        });
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    }
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  // Theme gradient
  const getThemeGradient = () => {
    const gradients = {
      'tech-bg': 'from-cyan-600 via-blue-600 to-purple-600',
      'tech-bg1': 'from-green-600 via-teal-600 to-cyan-600',
      'tech-bg2': 'from-purple-600 via-pink-600 to-rose-600',
      'tech-bg3': 'from-orange-600 via-red-600 to-pink-600',
      'tech-bg4': 'from-slate-600 via-gray-600 to-zinc-600',
      'tech-bg5': 'from-blue-600 via-cyan-600 to-teal-600',
      'tech-bg6': 'from-amber-600 via-yellow-600 to-orange-600',
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
      'tech-bg5': 'CRYSTAL MATRIX',
      'tech-bg6': 'NEON TUNNEL',
    };
    return names[currentTheme] || 'LOONY CIRCLES';
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gray-900 overflow-hidden">
      {/* Custom Cursor */}
      <motion.div
        className={`fixed w-4 h-4 rounded-full pointer-events-none z-[9999] ${isHovering ? 'bg-purple-500 scale-150' : 'bg-cyan-500'}`}
        style={{ left: mousePosition.x - 8, top: mousePosition.y - 8 }}
        animate={{ scale: isHovering ? [1, 1.5, 1] : 1 }}
        transition={{ duration: 0.3, repeat: Infinity }}
      />

      {/* Loading Animation */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-[1000]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-600"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { duration: 1, staggerChildren: 0.05 },
              }}
              exit={{ opacity: 0, scale: 1.2 }}
            >
              {Array.from("NeuroNerds").map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, x: Math.random() * 50 - 25 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.5, delay: index * 0.05 },
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.div>
            <motion.div
              className="mt-4 flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 1.5, duration: 0.5 } }}
              exit={{ opacity: 0 }}
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-cyan-400 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.2,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                />
              ))}
            </motion.div>
            <button
              onClick={() => setIsLoading(false)}
              className="absolute top-4 right-4 text-cyan-300 text-sm underline hover:text-cyan-100 transition-colors"
            >
              Skip
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="absolute bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, -15, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: particle.speed * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Background Video */}
      <motion.div
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: showVideo ? 0.3 : 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        key={currentTheme}
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
            if (currentTheme !== 'tech-bg') {
              setCurrentTheme('tech-bg');
            }
          }}
        />
      </motion.div>

      {/* Event Showdown */}
      {eventData && <EventShowdown eventData={eventData} />}

      {/* Content Container */}
      <div
        ref={contentRef}
        className="relative z-10 text-center px-6 max-w-5xl mx-auto py-12"
      >
        <motion.h1
          initial={{ y: 60, opacity: 0 }}
          animate={{
            y: isContentInView ? 0 : 60,
            opacity: isContentInView ? 1 : 0,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent tracking-tight"
        >
          NeuroNerds Quiz
        </motion.h1>

        <motion.p
          initial={{ y: 40, opacity: 0 }}
          animate={{
            y: isContentInView ? 0 : 40,
            opacity: isContentInView ? 1 : 0,
          }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-xl md:text-3xl text-gray-200 font-light mt-4"
        >
          Unleash Your Inner Genius
        </motion.p>

        <motion.p
          initial={{ y: 40, opacity: 0 }}
          animate={{
            y: isContentInView ? 0 : 40,
            opacity: isContentInView ? 1 : 0,
          }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="text-lg text-gray-400 mt-6 max-w-3xl mx-auto leading-relaxed"
        >
          Dive into a thrilling universe of interactive quizzes that challenge your mind and spark curiosity. Join a global community of knowledge seekers.
        </motion.p>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{
            y: isContentInView ? 0 : 40,
            opacity: isContentInView ? 1 : 0,
          }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {isAuthenticated ? (
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(0, 255, 255, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300 text-lg overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent to-cyan-300 opacity-0"
                whileHover={{ opacity: 0.5 }}
                transition={{ duration: 0.3 }}
              />
              🚀 Launch Dashboard
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(0, 255, 255, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300 text-lg overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent to-cyan-300 opacity-0"
                  whileHover={{ opacity: 0.5 }}
                  transition={{ duration: 0.3 }}
                />
                🔐 Sign In
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(255, 0, 255, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="relative bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300 text-lg overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent to-purple-300 opacity-0"
                  whileHover={{ opacity: 0.5 }}
                  transition={{ duration: 0.3 }}
                />
                ✨ Join Now
              </motion.button>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{
            y: isContentInView ? 0 : 40,
            opacity: isContentInView ? 1 : 0,
          }}
          transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          className="mt-10"
        >
          <div className="inline-flex items-center space-x-3 bg-gray-800/50 backdrop-blur-md rounded-full px-5 py-2 border border-gray-700/50 hover:border-gray-600 transition-colors">
            <FaPalette className="text-lg text-cyan-400" />
            <span className="text-sm text-gray-300 font-medium">
              Theme: {getThemeName()}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => setShowThemeSelector(true)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Change
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{
            y: isContentInView ? 0 : 40,
            opacity: isContentInView ? 1 : 0,
          }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 px-4"
        >
          {[
            {
              icon: "🧠",
              title: "Smart Quizzes",
              desc: "AI-driven challenges that adapt to your skill level.",
            },
            {
              icon: "🏆",
              title: "Leaderboard Glory",
              desc: "Compete globally and track your progress.",
            },
            {
              icon: "⚡",
              title: "Instant Insights",
              desc: "Real-time feedback with detailed explanations.",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="relative bg-gray-800/30 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300"
              initial={{ y: 50, opacity: 0 }}
              animate={{
                y: isContentInView ? 0 : 50,
                opacity: isContentInView ? 1 : 0,
              }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(0, 255, 255, 0.3)" }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}