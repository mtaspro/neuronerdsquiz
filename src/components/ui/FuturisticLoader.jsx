import { useEffect } from 'react';
import { motion } from 'framer-motion';
import soundManager from '../../utils/soundUtils';

const KINETIC = [0.22, 1, 0.36, 1];

export default function FuturisticLoader({
  progress = 0,
  title = 'HSCAura',
  subtitle = 'SYNCHRONIZING QUANTUM LOADING MATRIX',
  onSkip,
}) {
  const pct = Math.min(100, Math.floor(progress));

  // Subtle Web Audio synth hum — starts only after a user gesture (autoplay-safe),
  // fades out on unmount so we never leak an oscillator.
  useEffect(() => {
    let audioCtx = null;
    let osc = null;
    let gain = null;
    const startHum = () => {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!audioCtx) {
          audioCtx = new AC();
          osc = audioCtx.createOscillator();
          gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 55;
          osc.connect(gain).connect(audioCtx.destination);
          gain.gain.value = 0;
          osc.start();
          gain.gain.setTargetAtTime(0.012, audioCtx.currentTime, 0.6);
        } else if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
      } catch {
        /* audio unavailable — ignore */
      }
    };
    const onGesture = () => startHum();
    document.addEventListener('pointerdown', onGesture, { once: true });
    document.addEventListener('touchstart', onGesture, { once: true });
    return () => {
      document.removeEventListener('pointerdown', onGesture);
      document.removeEventListener('touchstart', onGesture);
      try {
        if (gain && audioCtx) gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
        if (osc && audioCtx) osc.stop(audioCtx.currentTime + 0.6);
        if (audioCtx) audioCtx.close().catch(() => {});
      } catch { /* noop */ }
    };
  }, []);

  const handleSkip = () => {
    try {
      if (navigator.vibrate) navigator.vibrate([30, 60, 130]);
    } catch { /* noop */ }
    soundManager.play('transition');
    onSkip?.();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[10000] overflow-hidden bg-[#020208]"
      style={{ willChange: 'transform, opacity' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, delay: 0.3 } }}
    >
      {/* Persistent background layers */}
      <div className="absolute inset-0 aura-loader-grid opacity-60" />
      <div className="absolute inset-0 aura-warp-streak" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,245,255,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Horizontal scanline glow */}
      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"
        style={{ animation: 'aura-scan 2.5s ease-in-out infinite', willChange: 'transform' }}
      />

      {/* Cinematic iris / aperture lens-open reveal */}
      <motion.div
        className="relative z-10 flex h-full w-full flex-col items-center justify-center"
        style={{ willChange: 'clip-path' }}
        initial={{ clipPath: 'circle(3% at 50% 50%)' }}
        animate={{ clipPath: 'circle(150% at 50% 50%)' }}
        transition={{ duration: 1.3, ease: KINETIC }}
      >
        {/* Rotating lens aperture blades */}
        <div className="aura-aperture" />
        {/* Iris lens ring */}
        <div className="aura-iris-ring" />
        {/* HUD concentric tick ring */}
        <div className="aura-hud-ring" />

        {/* Orbit rings + center % */}
        <div className="relative z-10 mb-10 h-40 w-40 sm:h-48 sm:w-48" style={{ willChange: 'transform' }}>
          <div
            className="absolute inset-0 rounded-full border border-cyan-500/30"
            style={{ animation: 'aura-orbit 8s linear infinite', willChange: 'transform' }}
          />
          <div
            className="absolute inset-3 rounded-full border border-violet-500/40 border-t-cyan-400"
            style={{ animation: 'aura-orbit 5s linear infinite reverse', willChange: 'transform' }}
          />
          <div
            className="absolute inset-6 rounded-full border border-pink-500/20 border-b-violet-400"
            style={{ animation: 'aura-orbit 3s linear infinite', willChange: 'transform' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="aura-display text-2xl sm:text-3xl font-bold text-cyan-400 halo-text tabular-nums">
              {pct}%
            </span>
          </div>
        </div>
{/* Title glitch-style */}
        <motion.h1
          className="aura-display mb-2 text-xl font-bold tracking-[0.35em] text-white sm:text-2xl md:text-3xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {title.split('').map((char, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              style={{ color: i % 3 === 0 ? '#00f5ff' : i % 3 === 1 ? '#a855f7' : '#f0f4ff' }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.h1>

        <p className="aura-label mb-8 px-6 text-center text-cyan-500/80 tracking-[0.25em]">{subtitle}</p>

        {/* Progress track (GPU-friendly scaleX fill) */}
        <div className="relative w-56 sm:w-72">
          <div className="h-[2px] overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500"
              style={{ transformOrigin: 'left', boxShadow: '0 0 20px rgba(0,245,255,0.6)', willChange: 'transform' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: pct / 100 }}
              transition={{ duration: 0.25 }}
            />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] tracking-widest text-slate-500">
            <span>SYS</span>
            <span className="text-cyan-500/70">{pct < 100 ? 'LOADING' : 'READY'}</span>
            <span>NN</span>
          </div>
        </div>

        {onSkip && (
          <motion.button
            type="button"
            onClick={handleSkip}
            className="absolute bottom-8 right-8 text-xs font-medium uppercase tracking-widest text-slate-500 transition-colors hover:text-cyan-400"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Skip →
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}