import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlay, FaRedo, FaTimes as FaCross, FaDotCircle } from 'react-icons/fa';
import { FaRulerCombined } from 'react-icons/fa';

/**
 * DotCrossChallengeModal
 * ----------------------
 * Scene 1 — "Ancillary Sanctuary Gate" (HSC Physics · Vector Chapter).
 * Webtoon story + interactive dot/cross product gate simulation.
 *
 * Vector A is fixed at (3, 4, 0) with |A| = 5. The player tunes B = (Bx, By):
 *   a) A · B   = Ax*Bx + Ay*By          (orthogonality → must be ≈ 0)
 *   b) cos(θ)  = (A · B) / (|A| |B|)
 *   c) |A × B| = |Ax*By − Ay*Bx|        (gate power → target area 25 u²)
 *   d) projection of B on A = (A · B) / |A|
 *
 * Perfect solution: B ⊥ A with |B| = 5, e.g. B = −4i + 3j  →  A·B = 0,
 * |A × B| = 25. Ships with mock defaults for instant preview:
 * <DotCrossChallengeModal />  (open = true by default).
 */

// ── Physics constants ───────────────────────────────────────────────────────
const A_VEC = { x: 3, y: 4 };
const MAG_A = 5;
const TARGET_AREA = 25;
const DOT_TOL = 0.1;
const AREA_TOL = 0.5;

const dotOf = (b) => A_VEC.x * b.x + A_VEC.y * b.y;
const crossOf = (b) => A_VEC.x * b.y - A_VEC.y * b.x;
const projOf = (b) => dotOf(b) / MAG_A;

function evalB(b) {
  const dot = dotOf(b);
  const cross = crossOf(b);
  const magB = Math.hypot(b.x, b.y);
  const angleDeg = magB === 0 ? null : (Math.acos(Math.max(-1, Math.min(1, dot / (MAG_A * magB)))) * 180) / Math.PI;
  const aligned = Math.abs(dot) <= DOT_TOL;
  const powered = Math.abs(cross - TARGET_AREA) <= AREA_TOL;
  const accuracy = Math.round(
    Math.max(0, Math.min(100, 100 - Math.abs(dot) * 20 - Math.abs(cross - TARGET_AREA) * 3))
  );
  return { dot, cross, magB, angleDeg, proj: projOf(b), aligned, powered, success: aligned && powered, accuracy };
}

// ── Local mock test state — tweak freely to preview ─────────────────────────
const MOCK_B = { x: -4, y: 3 }; // the perfect answer

const buildStory = () => [
  {
    speaker: 'মন্দিরের রক্ষক',
    portrait: '🗿',
    text: 'থামো পথিক! সামনে প্রাচীন আলোর দ্বার। যদি দুই শক্তি-ভেক্টর A এবং B একে অপরের ওপর লম্ব না হয়, তবে এই দ্বারের ভারসাম্য নষ্ট হয়ে প্রবেশপথ চিরতরে বন্ধ হয়ে যাবে।',
  },
  {
    speaker: 'আপনি',
    portrait: '🧑‍🔬',
    text: 'হুম, দুই ভেক্টর লম্ব হওয়ার শর্ত হলো তাদের ডট গুণন শূন্য হতে হবে (A · B = 0)। আর দ্বারের নিরাপত্তা ক্ষেত্রফল বের করতে তাদের ক্রস গুণনের মান (|A × B|) নিয়ন্ত্রণ করতে হবে।',
  },
  {
    speaker: 'মন্দিরের রক্ষক',
    portrait: '🗿',
    text: 'ঠিক ধরেছ! A = 3i + 4j হলে এমন একটি ভেক্টর B নির্ণয় করো যেন দ্বারটি সঠিক লম্ব অভিক্ষেপ পেয়ে খুলে যায়!',
  },
];

