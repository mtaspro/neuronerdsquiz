import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlay, FaCompass, FaStopwatch, FaBullseye } from 'react-icons/fa';
import VectorRiverCanvas from './VectorRiverCanvas';

/**
 * AdventureLevelModal
 * -------------------
 * Webtoon-style story + physics challenge shell for HSC Aura Adventure Mode.
 * Renders the tap-to-continue dialogue, the VectorRiverCanvas simulation and
 * the angle/launch/reward controls.
 *
 * Ships with a local MOCK_LEVEL config so it can be mounted anywhere for an
 * instant preview:  <AdventureLevelModal />  (open = true by default).
 */

// ── Local mock test state — tweak freely to preview different scenarios ─────
const MOCK_LEVEL = { u: 3, v: 4, d: 60, targetX: 15, targetZoneMeters: 6 };
const REWARDS = { auraPoints: 100, inGameTokens: 50 };

const buildStory = (level) => [
  {
    speaker: 'প্রাচীন মাঝি',
    portrait: '🛶',
    text:
      'আমাদের বাঁচান, হে পথিক! স্রোতের টানে আমাদের সব নৌকা ডুবে যাচ্ছে। নদীর ওপারে নিরাপদে পৌঁছাতে হলে আমাদের কত কোণে (α) নৌকা চালাতে হবে?',
  },
  {
    speaker: 'প্রাচীন মাঝি',
    portrait: '🛶',
    text: `নদীর প্রবল স্রোত সবকিছুকে ${level.u} m/s বেগে ভাটির দিকে টেনে নিয়ে যাচ্ছে, আর আমাদের নৌকার ইঞ্জিনের বেগ ${level.v} m/s। ওপারে নিরাপদে নামার স্থানটি ${level.targetX} মিটার ভাটিতে। নিখুঁত লক্ষ্য স্থির করুন!`,
  },
  {
    speaker: 'আপনি',
    portrait: '🧑‍🔬',
    text: 'Vx = u + v·cos(α) … Vy = v·sin(α)। এবার স্থির হোন — পদার্থবিজ্ঞানের সূত্রই আজ আপনাদের গ্রামকে রক্ষা করবে!',
  },
];

/** Numerically estimate the α that lands the boat exactly on the target. */
function estimateIdealAlpha(u, v, d, targetX) {
  let best = null;
  for (let a = 1; a <= 179; a += 0.25) {
    const rad = (a * Math.PI) / 180;
    const vy = v * Math.sin(rad);
    if (vy <= 0) continue;
    const x = ((u + v * Math.cos(rad)) * d) / vy;
    const err = Math.abs(x - targetX);
    if (!best || err < best.err) best = { a, err };
  }
  return best && best.err < 3 ? Math.round(best.a) : null;
}

function buildHint(result, level) {
  if (!result || result.success) return '';
  if (result.landingX == null) {
    return 'নৌকা অপর পাড়ে পৌঁছাতেই পারেনি! নিশ্চিত করুন v·sin(α) > 0 — কোণ ১° থেকে ১৭৯° এর মধ্যে রাখুন যাতে নৌকা নদী পার হতে পারে।';
  }
  const ideal = estimateIdealAlpha(level.u, level.v, level.d, level.targetX);
  if (ideal != null) {
    return `পদার্থবিজ্ঞান বলছে α ≈ ${ideal}° কোণে নৌকা চালালে একদম সঠিক স্থানে পৌঁছানো যাবে। আরেকবার চেষ্টা করুন!`;
  }
  return result.landingX > level.targetX
    ? 'আপনি স্রোতের টানে অনেক দূর ভাটিতে ভেসে গেছেন — নৌকার মুখ আরেকটু উজানের দিকে ঘুরিয়ে দিন (α এর মান ৯০° এর বেশি করুন)।'
    : 'আপনি লক্ষ্যের অনেক উজানে পৌঁছে গেছেন — নৌকার মুখ আরেকটু স্রোতের অনুকূলে আনুন (α এর মান ৯০° এর দিকে কমান)।';
}

