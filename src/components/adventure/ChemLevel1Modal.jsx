import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlay, FaRadiation, FaStopwatch, FaBullseye } from 'react-icons/fa';
import UvPassportCanvas from './UvPassportCanvas';

/**
 * ChemLevel1Modal
 * ---------------
 * Webtoon-style story + UV chemistry challenge shell for HSC Aura Adventure
 * Mode (Chemistry · Qualitative Analysis · Level 1 — Passport Verification).
 *
 * Ships with a local MOCK_PARAMS config so it can be mounted anywhere for an
 * instant preview:  <ChemLevel1Modal />  (open = true by default).
 */

// ── Local mock test state — tweak freely to preview different scenarios ─────
const MOCK_PARAMS = { wavelength: 365, intensity: 80 };
const REWARDS = { auraPoints: 100, inGameTokens: 50 };

const buildStory = () => [
  {
    speaker: 'ডিটেকটিভ চিফ',
    portrait: '🕵️‍♂️',
    text: 'জরুরি বার্তা, এজেন্ট! বর্ডার ইমিগ্রেশনে কিছু ভুয়া পাসপোর্ট ধরা পড়েছে।',
  },
  {
    speaker: 'ডিটেকটিভ চিফ',
    portrait: '🕵️‍♂️',
    text: 'আসল পাসপোর্টে ফ্লুরোসেন্ট রঞ্জক দেওয়া গোপন সিকিউরিটি সিল থাকে, যা নির্দিষ্ট আল্ট্রাভায়োলেট (UV) রশ্মিতেই কেবল জ্বলে ওঠে।',
  },
  {
    speaker: 'ডিটেকটিভ চিফ',
    portrait: '🕵️‍♂️',
    text: 'UV-A রশ্মির সঠিক তরঙ্গদৈর্ঘ্য (nm) সেট করুন এবং পাসপোর্ট স্ক্যান করে জাল শনাক্ত করুন!',
  },
];

/** Bengali retry hints based on the settings used during the failed scan. */
function buildHint(result, params) {
  if (!result || result.success) return '';
  const { wl, it } = params;
  if (wl < 315) {
    return '⚠️ UV-B/UV-C রশ্মি বিপজ্জনক এবং ফ্লুরোসেন্ট রঞ্জক সক্রিয় করতে পারে না — UV-A জোন (৩১৫–৪০০ nm) ব্যবহার করুন।';
  }
  if (wl > 400) {
    return 'দৃশ্যমান আলো রঞ্জককে জ্বালাতে পারে না — UV-A জোনে (৩১৫–৪০০ nm) ফিরে যান।';
  }
  if (it <= 60) {
    return 'গ্লো খুব দুর্বল ছিল — UV ল্যাম্পের ক্ষমতা ৬০%-এর বেশি করুন।';
  }
  return `প্রায় হয়ে গেছে, এজেন্ট! ${Math.abs(wl - 365)} nm হয়ে গেছে — ৩৬৫ nm এর আরও কাছে যান।`;
}

const zoneFor = (nm) => {
  if (nm < 280) return 'UV-C';
  if (nm < 315) return 'UV-B';
  if (nm <= 400) return 'UV-A';
  return 'দৃশ্যমান আলো';
};

