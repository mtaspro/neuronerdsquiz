import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView, useScroll, useTransform } from "framer-motion";
import { FaPalette, FaRocket, FaBolt, FaBrain } from "react-icons/fa";
import ThemeSelector from "../components/ThemeSelector";
import EventShowdown from "../components/EventShowdown";
import ParallaxElement from "../components/ParallaxElement";
import FuturisticLoader from "../components/ui/FuturisticLoader";
import Button from "../components/ui/Button";
import soundManager from "../utils/soundUtils";

// Cloudinary video URLs
const techVideo = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1758021260/tech-bg_w8qhkh.mp4';
const techVideo1 = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1758021288/tech-bg1_iuxvbj.mp4';
const techVideo2 = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1758021313/tech-bg2_nelghr.mp4';
const techVideo3 = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1758021337/tech-bg3_kuajzf.mp4';
const techVideo4 = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1758021361/tech-bg4_xkwzce.mp4';
const techVideo5 = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1758021392/tech-bg5_xvylzf.mp4';
const techVideo6 = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1758021421/tech-bg6_pnp74u.mp4';

export default function IntroScreen() {
  const [showVideo, setShowVideo] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [particles, setParticles] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  const [preloaderProgress, setPreloaderProgress] = useState(0);

  const [currentTheme, setCurrentTheme] = useState('tech-bg');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [showAudioPrompt, setShowAudioPrompt] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const contentRef = useRef(null);
  const containerRef = useRef(null);
  const isContentInView = useInView(contentRef, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({ target: containerRef });
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

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
          // Show audio prompt when event is active
          if (!localStorage.getItem('audioPermissionGranted')) {
            setShowAudioPrompt(true);
          }
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

  const finishLoading = useCallback(() => {
    setIsLoading(false);
    setShowVideo(true);
    setTimeout(() => setShowContent(true), 400);
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setPreloaderProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(finishLoading, 400);
          return 100;
        }
        return Math.min(100, prev + 4 + Math.random() * 8);
      });
    }, 90);
    return () => clearInterval(progressInterval);
  }, [finishLoading]);



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

  const handleEnableAudio = () => {
    soundManager.startMusicOnInteraction();
    localStorage.setItem('audioPermissionGranted', 'true');
    setShowAudioPrompt(false);
  };

  return (
    <div ref={containerRef} className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#020208] overflow-hidden">

      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="aura-loader"
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <FuturisticLoader
              progress={preloaderProgress}
              title="NEURONERDS"
              subtitle="Synchronizing quantum learning matrix"
              onSkip={finishLoading}
            />
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

      {/* Background Video with Enhanced Parallax */}
      <ParallaxElement speed={0.3} className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <motion.div
          className="w-full h-full parallax-bg"
          style={{ opacity }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: showVideo ? 0.55 : 0, scale: 1 }}
          transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }}
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
        {/* Video Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020208]/40 via-[#020208]/50 to-[#020208]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#020208_75%)]" />
        </motion.div>
      </ParallaxElement>

      {/* Audio Permission Prompt */}
      <AnimatePresence>
        {showAudioPrompt && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1001] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="aura-glass p-8 max-w-md mx-auto text-center"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="aura-display text-lg text-white mb-4">
                Battle Event Active
              </h3>
              <p className="aura-subhead text-sm mb-6">
                Enable audio for the full battle atmosphere.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleEnableAudio} variant="primary" className="flex-1 w-full">
                  Enable Audio
                </Button>
                <Button onClick={() => setShowAudioPrompt(false)} variant="ghost" className="flex-1 w-full">
                  Skip
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Event Showdown */}
      {eventData && <EventShowdown eventData={eventData} />}

      {/* Content Container */}
      <div
        ref={contentRef}
        className="relative z-10 text-center px-4 sm:px-6 max-w-6xl mx-auto py-16 sm:py-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 24 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="aura-label mb-4">Next-gen learning platform</p>
          <ParallaxElement speed={0.08}>
            <h1 className="aura-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
              NeuroNerds Quiz
            </h1>
          </ParallaxElement>

          <p className="mt-5 text-xl sm:text-2xl md:text-3xl font-light text-slate-200 tracking-wide">
            Unleash your inner genius
          </p>

          <p className="aura-subhead text-base sm:text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
            Real-time battles, adaptive quizzes, and AI-powered insights — built for students who refuse to learn in slow mode.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <span className="aura-chip">Live Battles</span>
            <span className="aura-chip">NeuraX AI</span>
            <span className="aura-chip">Progress Tracking</span>
          </div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center mt-10 px-2"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {isAuthenticated ? (
              <Button size="lg" onClick={() => navigate('/dashboard')} className="w-full sm:w-auto min-w-[200px]">
                <FaRocket className="mr-1" /> Launch Dashboard
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate('/login')} className="w-full sm:w-auto min-w-[180px]">
                  Sign In
                </Button>
                <Button size="lg" variant="magenta" onClick={() => navigate('/register')} className="w-full sm:w-auto min-w-[180px]">
                  Join Now
                </Button>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: 0.8 }}
            className="mt-10 inline-flex"
          >
            <button
              type="button"
              onClick={() => setShowThemeSelector(true)}
              className="aura-glass inline-flex items-center gap-3 px-5 py-2.5 rounded-full hover:border-cyan-400/40 transition-colors"
            >
              <FaPalette className="text-cyan-400" />
              <span className="text-sm text-slate-300">
                Visual: <span className="text-cyan-400 font-medium">{getThemeName()}</span>
              </span>
              <span className="text-xs text-cyan-500/80 uppercase tracking-widest">Change</span>
            </button>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {[
              { Icon: FaBrain, title: 'Smart Quizzes', desc: 'Adaptive challenges tuned to how you think.' },
              { Icon: FaBolt, title: 'Live Battles', desc: 'Compete in real time with friends and rivals.' },
              { Icon: FaRocket, title: 'Instant Insights', desc: 'Feedback and analytics the moment you finish.' },
            ].map(({ Icon, title, desc }, index) => (
              <motion.div
                key={title}
                className="aura-glass aura-glass-card text-left group"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
                transition={{ delay: 0.5 + index * 0.12, duration: 0.6 }}
                whileHover={{ y: -4 }}
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mb-4 group-hover:shadow-aura-cyan transition-shadow">
                  <Icon className="text-xl text-cyan-400" />
                </div>
                <h3 className="aura-display text-sm text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}