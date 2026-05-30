import { motion } from 'framer-motion';

export default function FuturisticLoader({
  progress = 0,
  title = 'NEURONERDS',
  subtitle = 'Initializing neural interface',
  onSkip,
}) {
  const pct = Math.min(100, Math.floor(progress));

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden bg-[#020208]"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.6, delay: 0.3 },
      }}
    >
      <div className="absolute inset-0 aura-loader-grid opacity-60" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,245,255,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Scan line */}
      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"
        style={{ animation: 'aura-scan 2.5s ease-in-out infinite' }}
      />

      {/* Orbit rings */}
      <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-10">
        <div
          className="absolute inset-0 rounded-full border border-cyan-500/30"
          style={{ animation: 'aura-orbit 8s linear infinite' }}
        />
        <div
          className="absolute inset-3 rounded-full border border-violet-500/40 border-t-cyan-400"
          style={{ animation: 'aura-orbit 5s linear infinite reverse' }}
        />
        <div
          className="absolute inset-6 rounded-full border border-pink-500/20 border-b-violet-400"
          style={{ animation: 'aura-orbit 3s linear infinite' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="aura-display text-2xl sm:text-3xl font-bold text-cyan-400 tabular-nums">
            {pct}%
          </span>
        </div>
      </div>

      {/* Title glitch-style */}
      <motion.h1
        className="aura-display text-xl sm:text-2xl md:text-3xl font-bold tracking-[0.35em] text-white mb-2"
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
            style={{
              color: i % 3 === 0 ? '#00f5ff' : i % 3 === 1 ? '#a855f7' : '#f0f4ff',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.h1>

      <p className="aura-label mb-8 text-cyan-500/80">{subtitle}</p>

      {/* Progress track */}
      <div className="w-56 sm:w-72 relative">
        <div className="h-[2px] bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500"
            style={{ boxShadow: '0 0 20px rgba(0,245,255,0.6)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-500 tracking-widest">
          <span>SYS</span>
          <span className="text-cyan-500/70">{pct < 100 ? 'LOADING' : 'READY'}</span>
          <span>NN</span>
        </div>
      </div>

      {onSkip && (
        <motion.button
          type="button"
          onClick={onSkip}
          className="absolute bottom-8 right-8 text-xs font-medium tracking-widest uppercase text-slate-500 hover:text-cyan-400 transition-colors"
          whileHover={{ scale: 1.05 }}
        >
          Skip →
        </motion.button>
      )}
    </motion.div>
  );
}
