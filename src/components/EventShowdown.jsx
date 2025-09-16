import React, { useState, useEffect, useRef } from 'react';
import './EventShowdown.css';
import soundManager from '../utils/soundUtils';
// Use Cloudinary URL instead of local file
const backgroundMusicFile = 'https://res.cloudinary.com/dxqtqnfgf/video/upload/v1/audio/neuronerds-showdown.mp3';

const EventShowdown = ({ eventData }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Don't render if no active event
  if (!eventData || !eventData.isActive) {
    return null;
  }

  useEffect(() => {
    if (!eventData?.endTime) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(eventData.endTime).getTime();
      const distance = end - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Event Ended');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [eventData?.endTime]);

  const toggleSound = () => {
    if (isPlaying) {
      soundManager.stopBackgroundMusic();
      setIsPlaying(false);
    } else {
      soundManager.playBackgroundMusic();
      setIsPlaying(true);
    }
  };

  // Load music from Cloudinary with lazy loading
  useEffect(() => {
    if (eventData?.isActive && isPlaying) {
      // Only load when user wants to play
      soundManager.loadBackgroundMusic(backgroundMusicFile, 0.2);
    }
  }, [eventData?.isActive, isPlaying]);

  return (
    <div className="event-showdown">
      <audio ref={audioRef} loop>
        <source src={backgroundMusicFile} type="audio/mpeg" />
      </audio>
      
      <div className="hero-section">
        <h1 className="event-title">🔥 The NeuroNerds Showdown</h1>
        <p className="event-subtitle">🏆 Epic Battle Event. Compete for Glory!</p>
        
        <div className="sound-toggle" onClick={toggleSound}>
          {isPlaying ? '🔇 Mute' : '🎵 Play Music'}
        </div>
      </div>

      <div className="event-card">
        <div className="countdown-section">
          <div className="timer">⏳ Event Ends: {timeLeft || 'Loading...'}</div>
          <div className="status-tag ongoing">
            🔥 Live Event
          </div>
        </div>
        
        <div className="event-description">
          📋 Answer fast, earn high. Speed + Accuracy = Glory.
        </div>
      </div>
    </div>
  );
};

export default EventShowdown;