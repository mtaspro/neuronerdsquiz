// Import your MP3 files
import click from '../assets/click.mp3';
import success from '../assets/success.mp3';
// Add more imports as needed
import battleStart from '../assets/battleStart.mp3';
import badgeUnlock from '../assets/badgeUnlock.mp3';
import questionNext from '../assets/questionNext.mp3';
import quizComplete from '../assets/quizComplete.mp3';
import transition from '../assets/transition.mp3';
// Sound utility for website interactions
class SoundManager {
  constructor() {
    this.sounds = {};
    this.backgroundMusic = null;
    this.enabled = localStorage.getItem('soundEnabled') !== 'false';
    this.musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
  }

  // Load a sound
  loadSound(name, src, volume = 0.5) {
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.preload = 'auto';
      this.sounds[name] = audio;
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`, error);
    }
  }

  // Play a sound
  play(name) {
    if (!this.enabled || !this.sounds[name]) return;
    
    try {
      const audio = this.sounds[name];
      audio.currentTime = 0; // Reset to start
      audio.play().catch(e => console.warn(`Sound play failed: ${name}`, e));
    } catch (error) {
      console.warn(`Error playing sound: ${name}`, error);
    }
  }

  // Toggle sound on/off
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('soundEnabled', this.enabled);
    return this.enabled;
  }

  // Load background music
  loadBackgroundMusic(src, volume = 0.3) {
    try {
      // Stop current music if playing
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
      }
      
      this.backgroundMusic = new Audio(src);
      this.backgroundMusic.volume = volume;
      this.backgroundMusic.loop = true;
      this.backgroundMusic.preload = 'auto';
      
      // Add event listeners for better control
      this.backgroundMusic.addEventListener('canplaythrough', () => {
        console.log('Background music loaded and ready');
      });
      
      this.backgroundMusic.addEventListener('error', (e) => {
        console.warn('Background music error:', e);
      });
      
    } catch (error) {
      console.warn('Failed to load background music', error);
    }
  }

  // Play background music
  playBackgroundMusic() {
    if (!this.musicEnabled || !this.backgroundMusic) {
      console.log('Music disabled or not loaded');
      return;
    }
    
    try {
      console.log('Attempting to play background music');
      const playPromise = this.backgroundMusic.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Background music started successfully');
          })
          .catch(e => {
            console.warn('Background music play failed - user interaction required:', e.message);
            // Store that we want to play music, will start on next user interaction
            this.pendingMusicPlay = true;
          });
      }
    } catch (error) {
      console.warn('Error playing background music', error);
    }
  }

  // Stop background music
  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  // Toggle music on/off
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    localStorage.setItem('musicEnabled', this.musicEnabled);
    
    if (this.musicEnabled) {
      this.playBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
    
    return this.musicEnabled;
  }
  
  // Start music on user interaction (call this on any click/touch)
  startMusicOnInteraction() {
    if (this.pendingMusicPlay && this.musicEnabled && this.backgroundMusic) {
      this.playBackgroundMusic();
      this.pendingMusicPlay = false;
    }
  }

  // Set volume for all sounds
  setVolume(volume) {
    Object.values(this.sounds).forEach(audio => {
      audio.volume = Math.max(0, Math.min(1, volume));
    });
  }
}

// Create global sound manager instance
const soundManager = new SoundManager();

// Load sounds from imported MP3 files
soundManager.loadSound('click', click, 0.3);
soundManager.loadSound('success', success, 0.4);
soundManager.loadSound('transition', transition, 0.2);

// Quiz sounds
soundManager.loadSound('questionNext', questionNext, 0.3);
soundManager.loadSound('quizComplete', quizComplete, 0.6);

// Battle sounds
soundManager.loadSound('battleStart', battleStart, 0.7);

// Achievement sounds
soundManager.loadSound('badgeUnlock', badgeUnlock, 0.8);

export default soundManager;