/** Bengali retry hints. */
function buildHint(result) {
  if (!result || result.success) return '';
  if (!result.aligned && !result.powered) {
    return 'B-কে A-এর লম্ব করো (A·B ≈ 0) এবং |B| ঠিক করে |A × B| = 25 আনো। ইঙ্গিত: B = −4i + 3j পরীক্ষা করো!';
  }
  if (!result.aligned) {
    return 'ক্ষেত্রফল প্রায় ঠিক আছে, কিন্তু ভেক্টর দুটি লম্ব নয় — A·B ≈ 0 করতে B-এর দিক ঘুরিয়ে A-এর লম্ব দিকে আনো।';
  }
  return 'ভেক্টর দুটি নিখুঁতভাবে লম্ব! এখন |B| বাড়িয়ে/কমিয়ে |A × B| = 25 ইউনিট² করো।';
}

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

export default function DotCrossChallengeModal({
  open = true,
  onClose = () => {},
  onLevelComplete = () => {},
}) {
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyDone, setStoryDone] = useState(false);
  const [bx, setBx] = useState(MOCK_B.x);
  const [by, setBy] = useState(MOCK_B.y);
  const [runKey, setRunKey] = useState(0);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const lines = useMemo(() => buildStory(), []);
  const line = lines[Math.min(storyIndex, lines.length - 1)];
  const tw = useTypewriter(storyDone ? '' : line.text);

  const live = useMemo(() => evalB({ x: bx, y: by }), [bx, by]);

  const handleTap = () => {
    if (storyDone) return;
    if (!tw.done) {
      tw.finish();
      return;
    }
    if (storyIndex < lines.length - 1) setStoryIndex((i) => i + 1);
    else setStoryDone(true);
  };

  const check = () => {
    setResult(null);
    setRunKey((k) => k + 1); // remount canvas → fresh check animation
    setChecking(true);
  };

  const handleComplete = useCallback(
    (r) => {
      setResult(r);
      setChecking(false);
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
                  Physics · Vector Chapter
                </p>
                <h2 className="font-display text-lg font-bold text-white sm:text-xl">
                  Scene 1 — Ancillary Sanctuary Gate
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
                    className="flex cursor-pointer select-none items-start gap-3 rounded-2xl border border-cyan-400/25 bg-gradient-to-r from-cyan-400/10 to-transparent p-4"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500 to-cyan-700 text-3xl shadow-lg">
                      <motion.span
                        animate={{ y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
                      >
                        {line.portrait}
                      </motion.span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-xs font-bold uppercase tracking-widest text-cyan-300">
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
                            : 'দ্বার খোলার প্রস্তুতি নিন ▸'}
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
                    <span className="text-lg">🗿</span>
                    <span className="truncate">মন্দিরের রক্ষক: “ভেক্টর B সাজাও — দ্বার অপেক্ষা করছে…”</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Sanctuary gate simulation ── */}
              <div className="mt-4">
                <GateCanvas key={runKey} bx={bx} by={by} isChecking={checking} onComplete={handleComplete} />
              </div>

              {/* ── Live physics readout tiles ── */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: 'A · B', value: live.dot.toFixed(2), ok: live.aligned, icon: <FaDotCircle /> },
                  { label: '|A × B|', value: live.cross.toFixed(2), ok: live.powered, icon: <FaCross /> },
                  { label: 'অভিক্ষেপ', value: live.proj.toFixed(2), ok: Math.abs(live.proj) <= DOT_TOL, icon: <FaRulerCombined /> },
                  { label: 'কোণ θ', value: live.angleDeg == null ? '—' : `${live.angleDeg.toFixed(1)}°`, ok: live.angleDeg != null && Math.abs(live.angleDeg - 90) <= 1.2, icon: <FaRulerCombined /> },
                ].map((t) => (
                  <div
                    key={t.label}
                    className={`rounded-xl border p-3 text-center transition ${
                      t.ok ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-white/50">
                      {t.icon} {t.label}
                    </p>
                    <p className={`mt-1 font-display text-lg font-bold ${t.ok ? 'text-emerald-300' : 'text-white/90'}`}>
                      {t.value}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] text-white/45">
                লক্ষ্য: A · B ≈ 0 (±{DOT_TOL}) এবং |A × B| ≈ {TARGET_AREA} ইউনিট² (±{AREA_TOL}) · |A| = {MAG_A}
              </p>

              {/* ── Vector B controls ── */}
              <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Bx উপাংশন', value: bx, set: setBx },
                    { label: 'By উপাংশন', value: by, set: setBy },
                  ].map((c) => (
                    <div key={c.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-white/70">{c.label}</span>
                        <input
                          type="number"
                          min="-10"
                          max="10"
                          step="0.5"
                          value={c.value}
                          disabled={checking}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (!Number.isNaN(n)) c.set(Math.max(-10, Math.min(10, n)));
                          }}
                          className="w-16 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-center font-display text-sm font-bold text-amber-300 outline-none focus:border-amber-400/60"
                        />
                      </div>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        step="0.5"
                        value={c.value}
                        disabled={checking}
                        onChange={(e) => c.set(Number(e.target.value))}
                        className="mt-3 w-full accent-amber-400"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-white/60">
                  বর্তমান B ={' '}
                  <span className="font-display font-bold text-amber-300">
                    {bx}i {by < 0 ? '−' : '+'} {Math.abs(by)}j
                  </span>{' '}
                  · |B| = <span className="font-display font-bold text-amber-300">{live.magB.toFixed(2)}</span>
                </p>
                <button
                  onClick={check}
                  disabled={checking}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-aura-cyan to-aura-violet px-6 py-4 font-display text-sm font-bold uppercase tracking-widest text-[#04121c] transition enabled:hover:brightness-110 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaPlay /> {checking ? 'যাচাই চলছে…' : 'অ্যালাইনমেন্ট / পাওয়ার যাচাই'}
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
                      result.success ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-rose-400/40 bg-rose-400/10'
                    }`}
                  >
                    {result.success ? (
                      <>
                        <p className="font-display text-sm font-bold uppercase tracking-widest text-emerald-300">
                          ✅ দ্বার খুলে গেছে! নিখুঁত লম্ব অভিক্ষেপ
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          A · B = {result.dot.toFixed(2)} · |A × B| = {result.cross.toFixed(2)} ইউনিট² · নির্ভুলতা:{' '}
                          {result.accuracy}%
                        </p>
                        <button
                          onClick={onClose}
                          className="mt-3 w-full rounded-xl border border-emerald-400/40 bg-emerald-400/15 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-400/25"
                        >
                          পরবর্তী দৃশ্যে যান ▸
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-sm font-bold uppercase tracking-widest text-rose-300">
                          ❌ দ্বার অপ্রতুল — ভারসাম্য নেই
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          A · B = {result.dot.toFixed(2)} ({result.aligned ? '✔ লম্ব' : '✘ লম্ব নয়'}) · |A × B| ={' '}
                          {result.cross.toFixed(2)} ({result.powered ? '✔ ক্ষেত্রফল ঠিক' : '✘ ক্ষেত্রফল ভুল'})
                        </p>
                        {hint && (
                          <p className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5 text-xs leading-relaxed text-amber-200">
                            💡 {hint}
                          </p>
                        )}
                        <button
                          onClick={check}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/40 bg-rose-400/15 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-rose-300 transition hover:bg-rose-400/25"
                        >
                          <FaRedo /> আবার চেষ্টা করুন
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

const CHECK_S = 1.5;   // real seconds of gate-scan animation
const FLASH_S = 1.2;   // real seconds of success/fail feedback before callback

/**
 * Internal canvas: renders the sanctuary gate, vectors A/B, the shaded
 * parallelogram (|A × B|) and the angle θ. Runs a check animation when
 * `isChecking` turns on, then calls onComplete(result) once.
 */
function GateCanvas({ bx, by, isChecking, onComplete }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  const P = useRef({ bx, by, onComplete });
  P.current = { bx, by, onComplete };

  const S = useRef(null);
  const getSim = () => {
    if (!S.current) {
      S.current = {
        phase: 'idle', // idle | checking | flash | done
        w: 0, h: 0, t: 0, checkT: 0, phaseT: 0,
        particles: [], fired: false, result: null,
      };
    }
    return S.current;
  };

  useEffect(() => {
    if (isChecking) {
      const s = getSim();
      s.phase = 'checking';
      s.checkT = 0;
      s.phaseT = 0;
      s.particles = [];
      s.fired = false;
      s.result = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking]);

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

  function step(dt) {
    const s = getSim();
    const p = P.current;
    s.t += dt;

    if (s.phase === 'checking') {
      s.checkT += dt;
      if (s.checkT >= CHECK_S) {
        s.result = evalB({ x: p.bx, y: p.by });
        s.phase = 'flash';
        s.phaseT = 0;
        if (s.result.success) spawnBurst(s);
      }
    } else if (s.phase === 'flash') {
      s.phaseT += dt;
      stepParticles(s, dt);
      if (s.phaseT >= FLASH_S && !s.fired) {
        s.fired = true;
        s.phase = 'done';
        P.current.onComplete(s.result);
      }
    }
  }

  function spawnBurst(s) {
    const g = geo();
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 180;
      s.particles.push({
        x: g.cx,
        y: g.cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 50,
        life: 1,
        decay: 0.7 + Math.random() * 0.8,
        r: 1.5 + Math.random() * 2.8,
        color: Math.random() < 0.5 ? '#39ff88' : '#67e8f9',
      });
    }
  }

  function stepParticles(s, dt) {
    for (const q of s.particles) {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 200 * dt;
      q.life -= q.decay * dt;
    }
    s.particles = s.particles.filter((q) => q.life > 0);
  }

  function geo() {
    const s = getSim();
    const wrap = wrapRef.current;
    if (wrap) {
      s.w = wrap.clientWidth;
      s.h = wrap.clientHeight;
    }
    const W = s.w;
    const H = s.h;
    const cx = W / 2;
    const cy = H * 0.58;
    const u = Math.max(8, Math.min(W / 19, H / 15.5)); // px per grid unit
    const px = (x) => cx + x * u;
    const py = (y) => cy - y * u;
    return { W, H, cx, cy, u, px, py };
  }

  function draw(ctx, dpr) {
    const s = getSim();
    const p = P.current;
    const g = geo();
    const { W, H } = g;
    if (!W || !H) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const b = { x: p.bx, y: p.by };
    const ev = evalB(b);
    const gateColor = s.phase === 'flash'
      ? (ev.success ? '#39ff88' : '#f87171')
      : ev.success ? '#39ff88'
        : ev.aligned || ev.powered ? '#86efac'
          : '#475569';

    // Background
    const bg = ctx.createRadialGradient(g.cx, g.cy, 10, g.cx, g.cy, W * 0.7);
    bg.addColorStop(0, '#0d1526');
    bg.addColorStop(1, '#070b13');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -12; i <= 12; i++) {
      ctx.moveTo(g.px(i), 0);
      ctx.lineTo(g.px(i), H);
      ctx.moveTo(0, g.py(i));
      ctx.lineTo(W, g.py(i));
    }
    ctx.stroke();

    // Ancient gate — outer ring, rune ticks, inner dashed ring
    const gr = 4.8 * g.u;
    ctx.save();
    ctx.shadowColor = gateColor;
    ctx.shadowBlur = ev.success ? 26 : 12;
    ctx.strokeStyle = gateColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, gr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = gateColor;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([5, 7]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, gr * 0.82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6 + s.t * 0.15;
      ctx.strokeStyle = gateColor;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(g.cx + Math.cos(a) * gr * 0.94, g.cy + Math.sin(a) * gr * 0.94);
      ctx.lineTo(g.cx + Math.cos(a) * gr * 1.04, g.cy + Math.sin(a) * gr * 1.04);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Parallelogram (cross-product area)
    ctx.beginPath();
    ctx.moveTo(g.cx, g.cy);
    ctx.lineTo(g.px(A_VEC.x), g.py(A_VEC.y));
    ctx.lineTo(g.px(A_VEC.x + b.x), g.py(A_VEC.y + b.y));
    ctx.lineTo(g.px(b.x), g.py(b.y));
    ctx.closePath();
    ctx.fillStyle = ev.powered ? 'rgba(57, 255, 136, 0.16)' : 'rgba(251, 191, 36, 0.14)';
    ctx.fill();
    ctx.strokeStyle = ev.powered ? 'rgba(57, 255, 136, 0.5)' : 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Angle θ arc + label
    const aA = Math.atan2(A_VEC.y, A_VEC.x);
    if (ev.magB > 0.001) {
      const aB = Math.atan2(b.y, b.x);
      const lo = Math.min(aA, aB);
      const hi = Math.max(aA, aB);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, 1.25 * g.u, -hi, -lo);
      ctx.stroke();
      const bis = (aA + aB) / 2;
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 11px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`θ=${ev.angleDeg.toFixed(0)}°`, g.cx + Math.cos(bis) * 1.75 * g.u, g.cy - Math.sin(bis) * 1.75 * g.u);
    }

    // Vectors
    drawVector(ctx, g, A_VEC.x, A_VEC.y, '#22d3ee', 'A = 3i + 4j');
    drawVector(ctx, g, b.x, b.y, '#fbbf24', `B = ${b.x}i ${b.y < 0 ? '−' : '+'} ${Math.abs(b.y)}j`);

    // Scan sweep while checking
    if (s.phase === 'checking') {
      const prog = Math.min(s.checkT / CHECK_S, 1);
      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, gr * 1.12, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#22d3ee';
      ctx.font = '700 11px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`যাচাই চলছে… ${Math.round(prog * 100)}%`, g.cx, 20);
    }

    // HUD readouts
    ctx.textAlign = 'left';
    ctx.font = '700 12px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = ev.aligned ? '#39ff88' : '#cbd5e1';
    ctx.fillText(`A · B = ${ev.dot.toFixed(2)}`, 12, 22);
    ctx.fillStyle = ev.powered ? '#39ff88' : '#cbd5e1';
    ctx.fillText(`|A × B| = ${ev.cross.toFixed(2)}`, 12, 40);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '600 10px "Space Grotesk", system-ui, sans-serif';
    ctx.fillText('লক্ষ্য: A·B = 0 · |A × B| = 25', 12, 58);

    // Particles
    for (const q of s.particles) {
      ctx.globalAlpha = Math.max(q.life, 0);
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Flash overlay + verdict
    if (s.phase === 'flash') {
      const a = 0.28 * Math.max(0, 1 - s.phaseT / FLASH_S);
      ctx.fillStyle = ev.success ? `rgba(57, 255, 136, ${a})` : `rgba(239, 68, 68, ${a})`;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalAlpha = Math.min(s.phaseT / 0.25, 1);
      ctx.font = '700 20px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ev.success ? '#39ff88' : '#f87171';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 8;
      ctx.fillText(ev.success ? '⚔ দ্বার উন্মুক্ত!' : '✖ ভারসাম্য বিনষ্ট!', g.cx, 34);
      ctx.restore();
    }
  }

  function drawVector(ctx, g, vx, vy, color, label) {
    const x1 = g.cx;
    const y1 = g.cy;
    const x2 = g.px(vx);
    const y2 = g.py(vy);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.translate(x2, y2);
    ctx.rotate(ang);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-11, 5.5);
    ctx.lineTo(-11, -5.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = color;
    ctx.font = '700 12px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, (x1 + x2) / 2, (y1 + y2) / 2 - 9);
  }



  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#070b13] shadow-aura-cyan"
      style={{ aspectRatio: '16 / 10' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}




