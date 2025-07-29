import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import techVideo from "../assets/tech-bg.mp4";

export default function IntroScreen() {
  const [showVideo, setShowVideo] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [particles, setParticles] = useState([]);
  const navigate = useNavigate();
  const videoRef = useRef(null);

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

  return (
    <div className="relative min-h-screen min-w-full flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
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

      {/* Background Video with faster fade-in */}
      <motion.div
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: showVideo ? 0.4 : 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={techVideo}
          autoPlay
          loop
          muted
          playsInline
        />
      </motion.div>

      {/* Animated Grid Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid-pattern"></div>
      </div>

      {/* Main Content with Staggered Animations */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated Title with Multiple Effects */}
        <motion.h1
          className="relative text-white text-3xl sm:text-5xl md:text-7xl font-extrabold text-center select-none mb-4"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        >
          <motion.span
            className="inline-block glitch-text"
            animate={{
              textShadow: [
                "0 0 10px #00fff7, 0 0 20px #00fff7, 0 0 30px #00fff7",
                "0 0 5px #ff00ea, 0 0 10px #ff00ea, 0 0 15px #ff00ea",
                "0 0 10px #00fff7, 0 0 20px #00fff7, 0 0 30px #00fff7",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            NEURONERDS
          </motion.span>
          <br />
          <motion.span
            className="inline-block quiz-text"
          >
            QUIZ
          </motion.span>
        </motion.h1>

        {/* Authentication Buttons */}
        <motion.div
          className="flex gap-6 justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
        >
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
          >
            Register
          </button>
        </motion.div>

        {/* Subtitle with Typewriter Effect */}
        <motion.p
          className="text-cyan-400 text-lg md:text-xl mb-8 text-center font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: "auto" }}
            transition={{ duration: 2, delay: 1.5 }}
            className="inline-block overflow-hidden whitespace-nowrap border-r-2 border-cyan-400"
          >
            Because Neurons deserve some exercise too...
          </motion.span>
        </motion.p>

        {/* Animated Start Button */}
        <motion.button
          className="relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg shadow-2xl text-lg md:text-xl focus:outline-none overflow-hidden group"
          onClick={() => navigate("/quiz")}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 1.8, type: "spring", stiffness: 200 }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 0 30px rgba(6, 182, 212, 0.5)",
          }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span
            className="relative z-10"
            animate={{
              color: ["#ffffff", "#00fff7", "#ff00ea", "#ffffff"],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Start Quiz
          </motion.span>
          
          {/* Button Glow Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          />
        </motion.button>

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-cyan-400 text-2xl opacity-30"
              style={{
                left: `${20 + (i * 10)}%`,
                top: `${30 + (i * 8)}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 360],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              {["⚡", "🧠", "💡", "🔬", "⚙️", "🚀", "💻", "🔥"][i]}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Enhanced Styles */}
      <style>{`
        .grid-pattern {
          background-image: 
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          width: 100%;
          height: 100%;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        .glitch-text {
          position: relative;
          animation: glitchPulse 3s ease-in-out infinite;
        }

        .glitch-text::before,
        .glitch-text::after {
          content: 'NEURONERDS';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .glitch-text::before {
          animation: glitchTop 2s linear infinite;
          color: #00fff7;
          z-index: -1;
        }

        .glitch-text::after {
          animation: glitchBottom 2.5s linear infinite;
          color: #ff00ea;
          z-index: -2;
        }

        @keyframes glitchPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        @keyframes glitchTop {
          0% { transform: translate(0, 0); }
          10% { transform: translate(-2px, -2px); }
          20% { transform: translate(2px, 2px); }
          30% { transform: translate(-1px, 1px); }
          40% { transform: translate(1px, -1px); }
          50% { transform: translate(-2px, 2px); }
          60% { transform: translate(2px, -2px); }
          70% { transform: translate(-1px, -1px); }
          80% { transform: translate(1px, 1px); }
          90% { transform: translate(-2px, -2px); }
          100% { transform: translate(0, 0); }
        }

        @keyframes glitchBottom {
          0% { transform: translate(0, 0); }
          15% { transform: translate(2px, 2px); }
          25% { transform: translate(-2px, -2px); }
          35% { transform: translate(1px, -1px); }
          45% { transform: translate(-1px, 1px); }
          55% { transform: translate(2px, -2px); }
          65% { transform: translate(-2px, 2px); }
          75% { transform: translate(1px, 1px); }
          85% { transform: translate(-1px, -1px); }
          95% { transform: translate(2px, 2px); }
          100% { transform: translate(0, 0); }
        }

        .quiz-text {
          background: linear-gradient(45deg, #00fff7, #ff00ea, #00fff7);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 3s ease infinite;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
