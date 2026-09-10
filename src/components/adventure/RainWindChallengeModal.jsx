import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlay, FaRedo, FaCloudRain, FaTachometerAlt, FaUmbrella } from 'react-icons/fa';

/**
 * RainWindChallengeModal
 * ----------------------
 * Scene 2 — "Stormy Ridge Extraction" (HSC Physics · Vector Chapter ·
 * Relative velocity of rain, wind and man).
 *
 * Frame: the runner (V_person east, +x). Rain falls at V_rain = 10 m/s
 * (downwards); wind blows at V_wind = −2 m/s (westwards).
 *   Vx_rel = V_wind − V_person
 *   Vy_rel = V_rain
 *   V_apparent = √(Vx_rel² + Vy_rel²)
 *   θ_ideal (from vertical) = arctan(|Vx_rel| / Vy_rel)
 * Success: chosen umbrella tilt θ matches θ_ideal within ±2°.
 *
 * Ships with mock defaults for instant preview: <RainWindChallengeModal />.
 */

// ── Physics constants ───────────────────────────────────────────────────────
const V_RAIN = 10;      // m/s, downwards
const V_WIND = -2;      // m/s, westwards (negative x)
const ANGLE_TOL = 2;    // degrees
const RUN_S = 3.2;      // real seconds of the test-run animation

const apparentVelocity = (vPerson) => {
  const vx = V_WIND - vPerson;      // relative horizontal (rain frame wrt person)
  const vy = V_RAIN;                // relative vertical (downwards)
  return { vx, vy, speed: Math.hypot(vx, vy) };
};
const idealAngle = (vPerson) =>
  (Math.atan2(Math.abs(V_WIND - vPerson), V_RAIN) * 180) / Math.PI;

// ── Local mock test state — tweak freely to preview ─────────────────────────
const MOCK = { vPerson: 5, angle: 35 }; // θ_ideal = atan(7/10) ≈ 35°

const buildStory = () => [
  {
    speaker: 'উদ্ধারকারী বৈমানিক',
    portrait: '🚁',
    text: 'জরুরি বার্তা! পাহাড়ি গিরিপথে প্রচণ্ড ঝড় শুরু হয়েছে। উপর থেকে বৃষ্টি পড়ছে 10 m/s বেগে, আর বাতাস বইছে পশ্চিমে 2 m/s বেগে! আপনি যদি খাড়া ছাতা ধরে থাকেন, তবে কিছুক্ষণের মধ্যেই ভিজে হাইপোথার্মিয়ায় আক্রান্ত হবেন!',
  },
  {
    speaker: 'আপনি',
    portrait: '🧑‍🔬',
    text: 'ভয়ের কিছু নেই! মানুষ বা গাড়ির বেগ (V_person), বাতাসের বেগ (V_wind) এবং বৃষ্টির বেগ (V_rain) এর মধ্যে আপেক্ষিক বেগ নির্ণয় করতে হবে: V_rel = V_rain − V_person + V_wind।',
  },
  {
    speaker: 'উদ্ধারকারী বৈমানিক',
    portrait: '🚁',
    text: 'আপনি দ্রুত এগিয়ে যান! কত কোণে (θ) ছাতা হেলালে বৃষ্টি আপনাকে স্পর্শ করতে পারবে না, সেই নিখুঁত কোণ হিসাব করে কমান্ড প্যানেলে সেট করুন!',
  },
];