/** Typewriter reveal for dialogue text. */
function useTypewriter(text, speed = 22) {
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

export default function ChemLevel1Modal({
  open = true,
  onClose = () => {},
  onLevelComplete = () => {},
}) {
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyDone, setStoryDone] = useState(false);
  const [wavelength, setWavelength] = useState(MOCK_PARAMS.wavelength);
  const [intensity, setIntensity] = useState(MOCK_PARAMS.intensity);
  const [runKey, setRunKey] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [scanParams, setScanParams] = useState(MOCK_PARAMS); // snapshot for hints

  const lines = useMemo(() => buildStory(), []);
  const line = lines[Math.min(storyIndex, lines.length - 1)];
  const tw = useTypewriter(storyDone ? '' : line.text);

  const stars = !result || !result.success
    ? 0
    : result.accuracy >= 90
      ? 3
      : result.accuracy >= 75
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

  const scan = () => {
    setScanParams({ wavelength, intensity });
    setResult(null);
    setRunKey((k) => k + 1); // remount canvas → fresh scan
    setScanning(true);
  };

  const handleVerify = useCallback(
    (r) => {
      setResult(r);
      setScanning(false);
      if (r.success) onLevelComplete(r); // hook for backend aura/inGameTokens updates
    },
    [onLevelComplete]
  );

  const hint = useMemo(() => buildHint(result, scanParams), [result, scanParams]);

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
            className="relative z-10 flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-violet-400/25 bg-gradient-to-b from-[#0b1020] via-[#0d1226] to-[#080d18] shadow-aura-violet"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <div>
                <p className="font-display text-[10px] uppercase tracking-[0.3em] text-aura-violet">
                  Chemistry · Qualitative Analysis
                </p>
                <h2 className="font-display text-lg font-bold text-white sm:text-xl">
                  Level 1 — পাসপোর্ট যাচাই মিশন
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close mission"
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
                    className="flex cursor-pointer select-none items-start gap-3 rounded-2xl border border-violet-400/25 bg-gradient-to-r from-violet-500/10 to-transparent p-4"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-600 text-3xl shadow-lg">
                      <motion.span
                        animate={{ y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                      >
                        {line.portrait}
                      </motion.span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-xs font-bold uppercase tracking-widest text-violet-300">
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
                          ? 'ট্যাপ করে স্কিপ করুন ▸'
                          : storyIndex < lines.length - 1
                            ? 'চালিয়ে যেতে ট্যাপ করুন ▸'
                            : 'মিশন শুরুতে ট্যাপ করুন ▸'}
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
                    <span className="text-lg">🕵️‍♂️</span>
                    <span className="truncate">ডিটেকটিভ চিফ: “মিশন শুরু করো, এজেন্ট! সীমানা তোমার উপর নির্ভরশীল।”</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── UV inspection deck ── */}
              <div className="mt-4">
                <UvPassportCanvas
                  key={runKey}
                  wavelength={wavelength}
                  intensity={intensity}
                  isScanning={scanning}
                  onVerify={handleVerify}
                />
              </div>

              {/* ── Chemistry controls ── */}
              <div className="mt-4 space-y-3">
                {/* Wavelength */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm text-white/70">
                      <FaRadiation className="text-aura-violet" /> তরঙ্গদৈর্ঘ্য (λ)
                    </span>
                    <input
                      type="number"
                      min="200"
                      max="700"
                      value={wavelength}
                      disabled={scanning}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (!Number.isNaN(n)) setWavelength(Math.max(200, Math.min(700, n)));
                      }}
                      className="w-20 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-center font-display text-sm font-bold text-aura-cyan outline-none focus:border-violet-400/60"
                    />
                    <span className="text-xs text-white/50">nm</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="700"
                    step="1"
                    value={wavelength}
                    disabled={scanning}
                    onChange={(e) => setWavelength(Number(e.target.value))}
                    className="mt-3 w-full accent-violet-400"
                  />
                  {/* Spectrum zone strip */}
                  <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full">
                    <div className="h-full bg-[#7c3aed]" style={{ width: '16%' }} />
                    <div className="h-full bg-[#a855f7]" style={{ width: '7%' }} />
                    <div className="h-full bg-[#22d3ee]" style={{ width: '17%' }} />
                    <div className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 via-yellow-500 to-rose-500" style={{ width: '60%' }} />
                  </div>
                  <div className="mt-1 flex text-[9px] uppercase tracking-wider text-white/40">
                    <span style={{ width: '16%' }}>UV-C &lt;280</span>
                    <span style={{ width: '7%' }}>UV-B</span>
                    <span style={{ width: '17%' }} className="text-cyan-300/80">UV-A 315-400</span>
                    <span style={{ width: '60%' }} className="text-right">দৃশ্যমান &gt;400 nm</span>
                  </div>
                  <p className="mt-2 text-[11px] text-white/50">
                    বর্তমান জোন: <span className="font-bold text-aura-cyan">{zoneFor(wavelength)}</span>
                    {wavelength >= 355 && wavelength <= 375 && (
                      <span className="ml-2 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        ★ লক্ষ্য জোন (~365 nm)
                      </span>
                    )}
                  </p>
                </div>

                {/* Lamp power + action */}
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm text-white/70">
                        <FaStopwatch className="text-aura-cyan" /> UV ল্যাম্প ক্ষমতা
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={intensity}
                        disabled={scanning}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isNaN(n)) setIntensity(Math.max(0, Math.min(100, n)));
                        }}
                        className="w-16 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-center font-display text-sm font-bold text-aura-cyan outline-none focus:border-violet-400/60"
                      />
                      <span className="text-xs text-white/50">%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={intensity}
                      disabled={scanning}
                      onChange={(e) => setIntensity(Number(e.target.value))}
                      className="mt-3 w-full accent-cyan-400"
                    />
                  </div>

                  <button
                    onClick={scan}
                    disabled={scanning}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-aura-cyan to-aura-violet px-6 py-4 font-display text-sm font-bold uppercase tracking-widest text-[#04121c] transition enabled:hover:brightness-110 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaPlay /> {scanning ? 'স্ক্যান হচ্ছে…' : 'পাসপোর্ট স্ক্যান করুন'}
                  </button>
                </div>
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
                            <p className="mt-1 font-display text-sm font-bold text-emerald-300">
                              ✅ পাসপোর্ট আসল! নিরাপত্তা সিল জ্বলে উঠেছে
                            </p>
                            <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/80">
                              <span className="flex items-center gap-1">
                                <FaBullseye className="text-emerald-300" /> নির্ভুলতা: {result.accuracy}%
                              </span>
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-violet-400/40 bg-violet-400/15 px-3 py-1 text-xs font-bold text-violet-300">
                              +{REWARDS.auraPoints} অরা পয়েন্ট
                            </span>
                            <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">
                              +{REWARDS.inGameTokens} ইন-গেম টোকেন
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={onClose}
                          className="mt-3 w-full rounded-xl border border-emerald-400/40 bg-emerald-400/15 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-400/25"
                        >
                          মিশন সম্পন্ন করুন ▸
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-sm font-bold uppercase tracking-widest text-rose-300">
                          ❌ যাচাই ব্যর্থ!
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          নির্ভুলতা: {result.accuracy}% — সিকিউরিটি সিল জ্বলে ওঠেনি।
                        </p>
                        {hint && (
                          <p className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5 text-xs leading-relaxed text-amber-200">
                            💡 {hint}
                          </p>
                        )}
                        <button
                          onClick={scan}
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


