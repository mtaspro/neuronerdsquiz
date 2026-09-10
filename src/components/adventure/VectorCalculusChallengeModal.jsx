import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlay, FaRedo, FaAtom, FaRadiation, FaBolt } from 'react-icons/fa';

/**
 * VectorCalculusChallengeModal
 * -----------------------------
 * Scene 3 — "Core Reactor Stabilization" (HSC Physics · Vector Calculus).
 * Stabilize a plasma field given by
 *   F(x, y) = (a·x + b·y) i + (c·x + d·y) j
 * by tuning a, b, c, d (−5…5) until:
 *   ∇·F = a + d ≈ 0   (Solenoidal)   AND
 *   (∇×F)_z = c − b ≈ 0 (Irrotational)
 *
 * Ships with mock defaults for instant preview: <VectorCalculusChallengeModal />.
 */

// ── Physics constants ───────────────────────────────────────────────────────
const TOL = 0.1;   // acceptable |div| and |curl|
const RUN_S = 3.0; // real seconds of the test-run animation

const evaluate = (a, b, c, d) => {
  const div = a + d;
  const curl = c - b;
  const solenoidal = Math.abs(div) <= TOL;
  const irrotational = Math.abs(curl) <= TOL;
  const stability = Math.max(
    0,
    Math.min(
      100,
      100 - Math.abs(div) * 34 - Math.abs(curl) * 34
    )
  );
  const success = solenoidal && irrotational;
  const divLabel = div > TOL ? 'প্রসারিত' : div < -TOL ? 'সংকুচিত' : 'সলিনয়ডাল';
  const curlLabel = Math.abs(curl) > TOL ? 'ঘূর্ণনশীল' : 'অঘূর্ণনশীল';
  return { div, curl, solenoidal, irrotational, success, stability, divLabel, curlLabel, a, b, c, d };
};

// ── Local mock test state — tweak freely to preview ─────────────────────────
const MOCK = { a: 0, b: 1, c: 2, d: 0 }; // div=0 (✓) but curl=c−b=1 → tune b to 2 (or c to 1) to stabilize

const buildStory = () => [
  {
    speaker: 'এআই কোয়ান্টাম কোর (NeuraCore)',
    portrait: '🤖',
    text: 'সতর্কতা! মূল প্লাজমা ফিল্ডে চরম বিশৃঙ্খলা তৈরি হয়েছে! প্লাজমা প্রবাহ প্রসারিত হয়ে বিস্ফোরিত হতে পারে, অথবা ঘূর্ণনের সৃষ্টি হয়ে রিয়্যাক্টর কোরের দেয়াল ধ্বংস করে দিতে পারে!',
  },
  {
    speaker: 'আপনি',
    portrait: '🧑‍🔬',
    text: 'কোরকে শান্ত করতে হলে ফিল্ডের ডাইভারজেন্স শূন্য হতে হবে (∇ · F = 0 - সলিনয়ডাল অবস্থা), যাতে কোনো নতুন প্লাজমা তৈরি বা ধ্বংস না হয়।',
  },
  {
    speaker: 'এআই কোয়ান্টাম কোর (NeuraCore)',
    portrait: '🤖',
    text: 'আর ঘূর্ণন প্রতিরোধে? প্লাজমা ফিল্ডের কার্ল (∇ × F) নিয়ন্ত্রণ করতে হবে! টিউনিং মানগুলো শূন্যে এনে ক্ষেত্রটিকে অঘূর্ণনশীল (Irrotational) রূপ দিন!',
  },
];

/** Bengali retry hint. */
const buildHint = (r) => {
  if (!r || r.success) return '';
  const parts = [];
  if (!r.solenoidal) {
    parts.push(
      `ডাইভারজেন্স ∇·F = a + d = ${r.a} + ${r.d} = ${r.div.toFixed(2)} → a এবং d পরস্পর নেতিবাচক করো (যেমন a = x, d = −x)`
    );
  }
  if (!r.irrotational) {
    parts.push(
      `কার্ল (∇×F) = c − b = ${r.c} − (${r.b}) = ${r.curl.toFixed(2)} → b ও c সমান করো (b = c)`
    );
  }
  return parts.join(' · ') + '.';
};

