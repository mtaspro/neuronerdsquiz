import React, { useEffect, useRef, useState, useCallback } from "react";

// Minimum cinematic boot duration (ms) so the loader animation, aperture reveal,
// and sound cues are always experienced — never skipped.
const MIN_LOADER_DURATION = 2800;
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView, useScroll, useTransform } from "framer-motion";
import { FaPalette, FaRocket, FaBolt, FaBrain } from "react-icons/fa";
import ThemeSelector from "../components/ThemeSelector";
import EventShowdown from "../components/EventShowdown";
import ParallaxElement from "../components/ParallaxElement";
import FuturisticLoader from "../components/ui/FuturisticLoader";
import Button from "../components/ui/Button";
import soundManager from "../utils/soundUtils";
import CanvasParticleField from "../components/CanvasParticleField";
import { useGyroscopeParallax } from "../hooks/useGyroscopeParallax";

// Cloudinary video URLs
const techVideo = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1758021260/tech-bg_w8qhkh.mp4';
const techVideo1 = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1758021288/tech-bg1_iuxvbj.mp4';
const techVideo2 = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1758021313/tech-bg2_nelghr.mp4';
const techVideo3 = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1758021337/tech-bg3_kuajzf.mp4';
const techVideo4 = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1758021361/tech-bg4_xkwzce.mp4';
const techVideo5 = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1758021392/tech-bg5_xvylzf.mp4';
const techVideo6 = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1758021421/tech-bg6_pnp74u.mp4';

// Static poster fallback — tiny inline SVG gradient (loads instantly, no network).
const VIDEO_POSTER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">` +
      `<defs><radialGradient id="g" cx="50%" cy="42%" r="75%">` +
      `<stop offset="0%" stop-color="#0b2230"/><stop offset="55%" stop-color="#07202f"/>` +
      `<stop offset="100%" stop-color="#0a0a14"/></radialGradient></defs>` +
      `<rect width="100%" height="100%" fill="url(#g)"/>` +
      `<circle cx="50%" cy="42%" r="26%" fill="none" stroke="#00f5ff" stroke-opacity="0.25" stroke-width="2"/>` +
      `<circle cx="50%" cy="42%" r="34%" fill="none" stroke="#a855f7" stroke-opacity="0.18" stroke-width="1.5"/>` +
      `</svg>`
  );

const KINETIC = [0.22, 1, 0.36, 1];