/** Bengali retry hint. */
const buildHint = (result) => {
  if (!result || result.success) return '';
  return `সূত্র: tan θ = |V_person + V_wind| / V_rain = ${Math.abs(V_WIND - result.vPerson)} / ${V_RAIN} → নিখুঁত কোণ θ ≈ ${result.thetaIdeal.toFixed(1)}°। কমান্ড প্যানেলে সেট করে আবার টেস্ট রান দিন!`;
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

export default function RainWindChallengeModal({
  open = true,
  onClose = () => {},
  onLevelComplete = () => {},
}) {
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyDone, setStoryDone] = useState(false);
  const [vPerson, setVPerson] = useState(MOCK.vPerson);
  const [angle, setAngle] = useState(MOCK.angle);
  const [runKey, setRunKey] = useState(0);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const lines = useMemo(() => buildStory(), []);
  const line = lines[Math.min(storyIndex, lines.length - 1)];
  const tw = useTypewriter(storyDone ? '' : line.text);

  const rel = useMemo(() => apparentVelocity(vPerson), [vPerson]);
  const dryness = Math.max(0, Math.round(100 - Math.abs(angle - rel.ideal) * 4));

  const handleTap = () => {
    if (storyDone) return;
    if (!tw.done) {
      tw.finish();
      return;
    }
    if (storyIndex < lines.length - 1) setStoryIndex((i) => i + 1);
    else setStoryDone(true);
  };

  const testRun = () => {
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
            className="relative z-10 flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-sky-400/25 bg-gradient-to-b from-[#0b1220] via-[#0a1424] to-[#060b14] shadow-aura-violet"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <div>
                <p className="font-display text-[10px] uppercase tracking-[0.3em] text-sky-300">
                  Physics · Vector Chapter · Relative Velocity
                </p>
                <h2 className="font-display text-lg font-bold text-white sm:text-xl">
                  Scene 2 — Stormy Ridge Extraction
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
                    className="flex cursor-pointer select-none items-start gap-3 rounded-2xl border border-sky-400/25 bg-gradient-to-r from-sky-400/10 to-transparent p-4"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 text-3xl shadow-lg">
                      <motion.span
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                      >
                        {line.portrait}
                      </motion.span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-xs font-bold uppercase tracking-widest text-sky-300">
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
                            : 'গিরিপথে নামুন ▸'}
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
                    <span className="text-lg">🚁</span>
                    <span className="truncate">বৈমানিক: “ঝড় তীব্র হচ্ছে — ছাতার কোণ সেট করো, দ্রুত!”</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Ridge simulation ── */}
              <div className="mt-4">
                <RidgeCanvas key={runKey} vPerson={vPerson} angle={angle} isRunning={testing} onComplete={handleComplete} />
              </div>

              {/* ── Real-time HUD ── */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-white/50">
                    <FaTachometerAlt /> আপেক্ষিক বেগ
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-sky-300">{rel.speed.toFixed(1)} m/s</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-white/50">
                    <FaUmbrella /> প্রয়োজনীয় কোণ
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-emerald-300">{rel.ideal.toFixed(1)}°</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-white/50">
                    <FaCloudRain /> শুকনো অবস্থা
                  </p>
                  <p className={`mt-1 font-display text-lg font-bold ${dryness >= 96 ? 'text-emerald-300' : dryness > 60 ? 'text-amber-300' : 'text-rose-300'}`}>
                    {dryness}%
                  </p>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-white/45">
                V_rain = {V_RAIN} m/s (নিচে) · V_wind = {V_WIND} m/s (পশ্চিমে) · সহনশীলতা: ±{ANGLE_TOL}°
              </p>

              {/* ── Controls ── */}
              <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-white/70">V_person (দৌড় বেগ)</span>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        step="0.5"
                        value={vPerson}
                        disabled={testing}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isNaN(n)) setVPerson(Math.max(0, Math.min(15, n)));
                        }}
                        className="w-16 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-center font-display text-sm font-bold text-sky-300 outline-none focus:border-sky-400/60"
                      />
                      <span className="text-xs text-white/50">m/s</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.5"
                      value={vPerson}
                      disabled={testing}
                      onChange={(e) => setVPerson(Number(e.target.value))}
                      className="mt-3 w-full accent-sky-400"
                    />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-white/70">ছাতার হেলান θ (উল্লম্ব থেকে)</span>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        step="1"
                        value={angle}
                        disabled={testing}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isNaN(n)) setAngle(Math.max(0, Math.min(90, n)));
                        }}
                        className="w-16 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-center font-display text-sm font-bold text-amber-300 outline-none focus:border-amber-400/60"
                      />
                      <span className="text-xs text-white/50">°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="1"
                      value={angle}
                      disabled={testing}
                      onChange={(e) => setAngle(Number(e.target.value))}
                      className="mt-3 w-full accent-amber-400"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center text-[11px] leading-relaxed text-white/55">
                  সূত্র: V_rel = V_rain − V_person + V_wind · V_apparent = √(Vx_rel² + Vy_rel²) · tan θ = |Vx_rel| / V_rain
                </div>
                <button
                  onClick={testRun}
                  disabled={testing}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-aura-cyan to-aura-violet px-6 py-4 font-display text-sm font-bold uppercase tracking-widest text-[#04121c] transition enabled:hover:brightness-110 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaPlay /> {testing ? 'টেস্ট রান চলছে…' : 'লঞ্চ / টেস্ট রান'}
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
                          🛡️ Shield ACTIVE — আপনি সম্পূর্ণ শুকনো!
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          θ = {result.angle}° ≈ θ_ideal ({result.thetaIdeal.toFixed(1)}°) · V_apparent ={' '}
                          {result.vApparent.toFixed(1)} m/s
                        </p>
                        <button
                          onClick={onClose}
                          className="mt-3 w-full rounded-xl border border-emerald-400/40 bg-emerald-400/15 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-400/25"
                        >
                          উদ্ধার সম্পন্ন ▸
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-sm font-bold uppercase tracking-widest text-rose-300">
                          🥶 ভিজে গেছেন! হাইপোথার্মিয়া সতর্কতা
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          ছাতা: {result.angle}° vs প্রয়োজনীয় {result.thetaIdeal.toFixed(1)}° (পার্থক্য{' '}
                          {Math.abs(result.angle - result.thetaIdeal).toFixed(1)}°)
                        </p>
                        {hint && (
                          <p className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5 text-xs leading-relaxed text-amber-200">
                            💡 {hint}
                          </p>
                        )}
                        <button
                          onClick={testRun}
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

const K_PX = 6; // canvas pixels per (m/s) for rain/wind motion

/**
 * Internal canvas: stormy ridge scene in the runner's frame. Rain particles
 * fall along the apparent velocity (Vx_rel, Vy_rel); the umbrella dome
 * deflects them when the tilt matches θ_ideal, otherwise they hit the
 * character. Includes a live velocity-vector diagram inset.
 */
function RidgeCanvas({ vPerson, angle, isRunning, onComplete }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  const P = useRef({ vPerson, angle, onComplete });
  P.current = { vPerson, angle, onComplete };

  const S = useRef(null);
  const getSim = () => {
    if (!S.current) {
      S.current = {
        phase: 'idle', // idle | running | verdict | done
        w: 0, h: 0, t: 0, runT: 0, phaseT: 0,
        rain: [], splashes: [],
        groundOff: 0, windOff: 0,
        wetHits: 0, fired: false, result: null, spawnAcc: 0,
      };
    }
    return S.current;
  };

  useEffect(() => {
    if (isRunning) {
      const s = getSim();
      s.phase = 'running';
      s.runT = 0;
      s.rain = [];
      s.splashes = [];
      s.wetHits = 0;
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
      groundY: s.h * 0.74,
      headX: s.w * 0.44,
      headY: s.h * 0.74 - 52,
    };
  }

  function step(dt) {
    const s = getSim();
    const p = P.current;
    s.t += dt;
    s.groundOff = (s.groundOff + p.vPerson * dt * 3.2) % 100000;
    s.windOff = (s.windOff + Math.abs(V_WIND) * dt * 14) % 100000;

    const { vx, vy } = apparentVelocity(p.vPerson);
    const k = 6; // px per (m/s)

    // Spawn rain
    s.spawnAcc += (s.phase === 'running' ? 110 : 45) * dt;
    while (s.spawnAcc >= 1) {
      s.spawnAcc -= 1;
      s.rain.push({
        x: -40 + Math.random() * (s.w + 140),
        y: -30 + Math.random() * 60,
        vx: vx * k,
        vy: vy * k,
        bounced: false,
        life: 1,
      });
    }

    const g = geo();
    const thetaRad = (p.angle * Math.PI) / 180;
    const cosT = Math.cos(thetaRad);
    const sinT = Math.sin(thetaRad);
    const shieldActive = Math.abs(p.angle - idealAngle(p.vPerson)) <= ANGLE_TOL;
    const HL = 34; // handle length
    const R = 27;  // canopy radius

    for (const q of s.rain) {
      if (q.bounced) {
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vy += 380 * dt; // deflected droplets fall away
        q.life -= dt * 1.6;
        continue;
      }
      const prevLy = sinT * (q.x - g.headX) + cosT * (q.y - g.headY);
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      const ly = sinT * (q.x - g.headX) + cosT * (q.y - g.headY);
      const lx = cosT * (q.x - g.headX) - sinT * (q.y - g.headY);

      // Canopy plane crossing (local y = −HL, span ±R)
      if (prevLy < -HL && ly >= -HL && Math.abs(lx) <= R + 3) {
        if (shieldActive) {
          q.bounced = true;
          q.vx = -vx * 0.18 + (Math.random() - 0.5) * 40;
          q.vy = -Math.abs(q.vy) * 0.3 - 20;
          s.splashes.push({ x: q.x, y: q.y, life: 1 });
        }
        // otherwise the rain passes straight through the tilted canopy
      } else if (
        q.x > g.headX - 10 && q.x < g.headX + 10 &&
        q.y > g.headY - 6 && q.y < g.groundY - 4
      ) {
        // Rain reached the character
        s.wetHits += 1;
        s.splashes.push({ x: q.x, y: q.y, red: true, life: 1 });
        q.life = 0;
      } else if (q.y > g.groundY) {
        s.splashes.push({ x: q.x, y: g.groundY, life: 1 });
        q.life = 0;
      }
    }
    s.rain = s.rain.filter((q) => q.life > 0 && q.x > -80 && q.x < s.w + 80);
    for (const sp of s.splashes) sp.life -= dt * 2.6;
    s.splashes = s.splashes.filter((sp) => sp.life > 0);

    if (s.phase === 'running') {
      s.runT += dt;
      if (s.runT >= RUN_S) {
        const ideal = idealAngle(p.vPerson);
        const ap = apparentVelocity(p.vPerson);
        s.result = {
          success: Math.abs(p.angle - ideal) <= ANGLE_TOL,
          angle: p.angle,
          thetaIdeal: ideal,
          vApparent: ap.speed,
          vPerson: p.vPerson,
        };
        s.phase = 'verdict';
        s.phaseT = 0;
      }
    } else if (s.phase === 'verdict') {
      s.phaseT += dt;
      if (s.phaseT >= 1.3 && !s.fired) {
        s.fired = true;
        s.phase = 'done';
        P.current.onComplete(s.result);
      }
    }
  }

  function draw(ctx, dpr) {
    const s = getSim();
    const p = P.current;
    const g = geo();
    const { W, H } = g;
    if (!W || !H) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const thetaRad = (p.angle * Math.PI) / 180;
    const shieldActive = Math.abs(p.angle - idealAngle(p.vPerson)) <= ANGLE_TOL;

    // Storm sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1c2a45');
    sky.addColorStop(0.6, '#121c30');
    sky.addColorStop(1, '#0a101c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Parallax mountain silhouettes (scroll against the runner's motion)
    drawMountains(ctx, g, s.groundOff * 0.25, H * 0.5, '#16223a', 90, 3);
    drawMountains(ctx, g, s.groundOff * 0.55, H * 0.6, '#101a2e', 60, 5);

    // Wind — dashed horizontal streaks moving westwards
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 197, 244, 0.3)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([14, 10]);
    for (let i = 0; i < 5; i++) {
      const y = 24 + i * 26;
      const off = (s.windOff + i * 53) % (W + 80);
      const x = W - off;
      ctx.beginPath();
      ctx.moveTo(x, y + Math.sin(s.t * 3 + i) * 2);
      ctx.lineTo(x + 34, y + Math.sin(s.t * 3 + i) * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Ridge ground with scrolling dashes
    ctx.fillStyle = '#0c1424';
    ctx.fillRect(0, g.groundY, W, H - g.groundY);
    ctx.strokeStyle = '#2a3b58';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, g.groundY);
    ctx.lineTo(W, g.groundY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(42, 59, 88, 0.6)';
    ctx.lineWidth = 3;
    for (let i = 0; i < Math.ceil(W / 34) + 2; i++) {
      const x = ((i * 34 - s.groundOff * 4) % (W + 34)) - 17;
      ctx.beginPath();
      ctx.moveTo(x, g.groundY + 8);
      ctx.lineTo(x + 14, g.groundY + 8);
      ctx.stroke();
    }

    // Rain streaks along the apparent velocity
    for (const q of s.rain) {
      const tail = 0.055;
      ctx.strokeStyle = q.bounced
        ? `rgba(103, 232, 249, ${0.8 * q.life})`
        : 'rgba(174, 214, 241, 0.5)';
      ctx.lineWidth = q.bounced ? 2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x - q.vx * tail, q.y - q.vy * tail);
      ctx.stroke();
    }

    // Splashes
    for (const sp of s.splashes) {
      ctx.strokeStyle = sp.red ? `rgba(248, 113, 113, ${sp.life})` : `rgba(174, 214, 241, ${sp.life * 0.8})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, (1 - sp.life) * 10 + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Character + umbrella
    drawRunner(ctx, g, s, p, thetaRad, shieldActive);

    // Velocity vector diagram (bottom-right inset)
    drawVectorDiagram(ctx, g, p);

    // Status badges + verdict
    if (s.phase === 'running') {
      ctx.font = '700 12px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = shieldActive ? '#39ff88' : '#f87171';
      ctx.fillText(shieldActive ? '🛡 SHIELD ACTIVE' : '💧 ভিজে যাচ্ছে!', W - 12, 22);
      ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';
      ctx.fillText(`run ${(RUN_S - s.runT).toFixed(1)}s`, W - 12, 40);
    }
    if (s.phase === 'verdict') {
      const a = Math.min(s.phaseT / 0.3, 1);
      ctx.save();
      ctx.globalAlpha = a * 0.95;
      ctx.font = '700 19px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = s.result.success ? '#39ff88' : '#f87171';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 8;
      ctx.fillText(s.result.success ? '🛡 সম্পূর্ণ শুকনো — SHIELD ACTIVE!' : '🥶 ভিজে গেছেন!', W / 2, 30);
      ctx.restore();
    }
  }

  function drawMountains(ctx, g, offset, baseY, color, amp, seed) {
    const W = g.W;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    const step = 90;
    for (let i = -1; i < Math.ceil(W / step) + 2; i++) {
      const x = ((i * step - offset) % (W + step * 2) + W + step * 2) % (W + step * 2) - step;
      const h = amp * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + seed)));
      ctx.lineTo(x + step / 2, baseY - h);
      ctx.lineTo(x + step, baseY);
    }
    ctx.lineTo(W, baseY);
    ctx.closePath();
    ctx.fill();
  }

  function drawRunner(ctx, g, s, p, thetaRad, shieldActive) {
    const runCycle = s.phase === 'running' ? s.t * (5 + p.vPerson * 0.9) : s.t * 2;
    const bob = Math.sin(runCycle * 2) * 2;
    const wet = s.wetHits;
    const shiver = wet > 12 ? Math.sin(s.t * 40) * 1.2 : 0;
    const bodyX = g.headX + shiver;
    const bodyY = g.headY + 14 + bob * 0.4;

    // Umbrella (behind body top): rotated by θ toward the oncoming rain
    const HL = 34;
    const R = 27;
    ctx.save();
    ctx.translate(bodyX, bodyY - 30);
    ctx.rotate(thetaRad);
    // handle
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -HL);
    ctx.stroke();
    // canopy dome
    ctx.beginPath();
    ctx.arc(0, -HL, R, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = shieldActive ? 'rgba(57, 255, 136, 0.35)' : 'rgba(251, 191, 36, 0.3)';
    ctx.fill();
    ctx.strokeStyle = shieldActive ? '#39ff88' : '#fbbf24';
    if (shieldActive) {
      ctx.shadowColor = '#39ff88';
      ctx.shadowBlur = 16;
    }
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.shadowBlur = 0;
    // ribs
    ctx.strokeStyle = shieldActive ? 'rgba(57, 255, 136, 0.6)' : 'rgba(251, 191, 36, 0.55)';
    ctx.lineWidth = 1.2;
    for (const rx of [-R * 0.5, 0, R * 0.5]) {
      ctx.beginPath();
      ctx.moveTo(0, -HL);
      ctx.lineTo(rx, -HL + R * 0.87);
      ctx.stroke();
    }
    ctx.restore();

    // Body
    ctx.strokeStyle = wet > 12 ? '#7dd3fc' : '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    // torso
    ctx.beginPath();
    ctx.moveTo(bodyX, bodyY - 16);
    ctx.lineTo(bodyX, bodyY + 6);
    ctx.stroke();
    // head
    ctx.fillStyle = wet > 12 ? '#7dd3fc' : '#e2e8f0';
    ctx.beginPath();
    ctx.arc(bodyX, bodyY - 22, 6.5, 0, Math.PI * 2);
    ctx.fill();
    // arms
    ctx.beginPath();
    ctx.moveTo(bodyX, bodyY - 10);
    ctx.lineTo(bodyX + 9, bodyY - 3);
    ctx.moveTo(bodyX, bodyY - 10);
    ctx.lineTo(bodyX - 9, bodyY - 3 + Math.sin(runCycle) * 3);
    ctx.stroke();
    // legs (run cycle)
    const legSwing = Math.sin(runCycle) * 8;
    ctx.beginPath();
    ctx.moveTo(bodyX, bodyY + 6);
    ctx.lineTo(bodyX + legSwing, bodyY + 20);
    ctx.moveTo(bodyX, bodyY + 6);
    ctx.lineTo(bodyX - legSwing, bodyY + 20);
    ctx.stroke();
  }

  function drawVectorDiagram(ctx, g, p) {
    const w = 150;
    const h = 108;
    const x = g.W - w - 10;
    const y = g.H - h - 10;
    ctx.save();
    ctx.fillStyle = 'rgba(7, 11, 19, 0.82)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    rr(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    const ox = x + w * 0.55;
    const oy = y + 22;
    const k2 = 3.1;
    ctx.font = '600 9px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'left';

    // V_rain (downwards, cyan)
    drawMiniArrow(ctx, ox, oy, 0, V_RAIN * k2, '#67e8f9', 'V_rain');
    // V_person (east, green)
    drawMiniArrow(ctx, ox, oy, p.vPerson * k2, 0, '#39ff88', 'V_person');
    // V_wind (west, violet)
    drawMiniArrow(ctx, ox, oy, V_WIND * k2, 0, '#a78bfa', 'V_wind');
    // V_apparent (relative rain, amber)
    const ap = apparentVelocity(p.vPerson);
    drawMiniArrow(ctx, ox, oy, ap.vx * k2, ap.vy * k2, '#fbbf24', 'V_app');

    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.fillText(`|V_app| = ${ap.speed.toFixed(1)} m/s`, x + 8, y + h - 8);
    ctx.restore();
  }

  function drawMiniArrow(ctx, x0, y0, dx, dy, color, label) {
    const len = Math.hypot(dx, dy);
    if (len < 2) return;
    const ang = Math.atan2(dy, dx);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + dx, y0 + dy);
    ctx.stroke();
    ctx.save();
    ctx.translate(x0 + dx, y0 + dy);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-6, 3);
    ctx.lineTo(-6, -3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillText(label, x0 + dx + (dx >= 0 ? 4 : -30), y0 + dy + 3);
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }



  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded-2xl border border-sky-400/20 bg-[#070b13] shadow-aura-cyan"
      style={{ aspectRatio: '16 / 10' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}




