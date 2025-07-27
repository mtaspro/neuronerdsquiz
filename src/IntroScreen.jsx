import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// You should place your tech video in src/assets/tech-bg.mp4
// and update the src path below if needed.

export default function IntroScreen() {
  const [showVideo, setShowVideo] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowVideo(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Glitch effect keyframes
  // Add this to your global CSS if you want to reuse it elsewhere
  // Otherwise, it's inlined below

  return (
    <div className="relative min-h-screen min-w-full flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Background Video */}
      <div
        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 pointer-events-none z-0 ${
          showVideo ? "opacity-30" : "opacity-0"
        }`}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={require("./assets/tech-bg.mp4")}
          autoPlay
          loop
          muted
          playsInline
        />
        {/* If you want to use a remote video, replace src with a URL */}
      </div>

      {/* Glitch Text */}
      <h1
        className="relative z-10 text-white text-3xl sm:text-5xl md:text-7xl font-extrabold text-center select-none glitch"
        aria-label="NEURONERDS QUIZ"
      >
        <span aria-hidden="true" className="glitch-layer glitch-top">NEURONERDS QUIZ</span>
        <span aria-hidden="true" className="glitch-layer glitch-bottom">NEURONERDS QUIZ</span>
        NEURONERDS QUIZ
      </h1>

      {/* Start Quiz Button */}
      <button
        className="z-10 mt-10 px-8 py-3 bg-white text-black font-bold rounded shadow-lg hover:bg-gray-200 transition-colors text-lg md:text-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
        onClick={() => navigate("/home")}
      >
        Start Quiz
      </button>

      {/* Glitch effect styles */}
      <style>{`
        .glitch {
          position: relative;
          display: inline-block;
        }
        .glitch-layer {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          opacity: 0.7;
          pointer-events: none;
        }
        .glitch-top {
          color: #fff;
          animation: glitchTop 1s infinite linear alternate-reverse;
          z-index: 2;
          text-shadow: 2px 0 #00fff7, 0 2px #00fff7;
        }
        .glitch-bottom {
          color: #fff;
          animation: glitchBottom 1s infinite linear alternate-reverse;
          z-index: 1;
          text-shadow: -2px 0 #ff00ea, 0 -2px #ff00ea;
        }
        @keyframes glitchTop {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-2px, -2px); }
          40% { transform: translate(-4px, 2px); }
          60% { transform: translate(2px, -1px); }
          80% { transform: translate(1px, 2px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes glitchBottom {
          0% { transform: translate(0, 0); }
          20% { transform: translate(2px, 2px); }
          40% { transform: translate(4px, -2px); }
          60% { transform: translate(-2px, 1px); }
          80% { transform: translate(-1px, -2px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
} 