// Terminal / typewriter character reveal for hero subtitles.
function TypewriterText({ text = '', active = false, className = '' }) {
  const chars = text.split('');
  return (
    <p className={className}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          className="terminal-char"
          initial={{ opacity: 0, y: 8 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{
            delay: active ? 0.35 + i * 0.028 : 0,
            duration: 0.2,
            ease: KINETIC,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
      <motion.span
        className="terminal-caret"
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? [1, 0, 1] : 0 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        _
      </motion.span>
    </p>
  );
}

// Lightweight 3D tilt card with cursor/touch-tracking edge spotlight.
// Writes straight to CSS vars (--rx/--ry/--spot-*) — no React re-renders.
function TiltCard({ children, className = '' }) {
  const ref = useRef(null);

  const apply = (clientX, clientY) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
    el.style.setProperty('--spot-x', `${px}px`);
    el.style.setProperty('--spot-y', `${py}px`);
    el.style.setProperty('--rx', `${((py / r.height) - 0.5) * -8}deg`);
    el.style.setProperty('--ry', `${((px / r.width) - 0.5) * 8}deg`);
  };

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    el.classList.add('is-tilting');
    const cx = e.clientX != null ? e.clientX : e.touches?.[0]?.clientX;
    const cy = e.clientY != null ? e.clientY : e.touches?.[0]?.clientY;
    if (cx != null && cy != null) apply(cx, cy);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('is-tilting');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={ref}
      className={`aura-tilt-card relative h-full w-full ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onTouchMove={onMove}
      onTouchEnd={onLeave}
    >
      {children}
      <span className="aura-card-spot" aria-hidden="true" />
    </div>
  );
}

export default function IntroScreen() {
  const [showVideo, setShowVideo] = useState(false);
  const [showContent, setShowContent] = useState(false);
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
  const finishLoading = useCallback(() => {
    setIsLoading(false);
    setShowVideo(true);
    // Wait for the loader exit animation to FULLY complete before revealing hero.
    // Loader exit = 0.3s delay + 0.6s duration ≈ 0.9s. We use 1s for a clean buffer
    // so the hero never appears while the loader is still fading — true cinematic stagger.
    setTimeout(() => {
      setShowContent(true);
    }, 1000);
  }, []);


  // Mobile gyroscope tilt → background parallax (eased CSS vars, no re-renders)
  useGyroscopeParallax(containerRef, 12, 10);

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

  // Power-saver: pause the background video when the tab is hidden or the hero
  // scrolls off-screen — prevents GPU/battery drain on low-end devices.
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || showVideo === false) return undefined;

    let visible = true;
    const onVis = () => {
      if (document.hidden) {
        vid.pause();
      } else if (visible) {
        vid.play().catch(() => {});
      }
    };
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (!visible) vid.pause();
        else if (!document.hidden) vid.play().catch(() => {});
      },
      { threshold: 0.05 }
    );
    io.observe(videoRef.current);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [showVideo]);

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

  useEffect(() => {
    // Fluid rAF-driven progress (replaces the old coarse 90ms tick).
    // eases from 0 -> 100 with a subtle organic jitter at a locked 60fps cadence.
    let rafId = 0;
    let swapTimeout = null;
    const DURATION = 2600; // ms to reach 100% — cinematic pacing
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / DURATION);
      // easeOutCubic build-up + a decaying sinusoidal jitter for life
      const eased = 1 - Math.pow(1 - t, 3);
      const jitter = Math.sin(elapsed / 110) * 1.6 * (1 - t);
      const value = Math.min(100, eased * 100 + jitter);

      setPreloaderProgress((prev) => Math.max(prev, Math.round(value))); // monotonic

      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setPreloaderProgress(100);
        // Enforce the minimum cinematic boot duration so the aperture reveal,
        // HUD rings, and sound cues are always fully experienced — never skipped.
        // Then trigger the warp-speed camera zoom exit.
        const remaining = MIN_LOADER_DURATION - elapsed;
        swapTimeout = setTimeout(finishLoading, Math.max(remaining, 320));
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      if (swapTimeout) clearTimeout(swapTimeout);
    };
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

  // Theme gradient (removed — overlays derive from the animated aura palette)

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
            className="fixed inset-0 z-[10000] flex items-center justify-center"
            style={{ willChange: 'transform, opacity' }}
            initial={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: 7, // camera zoom / warp — content expands past the viewport
              transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
            }}
          >
            <FuturisticLoader
              progress={preloaderProgress}
              title="HSCAura"
              subtitle="SYNCHRONIZING QUANTUM LOADING MATRIX"
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

      {/* Interactive Multiverse — canvas node/vector field, pauses off-screen (gyro-shifted) */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ transform: 'translate3d(calc(var(--gyro-x, 0) * 1px), calc(var(--gyro-y, 0) * 1px), 0)' }}
      >
        <CanvasParticleField className="h-full w-full" />
      </div>

      {/* Background Video with Enhanced Parallax */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ transform: 'translate3d(calc(var(--gyro-x, 0) * -0.6px), calc(var(--gyro-y, 0) * -0.6px), 0)' }}
      >
      {/* Always-on animated aura gradient → guarantees the background is NEVER pitch-black,
          even while the video streams or if it fails to load. */}
      <div className="absolute inset-0 aura-event-horizon" aria-hidden="true" />
      <ParallaxElement speed={0.3} className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <motion.div
          className="w-full h-full parallax-bg"
          style={{ opacity }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: showVideo ? 0.85 : 0, scale: 1 }}
          transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }}
          key={currentTheme}
        >
        {/* Background Video — always mounted; animated aura gradient sits behind it */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={themeVideos[currentTheme]}
          poster={VIDEO_POSTER}
          preload="auto"
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          controls={false}
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
      </div>

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

      {/* Content Container — strictly gated: NOT rendered until the loader fully exits */}
      {showContent && (
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
            <h1
              className="aura-headline aura-glitch-logo text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight"
              data-text="HSCAura"
            >
              <span className="aura-glow-text aura-display">HSCAura</span>
              <span className="aura-glitch-scan" aria-hidden="true" />
            </h1>
          </ParallaxElement>

          <TypewriterText
            text="Unleash your inner genius"
            active={showContent}
            className="mt-5 text-xl sm:text-2xl md:text-3xl font-light text-slate-200 tracking-wide"
          />

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
              <Button size="lg" beam shockwave onClick={() => navigate('/dashboard')} className="w-full sm:w-auto min-w-[200px]">
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
            className="mt-10 inline-flex justify-center"
          >
            <button
              type="button"
              aria-label="Change visual theme"
              onClick={() => setShowThemeSelector(true)}
              className="aura-glass inline-flex items-center justify-center w-12 h-12 rounded-full hover:border-cyan-400/40 transition-colors"
            >
              <FaPalette className="text-cyan-400" />
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
                transition={{ delay: 0.6 + index * 0.14, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
              >
                <TiltCard>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mb-4 group-hover:shadow-aura-cyan transition-shadow">
                    <Icon className="text-xl text-cyan-400" />
                  </div>
                  <h3 className="aura-display text-sm text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      )}
    </div>
  );
}