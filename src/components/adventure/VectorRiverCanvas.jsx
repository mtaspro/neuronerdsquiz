import React, { useEffect, useRef } from 'react';

/**
 * VectorRiverCanvas
 * -----------------
 * Interactive 2D river-crossing physics simulation for HSC Aura Adventure
 * Mode (Chapter 2 — Vectors, Level 1).
 *
 * Physics (world coords in meters; +x = downstream, +y = across the river):
 *   Vx = u + v * cos(alpha)
 *   Vy = v * sin(alpha)
 * where `alpha` is the student's steering angle in degrees
 * (0° = aimed downstream, 90° = straight across, > 90° = angled upstream).
 *
 * A run ends when the boat reaches the far bank (y >= d):
 *   - lands within `targetZoneMeters` of `targetX` → success + particles
 *   - lands outside the zone                       → capsizes (fail)
 *   - drifts out of the scene / never crosses      → swept away (fail)
 *
 * `onComplete({ success, calculatedTime, deviation, landingX })` fires once
 * per run, after the victory/fail animation settles.
 */

const SIM_SPEED = 4;          // world-seconds advanced per real second
const LAND_TIMEOUT_S = 120;   // fail-safe for boats that never cross
const BANK_H = 30;            // bank thickness in px
const RESULT_PAUSE_S = 1.5;   // real seconds before onComplete fires

const C = {
  skyTop: '#16233f',
  skyBot: '#2c4a74',
  waterHi: '#175a80',
  waterLo: '#0a2c49',
  current: 'rgba(140, 214, 235, 0.45)',
  bank: '#2d6a3f',
  bankDark: '#1c4527',
  bankEdge: '#4f9a5e',
  pole: '#efe6cf',
  flag: '#ffd166',
  zoneOk: 'rgba(34, 197, 94, 0.4)',
  zoneNeutral: 'rgba(34, 197, 94, 0.16)',
  zoneBad: 'rgba(239, 68, 68, 0.35)',
  hull: '#c2703d',
  hullDark: '#7c4222',
  sail: '#f6edd8',
  foam: 'rgba(226, 244, 255, 0.85)',
  vector: 'rgba(0, 245, 255, 0.9)',
  text: '#dbeaf6',
};

const round2 = (n) => Math.round(n * 100) / 100;

export default function VectorRiverCanvas({
  u = 3,
  v = 4,
  d = 60,
  targetX = 15,
  angleAlpha = 90,
  isSimulating = false,
  targetZoneMeters = 6,
  onComplete = () => {},
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  // Latest props for the rAF loop (loop is never re-subscribed on prop change).
  const P = useRef({ u, v, d, targetX, angleAlpha, targetZoneMeters, onComplete });
  P.current = { u, v, d, targetX, angleAlpha, targetZoneMeters, onComplete };

  // Mutable simulation state, kept out of React renders.
  const S = useRef(null);
  const getSim = () => {
    if (!S.current) {
      S.current = {
        phase: 'idle', // idle | sailing | success | sinking | failed | done
        w: 0, h: 0, scale: 1, worldW: 100,
        riverTop: BANK_H, riverBot: 0,
        t: 0, simTime: 0, x: 0, y: 0, phaseT: 0,
        particles: [], fired: false, result: null,
      };
    }
    return S.current;
  };

  const layout = () => {
    const s = getSim();
    const wrap = wrapRef.current;
    if (!wrap) return;
    s.w = wrap.clientWidth;
    s.h = wrap.clientHeight;
    s.riverTop = BANK_H;
    s.riverBot = s.h - BANK_H;
    s.scale = Math.max(1, (s.h - BANK_H * 2) / P.current.d); // px per meter
    s.worldW = s.w / s.scale;
    if (s.phase === 'idle') s.x = s.worldW * 0.18;
  };

  const resetRun = () => {
    const s = getSim();
    layout();
    s.phase = 'sailing';
    s.simTime = 0;
    s.phaseT = 0;
    s.particles = [];
    s.fired = false;
    s.result = null;
    s.x = s.worldW * 0.18;
    s.y = 0;
  };

  // Start the simulation whenever the parent flips isSimulating on
  // (also covers remount-with-key flows: mount with isSimulating = true).
  useEffect(() => {
    if (isSimulating) resetRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating]);

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
      layout();
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

  if (s.phase === 'sailing') {
    const rad = (p.angleAlpha * Math.PI) / 180;
    const vx = p.u + p.v * Math.cos(rad);
    const vy = p.v * Math.sin(rad);
    const wdt = dt * SIM_SPEED;
    s.simTime += wdt;
    s.x += vx * wdt;
    s.y += vy * wdt;

    if (s.y >= p.d) {
      // Boat reached the far bank — judge the landing.
      s.y = p.d;
      const deviation = round2(Math.abs(s.x - p.targetX));
      s.result = {
        success: deviation <= p.targetZoneMeters,
        calculatedTime: round2(s.simTime),
        deviation,
        landingX: round2(s.x),
      };
      if (s.result.success) {
        s.phase = 'success';
      } else {
        s.phase = 'sinking';
      }
      spawnParticles(s, s.result.success);
      s.phaseT = 0;
    } else if (s.x < -5 || s.x > s.worldW + 5 || s.simTime > LAND_TIMEOUT_S) {
      // Drifted out of the scene or never crossed in reasonable time.
      s.result = { success: false, calculatedTime: round2(s.simTime), deviation: null, landingX: null };
      s.phase = 'failed';
      s.phaseT = 0;
    }
  } else if (s.phase === 'success' || s.phase === 'sinking' || s.phase === 'failed') {
    s.phaseT += dt;
    stepParticles(s, dt);
    if (s.phaseT >= RESULT_PAUSE_S && !s.fired) {
      s.fired = true;
      s.phase = 'done';
      P.current.onComplete(s.result);
    }
  }
}

function spawnParticles(s, victory) {
  const bx = s.x * s.scale;
  const by = s.riverBot - s.y * s.scale;
  const count = victory ? 90 : 40;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 190;
    s.particles.push({
      x: bx,
      y: by,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 70,
      life: 1,
      decay: 0.7 + Math.random() * 0.9,
      r: 1.5 + Math.random() * 3,
      color: victory ? (Math.random() < 0.5 ? '#22c55e' : '#ffd166') : '#9fb6c6',
    });
  }
}