/** Typewriter reveal for dialogue text. */
function useTypewriter(text, speed = 20) {
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

export default function VectorCalculusChallengeModal({
  open = true,
  onClose = () => {},
  onLevelComplete = () => {},
}) {
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyDone, setStoryDone] = useState(false);
  const [a, setA] = useState(MOCK.a);
  const [b, setB] = useState(MOCK.b);
  const [c, setC] = useState(MOCK.c);
  const [d, setD] = useState(MOCK.d);
  const [runKey, setRunKey] = useState(0);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const lines = useMemo(() => buildStory(), []);
  const line = lines[Math.min(storyIndex, lines.length - 1)];
  const tw = useTypewriter(storyDone ? '' : line.text);

  const live = useMemo(() => evaluate(a, b, c, d), [a, b, c, d]);

  const handleTap = () => {
    if (storyDone) return;
    if (!tw.done) {
      tw.finish();
      return;
    }
    if (storyIndex < lines.length - 1) setStoryIndex((i) => i + 1);
    else setStoryDone(true);
  };

  const stabilize = () => {
    setResult(null);
    setRunKey((k) => k + 1); // remount canvas → fresh test run
    setTesting(true);
  };

  const handleComplete = useCallback(
    (r) => {
      setResult(r);
      setTesting(false);
      if (r.success) onLevelComplete(r); // hook for backend rewards
    },
    [onLevelComplete]
  );

  const hint = useMemo(() => buildHint(result), [result]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative z-10 flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-violet-400/25 bg-gradient-to-b from-[#0a0f20] via-[#0b1328] to-[#070c18] shadow-aura-violet"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <div>
                <p className="font-display text-[10px] uppercase tracking-[0.3em] text-aura-violet">
                  Physics · Vector Calculus
                </p>
                <h2 className="font-display text-lg font-bold text-white sm:text-xl">
                  Scene 3 — Core Reactor Stabilization
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close challenge"
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
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-3xl shadow-lg">
                      <motion.span
                        animate={{ rotate: [0, 8, -8, 0], y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
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
                            : 'কন্ট্রোল রুমে প্রবেশ করুন ▸'}
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
                    <span className="text-lg">🤖</span>
                    <span className="truncate">NeuraCore: “কোর অস্থির — টিউনিং মান সেট করো, দ্রুত!”</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Reactor core simulation ── */}
              <div className="mt-4">
                <CoreCanvas key={runKey} a={a} b={b} c={c} d={d} isRunning={testing} onComplete={handleComplete} />
              </div>

              {/* ── Live HUD ── */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className={`rounded-xl border p-3 text-center ${live.solenoidal ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-amber-400/40 bg-white/5'}`}>
                  <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-white/50">
                    <FaAtom /> ডাইভারজেন্স ∇·F
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-aura-cyan">{live.div.toFixed(2)}</p>
                  <p className={`mt-0.5 text-[10px] font-bold ${live.solenoidal ? 'text-emerald-300' : live.div > TOL ? 'text-rose-300' : 'text-sky-300'}`}>
                    {live.divLabel}
                  </p>
                </div>
                <div className={`rounded-xl border p-3 text-center ${live.irrotational ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-amber-400/40 bg-white/5'}`}>
                  <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-white/50">
                    <FaRadiation /> কার্ল (∇×F)_z
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-fuchsia-300">{live.curl.toFixed(2)}</p>
                  <p className={`mt-0.5 text-[10px] font-bold ${live.irrotational ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {live.curlLabel}
                  </p>
                </div>
                <div className={`rounded-xl border p-3 text-center ${live.success ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-white/10 bg-white/5'}`}>
                  <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-white/50">
                    <FaBolt /> স্থিতিশীলতা সূচক
                  </p>
                  <p className={`mt-1 font-display text-lg font-bold ${live.stability >= 95 ? 'text-emerald-300' : live.stability > 60 ? 'text-amber-300' : 'text-rose-300'}`}>
                    {Math.round(live.stability)}%
                  </p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full bg-gradient-to-r ${
                      live.stability >= 95 ? 'from-emerald-400 to-emerald-300' : live.stability > 60 ? 'from-amber-500 to-yellow-400' : 'from-rose-500 to-rose-400'
                    }`} style={{ width: `${live.stability}%` }} />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-white/45">
                F(x, y) = (a·x + b·y) i + (c·x + d·y) j · সহনশীলতা: ±{TOL}
              </p>

              {/* ── Parameter controls ── */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'a', set: setA, val: a, sign: 'a + d' },
                  { label: 'b', set: setB, val: b, sign: '- b' },
                  { label: 'c', set: setC, val: c, sign: 'c - b' },
                  { label: 'd', set: setD, val: d, sign: 'a + d' },
                ].map((p2) => (
                  <div key={p2.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold text-fuchsia-300">
                        {p2.label} <span className="text-[10px] text-white/40">({p2.label === 'b' || p2.label === 'c' ? 'Tuning' : ''})</span>
                      </span>
                      <input
                        type="number"
                        min="-5"
                        max="5"
                        step="0.5"
                        value={p2.val}
                        disabled={testing}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isNaN(n)) p2.set(Math.max(-5, Math.min(5, n)));
                        }}
                        className="w-16 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-center font-display text-sm font-bold text-aura-cyan outline-none focus:border-fuchsia-400/60"
                      />
                      <span className="text-xs text-white/50">({p2.sign})</span>
                    </div>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.05"
                      value={p2.val}
                      disabled={testing}
                      onChange={(e) => p2.set(Number(e.target.value))}
                      className="mt-3 w-full accent-fuchsia-400"
                    />
                  </div>
                ))}
              </div>

              {/* Formula reference banner */}
              <div className="mt-2 rounded-xl border border-cyan-400/20 bg-black/30 px-3 py-2 text-center font-display text-[11px] text-white/60">
                সূত্র: <span className="text-cyan-300">∇ · F = a + d</span> · <span className="text-fuchsia-300">(∇ × F)_z = c − b</span>
              </div>

              {/* ── Action ── */}
              <button
                onClick={stabilize}
                disabled={testing}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-aura-cyan to-aura-violet px-6 py-4 font-display text-sm font-bold uppercase tracking-widest text-[#04121c] transition enabled:hover:brightness-110 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaPlay /> {testing ? 'স্থিতিশীলকরণ চলছে…' : 'Stabilize Core / টেস্ট রান'}
              </button>

              {/* ── Results card ── */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 240 }}
                    className={`mt-3 rounded-2xl border p-4 ${
                      result.success
                        ? 'border-emerald-400/40 bg-emerald-400/10'
                        : 'border-rose-400/40 bg-rose-400/10'
                    }`}
                  >
                    {result.success ? (
                      <>
                        <p className="font-display text-sm font-bold uppercase tracking-widest text-emerald-300">
                          ✅ কোর স্থিতিশীল! সলিনয়ডাল + অঘূর্ণনশীল
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          ∇·F = {result.div.toFixed(2)} · (∇×F)_z = {result.curl.toFixed(2)} · স্থিতিশীলতা:{' '}
                          {Math.round(result.stability)}%
                        </p>
                        <button
                          onClick={onClose}
                          className="mt-3 w-full rounded-xl border border-emerald-400/40 bg-emerald-400/15 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-400/25"
                        >
                          প্লাজমা রিলিজ পান ▸
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-sm font-bold uppercase tracking-widest text-rose-300">
                          ❌ কোর অস্থির — বিস্ফোরণের ঝুঁকি!
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          ∇·F = {result.div.toFixed(2)} ({result.solenoidal ? '✔ সলিনয়ডাল' : '✘ ' + result.divLabel}) ·{' '}
                          (∇×F)_z = {result.curl.toFixed(2)} ({result.irrotational ? '✔ অঘূর্ণনশীল' : '✘ ঘূর্ণনশীল'})
                        </p>
                        {hint && (
                          <p className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5 text-xs leading-relaxed text-amber-200">
                            💡 {hint}
                          </p>
                        )}
                        <button
                          onClick={stabilize}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/40 bg-rose-400/15 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-rose-300 transition hover:bg-rose-400/25"
                        >
                          <FaRedo /> আবার টেস্ট রান
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

const BASE_PARTICLES = 90;

/**
 * Internal canvas: futuristic reactor core with a dynamic vector-field of
 * plasma particles that follow F = (a x + b y, c x + d y). Arrows reflect
 * divergence (outward/inward), curl (swirl), and laminar flow when stable.
 */
function CoreCanvas({ a, b, c, d, isRunning, onComplete }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  const CP = useRef({ a, b, c, d, onComplete });
  CP.current = { a, b, c, d, onComplete };

  const S = useRef(null);
  const getSim = () => {
    if (!S.current) {
      S.current = {
        phase: 'idle', // idle | running | verdict | done
        w: 0, h: 0, t: 0, runT: 0, phaseT: 0,
        particles: [], sparks: [],
        fired: false, result: null,
      };
    }
    return S.current;
  };

  useEffect(() => {
    if (isRunning) {
      const s = getSim();
      s.phase = 'running';
      s.runT = 0;
      s.sparks = [];
      s.fired = false;
      s.result = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Main render loop — cleanly cancelled on unmount.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let last = performance.now();
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(wrap.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(wrap.clientHeight * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      step(dt);
      draw(ctx, dpr);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function geo() {
    const s = getSim();
    const wrap = wrapRef.current;
    if (wrap) {
      s.w = wrap.clientWidth;
      s.h = wrap.clientHeight;
    }
    return {
      W: s.w, H: s.h,
      cx: s.w / 2, cy: s.h / 2,
      R: Math.min(s.w, s.h) * 0.36,
    };
  }

  function step(dt) {
    const s = getSim();
    const p = CP.current;
    s.t += dt;

    // Ensure particles exist for the current size.
    if (s.particles.length === 0) {
      const g = geo();
      for (let i = 0; i < BASE_PARTICLES; i++) {
        s.particles.push({
          x: g.cx + (Math.random() - 0.5) * g.R * 1.5,
          y: g.cy + (Math.random() - 0.5) * g.R * 1.5,
        });
      }
    }

    // Integrate the vector field.
    const K = 0.9;
    const g = geo();
    for (const q of s.particles) {
      const dxp = q.x - g.cx;
      const dyp = q.y - g.cy;
      const fx = p.a * dxp + p.b * dyp;
      const fy = p.c * dxp + p.d * dyp;
      q.x += fx * K * dt * 8;
      q.y += fy * K * dt * 8;
      // soft containment ring pull
      const rr = Math.hypot(q.x - g.cx, q.y - g.cy);
      if (rr > g.R * 1.6) {
        q.x = g.cx + ((q.x - g.cx) / rr) * g.R * 1.5;
        q.y = g.cy + ((q.y - g.cy) / rr) * g.R * 1.5;
      }
    }

    const ev = evaluate(p.a, p.b, p.c, p.d);

    // Unstable electric sparks.
    if (!ev.success && Math.random() < (0.4 + (1 - ev.stability / 100) * 0.4) * dt * 10) {
      const a0 = Math.random() * Math.PI * 2;
      const r0 = Math.random() * g.R;
      s.sparks.push({
        x: g.cx + Math.cos(a0) * r0,
        y: g.cy + Math.sin(a0) * r0,
        life: 1,
      });
    }
    for (const sp of s.sparks) sp.life -= dt * 3;
    s.sparks = s.sparks.filter((sp) => sp.life > 0);

    if (s.phase === 'running') {
      s.runT += dt;
      if (s.runT >= RUN_S) {
        s.result = evaluate(p.a, p.b, p.c, p.d);
        s.phase = 'verdict';
        s.phaseT = 0;
      }
    } else if (s.phase === 'verdict') {
      s.phaseT += dt;
      if (s.phaseT >= 1.3 && !s.fired) {
        s.fired = true;
        s.phase = 'done';
        CP.current.onComplete(s.result);
      }
    }
  }

  function draw(ctx, dpr) {
    const s = getSim();
    const p = CP.current;
    const g = geo();
    const { W, H } = g;
    if (!W || !H) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const ev = evaluate(p.a, p.b, p.c, p.d);
    const glowColor = ev.success ? '#34d399' : ev.stability > 55 ? '#fbbf24' : '#f87171';

    // Chamber background
    const bg = ctx.createRadialGradient(g.cx, g.cy, 5, g.cx, g.cy, W * 0.6);
    bg.addColorStop(0, ev.success ? 'rgba(16, 40, 40, 0.9)' : 'rgba(40, 20, 16, 0.9)');
    bg.addColorStop(1, '#05080f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // HUD-relevant data on the floor
    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.font = '700 12px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`∇·F = ${ev.div.toFixed(2)}  ·  (∇×F)_z = ${ev.curl.toFixed(2)}`, 12, 20);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 20.5);
    ctx.lineTo(W, 20.5);
    ctx.stroke();

    // Reactor core vessel (static tech ring + hazard/calm rim)
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = ev.success ? 34 : 18;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = ev.success ? 3.5 : 2.5;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, g.R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // inner dashed security ring
    ctx.save();
    ctx.strokeStyle = glowColor;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([6, 7]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, g.R * 0.86, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // rotating notches
    ctx.save();
    for (let i = 0; i < 18; i++) {
      const a = (i * Math.PI) / 9 + s.t * 0.18;
      ctx.strokeStyle = glowColor;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(g.cx + Math.cos(a) * g.R * 0.92, g.cy + Math.sin(a) * g.R * 0.92);
      ctx.lineTo(g.cx + Math.cos(a) * g.R * 1.0, g.cy + Math.sin(a) * g.R * 1.0);
      ctx.stroke();
    }
    ctx.restore();

    // Plasma particles as streak-arrows following F
    const Ks = 2.6;
    for (const q of s.particles) {
      const dxp = q.x - g.cx;
      const dyp = q.y - g.cy;
      const fx = p.a * dxp + p.b * dyp;
      const fy = p.c * dxp + p.d * dyp;
      const mag = Math.hypot(fx, fy);
      const scale = Math.min(1, mag * 0.3);
      const len = Math.sqrt((fx * fx + fy * fy) * Ks * Ks * 0.4 + 2);
      const ang = Math.atan2(fy, fx);
      const col = ev.success
        ? `rgba(52, 211, 153, ${0.5 + scale * 0.5})`
        : `rgba(251, 191, 36, ${0.4 + scale * 0.5})`;
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(ang);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-len * 0.5, 0);
      ctx.lineTo(len * 0.5, 0);
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(len * 0.5, 0);
      ctx.lineTo(len * 0.5 - 4.5, 2.4);
      ctx.lineTo(len * 0.5 - 4.5, -2.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Electric sparks
    for (const sp of s.sparks) {
      ctx.strokeStyle = `rgba(248, 113, 113, ${sp.life})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y);
      ctx.lineTo(sp.x + (Math.random() - 0.5) * 16, sp.y + (Math.random() - 0.5) * 16);
      ctx.stroke();
    }

    // Status banner during run
    if (s.phase === 'running') {
      ctx.font = '700 14px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = glowColor;
      ctx.fillText(ev.success ? '⚡ স্থিতিশীল হচ্ছে…' : '🌀 সমন্বয় চলছে…', g.cx, H * 0.1);
    }

    // Verdict overlay
    if (s.phase === 'verdict') {
      const a = Math.min(s.phaseT / 0.3, 1);
      ctx.save();
      ctx.globalAlpha = a * 0.95;
      ctx.font = '700 20px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = s.result.success ? '#34d399' : '#f87171';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 8;
      ctx.fillText(
        s.result.success ? '✅ কোর স্থিতিশীল — ল্যামিনার প্রবাহ!' : '❌ কোর অস্থির!',
        g.cx,
        H * 0.1
      );
      ctx.restore();
    }
  }

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[#05080f] shadow-aura-violet"
      style={{ aspectRatio: '16 / 10' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}