/** Typewriter reveal for dialogue text. */
function useTypewriter(text, speed = 18) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    if (!text) return undefined;
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { shown: text.slice(0, count), done: count >= text.length, finish: () => setCount(text.length) };
}

export default function AdventureLevelModal({
  open = true,
  onClose = () => {},
  onLevelComplete = () => {},
  level = MOCK_LEVEL,
}) {
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyDone, setStoryDone] = useState(false);
  const [angle, setAngle] = useState(90);
  const [runKey, setRunKey] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState(null);

  const lines = useMemo(() => buildStory(level), [level]);
  const line = lines[Math.min(storyIndex, lines.length - 1)];
  const tw = useTypewriter(storyDone ? '' : line.text);

  const stars = !result || !result.success
    ? 0
    : result.deviation <= level.targetZoneMeters * 0.33
      ? 3
      : result.deviation <= level.targetZoneMeters * 0.66
        ? 2
        : 1;

  const handleTap = () => {
    if (storyDone) return;
    if (!tw.done) {
      tw.finish();
      return;
    }
    if (storyIndex < lines.length - 1) setStoryIndex((i) => i + 1);
    else setStoryDone(true);
  };

  const launch = () => {
    setResult(null);
    setRunKey((k) => k + 1); // remount canvas → fresh simulation
    setSimulating(true);
  };

  const handleComplete = useCallback(
    (r) => {
      setResult(r);
      setSimulating(false);
      if (r.success) onLevelComplete(r); // hook for backend aura/inGameTokens updates
    },
    [onLevelComplete]
  );

  const hint = useMemo(() => buildHint(result, level), [result, level]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal panel */}
          <motion.div
            className="relative z-10 flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-cyan-400/25 bg-gradient-to-b from-[#0b1020] via-[#0a1526] to-[#071018] shadow-aura-violet"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <div>
                <p className="font-display text-[10px] uppercase tracking-[0.3em] text-aura-cyan">
                  অধ্যায় ২ · ভেক্টর
                </p>
                <h2 className="font-display text-lg font-bold text-white sm:text-xl">
                  লেভেল ১ — প্রাচীনদের নদী
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close adventure"
                className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-4 sm:px-6">
              {/* ── Webtoon story panel (tap to continue) ── */}
              <AnimatePresence mode="wait" initial={false}>
                {!storyDone ? (
                  <motion.div
                    key={`story-${storyIndex}`}
                    layout
                    onClick={handleTap}
                    className="flex cursor-pointer select-none items-start gap-3 rounded-2xl border border-amber-400/25 bg-gradient-to-r from-amber-400/10 to-transparent p-4"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-3xl shadow-lg">
                      <motion.span
                        animate={{ rotate: [0, -6, 6, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                      >
                        {line.portrait}
                      </motion.span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-xs font-bold uppercase tracking-widest text-amber-300">
                        {line.speaker}
                      </p>
                      <p className="mt-1 min-h-[3.5rem] text-sm leading-relaxed text-white/90">
                        {tw.shown}
                        {!tw.done && (
                          <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-cyan-300 align-middle" />
                        )}
                      </p>
                      <p className="mt-2 text-[10px] uppercase tracking-widest text-white/40">
                        {!tw.done
                          ? 'এড়িয়ে যেতে ট্যাপ করুন ▸'
                          : storyIndex < lines.length - 1
                            ? 'পরের ডায়ালগে যেতে ট্যাপ করুন ▸'
                            : 'মিশন শুরু করতে ট্যাপ করুন ▸'}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="story-done"
                    layout
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="text-lg">🛶</span>
                    <span className="truncate">প্রাচীন মাঝি: “নৌকা ছাড়ুন, পথিক! পুরো গ্রাম আপনার দিকে তাকিয়ে আছে!”</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── River simulation ── */}
              <div className="mt-4">
                <VectorRiverCanvas
                  key={runKey}
                  u={level.u}
                  v={level.v}
                  d={level.d}
                  targetX={level.targetX}
                  targetZoneMeters={level.targetZoneMeters}
                  angleAlpha={angle}
                  isSimulating={simulating}
                  onComplete={handleComplete}
                />
              </div>

              {/* ── Physics controls ── */}
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm text-white/70">
                      <FaCompass className="text-aura-cyan" /> নৌকা চালনার কোণ α
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={angle}
                      disabled={simulating}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (!Number.isNaN(n)) setAngle(Math.max(0, Math.min(180, n)));
                      }}
                      className="w-16 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-center font-display text-sm font-bold text-aura-cyan outline-none focus:border-cyan-400/60"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    step="1"
                    value={angle}
                    disabled={simulating}
                    onChange={(e) => setAngle(Number(e.target.value))}
                    className="mt-3 w-full accent-cyan-400"
                  />
                  <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-white/40">
                    <span>0° স্রোতের অনুকূলে</span>
                    <span>90° নদীর সোজাসুজি</span>
                    <span>180° স্রোতের প্রতিকূলে</span>
                  </div>
                </div>

                <button
                  onClick={launch}
                  disabled={simulating}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-aura-cyan to-aura-violet px-6 py-4 font-display text-sm font-bold uppercase tracking-widest text-[#04121c] transition enabled:hover:brightness-110 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaPlay /> {simulating ? 'নৌকা চলছে…' : result && !result.success ? 'আবার চেষ্টা করুন' : 'নৌকা চালু করুন'}
                </button>
              </div>

              {/* ── Results card ── */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 240 }}
                    className={`mt-4 rounded-2xl border p-4 ${
                      result.success
                        ? 'border-emerald-400/40 bg-emerald-400/10'
                        : 'border-rose-400/40 bg-rose-400/10'
                    }`}
                  >
                    {result.success ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-2xl tracking-[0.2em]">
                              {'⭐'.repeat(stars)}
                              <span className="opacity-25">{'⭐'.repeat(3 - stars)}</span>
                            </div>
                            <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/80">
                              <span className="flex items-center gap-1">
                                <FaStopwatch className="text-aura-cyan" /> {result.calculatedTime} সেকেন্ড
                              </span>
                              <span className="flex items-center gap-1">
                                <FaBullseye className="text-aura-cyan" /> {result.deviation} মিটার বিচ্যুতি
                              </span>
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-violet-400/40 bg-violet-400/15 px-3 py-1 text-xs font-bold text-violet-300">
                              +{REWARDS.auraPoints} অরা পয়েন্ট
                            </span>
                            <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">
                              +{REWARDS.inGameTokens} গেম টোকেন
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={onClose}
                          className="mt-3 w-full rounded-xl border border-emerald-400/40 bg-emerald-400/15 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-400/25"
                        >
                          পরবর্তী যাত্রা ▸
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-sm font-bold uppercase tracking-widest text-rose-300">
                          {result.deviation == null ? 'স্রোতের টানে ভেসে গেছে!' : 'নৌকা ডুবে গেছে!'}
                        </p>
                        <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
                          <span className="flex items-center gap-1">
                            <FaStopwatch className="text-rose-300" /> {result.calculatedTime} সেকেন্ড ভেসে ছিল
                          </span>
                          <span className="flex items-center gap-1">
                            <FaBullseye className="text-rose-300" /> বিচ্যুতি:{' '}
                            {result.deviation == null ? '—' : `${result.deviation} মিটার`}
                          </span>
                        </p>
                        {hint && (
                          <p className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5 text-xs leading-relaxed text-amber-200">
                            💡 {hint}
                          </p>
                        )}
                        <button
                          onClick={launch}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/40 bg-rose-400/15 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-rose-300 transition hover:bg-rose-400/25"
                        >
                          আবার চেষ্টা করুন
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