function stepParticles(s, dt) {
  for (const q of s.particles) {
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.vy += 230 * dt; // gravity pull
    q.life -= q.decay * dt;
  }
  s.particles = s.particles.filter((q) => q.life > 0);
}

function draw(ctx, dpr) {
  const s = getSim();
  const p = P.current;
  const W = s.w;
  const H = s.h;
  if (!W || !H) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const riverTop = s.riverTop;
  const riverBot = s.riverBot;
  const toX = (m) => m * s.scale;
  const toY = (m) => riverBot - m * s.scale;

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, riverTop);
  sky.addColorStop(0, C.skyTop);
  sky.addColorStop(1, C.skyBot);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, riverTop);

  // Water
  const water = ctx.createLinearGradient(0, riverTop, 0, riverBot);
  water.addColorStop(0, C.waterHi);
  water.addColorStop(1, C.waterLo);
  ctx.fillStyle = water;
  ctx.fillRect(0, riverTop, W, riverBot - riverTop);

  drawCurrent(ctx, s, p, riverTop, riverBot, W);

  // Far bank (top) + target landing zone
  ctx.fillStyle = C.bank;
  ctx.fillRect(0, 0, W, riverTop);
  ctx.fillStyle = C.bankEdge;
  ctx.fillRect(0, riverTop - 3, W, 3);
  const zx = toX(p.targetX - p.targetZoneMeters);
  const zw = toX(p.targetZoneMeters * 2);
  ctx.fillStyle =
    s.phase === 'success' ? C.zoneOk
      : (s.phase === 'sinking' || s.phase === 'failed') ? C.zoneBad
        : C.zoneNeutral;
  ctx.fillRect(zx, 0, zw, riverTop);
  ctx.fillStyle = '#e5e7eb';
  for (const m of [p.targetX - p.targetZoneMeters, p.targetX + p.targetZoneMeters]) {
    ctx.fillRect(toX(m) - 1, 4, 2, riverTop - 6);
  }
  drawFlag(ctx, toX(p.targetX), riverTop, s.t);

  // Near bank (bottom)
  ctx.fillStyle = C.bankDark;
  ctx.fillRect(0, riverBot, W, H - riverBot);
  ctx.fillStyle = C.bankEdge;
  ctx.fillRect(0, riverBot, W, 3);

  // HUD
  drawCurrentArrow(ctx, p, riverBot - 20);
  ctx.fillStyle = C.text;
  ctx.font = '600 12px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`α = ${p.angleAlpha}°`, W - 10, riverTop + 16);

  drawBoat(ctx, s, p, toX, toY);

  // Particles
  for (const q of s.particles) {
    ctx.globalAlpha = Math.max(q.life, 0);
    ctx.fillStyle = q.color;
    ctx.beginPath();
    ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Outcome overlays
  if (s.phase === 'success') overlay(ctx, W, H, 'Landed safely!', '#4ade80', s.phaseT);
  else if (s.phase === 'sinking') overlay(ctx, W, H, 'Capsized!', '#f87171', s.phaseT);
  else if (s.phase === 'failed') overlay(ctx, W, H, 'Swept downriver!', '#f87171', s.phaseT);
}

  function drawCurrent(ctx, s, p, riverTop, riverBot, W) {
    const riverH = riverBot - riverTop;
    const rows = Math.max(4, Math.floor(riverH / 32));
    const speed = Math.max(p.u, 0.5);
    const offset = (s.t * speed * 24) % 96;
    ctx.strokeStyle = C.current;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let r = 0; r < rows; r++) {
      const y = riverTop + ((r + 0.5) / rows) * riverH;
      const wig = Math.sin(s.t * 1.6 + r * 1.9) * 3;
      for (let x = -96; x < W + 96; x += 96) {
        const dx = x + offset;
        ctx.beginPath();
        ctx.moveTo(dx, y + wig);
        ctx.quadraticCurveTo(dx + 24, y + wig - 5, dx + 48, y + wig);
        ctx.stroke();
      }
    }
  }

  function drawFlag(ctx, fx, riverTop, t) {
    const wave = Math.sin(t * 6) * 3;
    ctx.fillStyle = C.pole;
    ctx.fillRect(fx - 1.5, riverTop - 30, 3, 30);
    ctx.beginPath();
    ctx.moveTo(fx + 1.5, riverTop - 30);
    ctx.quadraticCurveTo(fx + 15, riverTop - 28 + wave, fx + 27, riverTop - 25 + wave * 0.6);
    ctx.lineTo(fx + 1.5, riverTop - 19);
    ctx.closePath();
    ctx.fillStyle = C.flag;
    ctx.fill();
  }

  function drawCurrentArrow(ctx, p, y) {
    const len = 26 + Math.max(p.u, 0) * 8;
    drawArrow(ctx, 14, y, len, 0, 'rgba(140, 214, 235, 0.8)');
    ctx.fillStyle = C.text;
    ctx.font = '600 11px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`current ${p.u} m/s`, 14, y - 10);
  }

  function drawBoat(ctx, s, p, toX, toY) {
    const rad = (p.angleAlpha * Math.PI) / 180;
    const vx = p.u + p.v * Math.cos(rad);
    const vy = p.v * Math.sin(rad);

    let wx = s.x;
    let wy = s.y;
    let sink = 0;
    let alpha = 1;
    let tilt = Math.atan2(-vy * s.scale, vx * s.scale); // canvas y grows downward

    if (s.phase === 'sinking') {
      sink = s.phaseT * 14;
      tilt += Math.min(s.phaseT * 1.1, 1.2);
      alpha = Math.max(1 - s.phaseT / RESULT_PAUSE_S, 0);
    }

    const bobbing = s.phase !== 'sailing';
    const bx = toX(wx);
    const by = toY(wy) + (bobbing ? Math.sin(s.t * 2.4) * 2 : 0) + sink;

    // Wake foam while under way
    if (s.phase === 'sailing') {
      ctx.save();
      ctx.fillStyle = C.foam;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(bx - 34 * Math.cos(tilt), by + 4, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(bx - 46 * Math.cos(tilt), by - 2, 7, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(bx, by);
    ctx.rotate(tilt);

    // Hull
    const hull = ctx.createLinearGradient(0, -11, 0, 11);
    hull.addColorStop(0, C.hull);
    hull.addColorStop(1, C.hullDark);
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.quadraticCurveTo(14, -10, -8, -10);
    ctx.lineTo(-22, -7);
    ctx.quadraticCurveTo(-28, 0, -22, 7);
    ctx.lineTo(-8, 10);
    ctx.quadraticCurveTo(14, 10, 28, 0);
    ctx.closePath();
    ctx.fillStyle = hull;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = C.hullDark;
    ctx.stroke();

    // Mast + sail
    ctx.fillStyle = '#8a5a34';
    ctx.fillRect(-3, -26, 3, 16);
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.quadraticCurveTo(15, -21, 4, -12);
    ctx.closePath();
    ctx.fillStyle = C.sail;
    ctx.fill();

    // Resultant velocity vector R
    if (s.phase === 'idle' || s.phase === 'sailing') {
      drawArrow(ctx, 0, 0, vx * s.scale * 0.35, -vy * s.scale * 0.35, C.vector);
      ctx.fillStyle = C.vector;
      ctx.font = '700 12px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('R', vx * s.scale * 0.35 + 6, -vy * s.scale * 0.35);
    }
    ctx.restore();
  }

  function drawArrow(ctx, x0, y0, dx, dy, color, lw = 2.5) {
    const len = Math.hypot(dx, dy);
    if (len < 6) return;
    const ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + dx, y0 + dy);
    ctx.stroke();
    ctx.translate(x0 + dx, y0 + dy);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-9, 5);
    ctx.lineTo(-9, -5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function overlay(ctx, w, h, text, color, t) {
    const a = Math.min(t / 0.35, 1);
    ctx.save();
    ctx.globalAlpha = a * 0.9;
    ctx.font = '700 20px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText(text, w / 2, h * 0.24);
    ctx.restore();
  }



  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#0a1a2f] shadow-aura-cyan"
      style={{ aspectRatio: '16 / 10' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
