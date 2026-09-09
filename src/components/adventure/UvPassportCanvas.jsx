import React, { useEffect, useRef } from 'react';

/**
 * UvPassportCanvas
 * ----------------
 * Interactive UV-lamp passport inspection deck for HSC Aura Adventure Mode
 * (Chemistry · Qualitative Analysis · Level 1 — Passport Verification).
 *
 * Fluorescence model: the hidden security thread (HSC Aura Crest) is coated
 * with a fluorescent dye that only luminesces under high-intensity UV-A:
 *   - Reveal condition: 355 nm <= wavelength <= 375 nm AND intensity > 60%
 *   - Inside UV-A (315–400 nm) but off-target → faint/partial glow
 *   - UV-B / UV-C (< 315 nm) → hazard glow + "Harmful Radiation" badge
 *
 * `onVerify({ success, accuracy, feedback })` fires once per scan, after the
 * scan sweep animation settles.
 */

const SCAN_DURATION_S = 1.8;    // real seconds for the sweep pass
const RESULT_PAUSE_S = 1.2;     // real seconds before onVerify fires

const C = {
  table: '#070b13',
  tableEdge: '#101827',
  grid: 'rgba(56, 189, 248, 0.05)',
  lampBody: '#1e293b',
  lampTrim: '#38bdf8',
  doc: '#e8e4d8',
  docShade: '#cfc9b8',
  docLine: 'rgba(30, 41, 59, 0.55)',
  docPhoto: '#8fa3b8',
  text: '#cbd5e1',
  ok: '#39ff88',
  bad: '#f87171',
  warn: '#fbbf24',
};

/** Interpolate an approximate visible color for a given wavelength (nm). */
const WL_STOPS = [
  [200, 96, 30, 190],
  [280, 124, 44, 214],
  [315, 142, 74, 235],
  [365, 158, 128, 255],
  [400, 168, 64, 255],
  [450, 70, 90, 255],
  [500, 0, 205, 180],
  [570, 96, 225, 70],
  [620, 250, 178, 44],
  [700, 255, 64, 52],
];

function wavelengthRGB(nm) {
  const w = Math.max(200, Math.min(700, nm));
  for (let i = 0; i < WL_STOPS.length - 1; i++) {
    const [w0, r0, g0, b0] = WL_STOPS[i];
    const [w1, r1, g1, b1] = WL_STOPS[i + 1];
    if (w >= w0 && w <= w1) {
      const t = (w - w0) / (w1 - w0);
      return [r0 + (r1 - r0) * t, g0 + (g1 - g0) * t, b0 + (b1 - b0) * t];
    }
  }
  return WL_STOPS[WL_STOPS.length - 1].slice(1);
}

const rgba = ([r, g, b], a) => `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a})`;
const round2 = (n) => Math.round(n * 100) / 100;

/** Rounded-rect path helper (works without ctx.roundRect support). */
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function UvPassportCanvas({
  wavelength = 365,
  intensity = 100,
  isScanning = false,
  onVerify = () => {},
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  // Latest props for the rAF loop (loop never re-subscribes on prop change).
  const P = useRef({ wavelength, intensity, onVerify });
  P.current = { wavelength, intensity, onVerify };

  // Mutable simulation state, kept out of React renders.
  const S = useRef(null);
  const getSim = () => {
    if (!S.current) {
      S.current = {
        phase: 'idle', // idle | scanning | success | done
        w: 0, h: 0,
        t: 0, scanT: 0, phaseT: 0,
        glow: 0, lampFlicker: 0,
        motes: [], fired: false, result: null,
      };
    }
    return S.current;
  };

  const glowTarget = () => {
    const p = P.current;
    const w = p.wavelength;
    const it = p.intensity;
    if (w >= 355 && w <= 375 && it > 60) return 1; // full fluorescent reveal
    if (w >= 315 && w <= 400 && it > 20) {
      // faint partial glow inside UV-A, scaled by proximity to 365 nm
      return Math.max(0, 1 - Math.abs(w - 365) / 25) * 0.22 * (it / 100);
    }
    return 0;
  };

  const startScan = () => {
    const s = getSim();
    s.phase = 'scanning';
    s.scanT = 0;
    s.phaseT = 0;
    s.motes = [];
    s.fired = false;
    s.result = null;
  };

  // Begin scanning whenever the parent flips isScanning on (covers
  // remount-with-key flows too).
  useEffect(() => {
    if (isScanning) startScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

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

function dims() {
  const s = getSim();
  const wrap = wrapRef.current;
  if (wrap) {
    s.w = wrap.clientWidth;
    s.h = wrap.clientHeight;
  }
  return s;
}

/** Shared scene geometry (inspection table layout). */
function geo() {
  const s = dims();
  const W = s.w;
  const H = s.h;
  const docW = Math.min(W * 0.36, H * 0.52);
  const docH = H * 0.64;
  const docX = W / 2 - docW / 2;
  const docY = H * 0.28;
  const lampW = docW * 1.15;
  const lampH = H * 0.075;
  const lampY = H * 0.05;
  return { W, H, docX, docY, docW, docH, lampW, lampH, lampY, cx: W / 2 };
}

function step(dt) {
  const s = getSim();
  const p = P.current;
  s.t += dt;

  // Fluorescent glow eases toward its target (hidden / faint / full reveal).
  const target = glowTarget();
  s.glow += (target - s.glow) * Math.min(1, dt * 4);

  // Organic lamp flicker.
  s.lampFlicker = 0.92 + 0.05 * Math.sin(s.t * 23) + 0.03 * Math.sin(s.t * 47.3);

  if (s.phase === 'scanning') {
    s.scanT += dt;
    if (s.scanT >= SCAN_DURATION_S) {
      s.result = computeResult(p);
      s.phase = 'revealed';
      s.phaseT = 0;
      if (s.result.success) spawnMotes(s, 46);
    }
  } else if (s.phase === 'revealed') {
    s.phaseT += dt;
    if (s.phaseT >= RESULT_PAUSE_S && !s.fired) {
      s.fired = true;
      s.phase = 'done';
      P.current.onVerify(s.result);
    }
  } else if (s.phase === 'done' && s.glow > 0.45) {
    // Ambient fluorescent sparkle while the seal stays revealed.
    if (Math.random() < dt * 8) spawnMotes(s, 1);
  }

  stepMotes(s, dt);
}

function computeResult(p) {
  const w = p.wavelength;
  const it = p.intensity;
  const success = w >= 355 && w <= 375 && it > 60;
  const waveScore = Math.max(0, 1 - Math.abs(w - 365) / 30);
  const accuracy = Math.round(100 * Math.max(0, Math.min(1, waveScore * Math.max(0.25, it / 100))));
  let feedback;
  if (success) {
    feedback = `Fluorescent security seal revealed at ${w} nm — passport is GENUINE.`;
  } else if (w < 315) {
    feedback = 'UV-B/UV-C radiation is hazardous and cannot excite the dye. Switch to UV-A (315–400 nm).';
  } else if (w > 400) {
    feedback = 'Visible light cannot excite the fluorescent dye. Use UV-A (315–400 nm).';
  } else if (it <= 60) {
    feedback = 'The glow is too faint — raise the UV lamp power above 60%.';
  } else {
    feedback = `Close! Off by ${Math.round(Math.abs(w - 365))} nm — tune closer to 365 nm.`;
  }
  return { success, accuracy, feedback };
}

function spawnMotes(s, count) {
  const g = geo();
  for (let i = 0; i < count; i++) {
    s.motes.push({
      x: g.docX + Math.random() * g.docW,
      y: g.docY + g.docH * (0.2 + Math.random() * 0.7),
      vx: (Math.random() - 0.5) * 18,
      vy: -12 - Math.random() * 26,
      life: 1,
      decay: 0.35 + Math.random() * 0.55,
      r: 1 + Math.random() * 2.4,
      color: Math.random() < 0.5 ? '#39ff88' : '#67e8f9',
    });
  }
}

function stepMotes(s, dt) {
  for (const m of s.motes) {
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.life -= m.decay * dt;
  }
  s.motes = s.motes.filter((m) => m.life > 0);
}

function draw(ctx, dpr) {
  const s = getSim();
  const p = P.current;
  const g = geo();
  const { W, H } = g;
  if (!W || !H) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const rgb = wavelengthRGB(p.wavelength);
  const it = Math.max(0, Math.min(100, p.intensity)) / 100;
  const hazard = p.wavelength < 315 && p.intensity > 0;
  const lampOn = p.intensity > 0;

  // Inspection table with subtle tech grid
  const bg = ctx.createRadialGradient(W / 2, H * 0.45, 20, W / 2, H * 0.45, W * 0.75);
  bg.addColorStop(0, '#0d1526');
  bg.addColorStop(1, C.table);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 20; x < W; x += 44) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = 20; y < H; y += 44) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();

  // Lamp casing
  rr(ctx, g.cx - g.lampW / 2, g.lampY, g.lampW, g.lampH, 8);
  const lampGrad = ctx.createLinearGradient(0, g.lampY, 0, g.lampY + g.lampH);
  lampGrad.addColorStop(0, C.lampBody);
  lampGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = lampGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // LED strip on lamp
  ctx.fillStyle = lampOn ? rgba(rgb, 0.85 * s.lampFlicker) : 'rgba(100, 116, 139, 0.5)';
  rr(ctx, g.cx - g.lampW * 0.32, g.lampY + g.lampH - 5, g.lampW * 0.64, 3.5, 2);
  ctx.fill();
  // Lamp label
  ctx.fillStyle = C.text;
  ctx.font = '700 10px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`UV LAMP · ${Math.round(p.wavelength)} nm · ${Math.round(p.intensity)}%`, g.cx, g.lampY + g.lampH / 2 + 1);

  // UV beam cone
  if (lampOn) {
    const topY = g.lampY + g.lampH;
    const topHalf = g.lampW * 0.3;
    const botHalf = g.docW * 0.78;
    const botY = g.docY + g.docH + 8;
    ctx.beginPath();
    ctx.moveTo(g.cx - topHalf, topY);
    ctx.lineTo(g.cx + topHalf, topY);
    ctx.lineTo(g.cx + botHalf, botY);
    ctx.lineTo(g.cx - botHalf, botY);
    ctx.closePath();
    const beam = ctx.createLinearGradient(0, topY, 0, botY);
    const a = (0.12 + 0.5 * it) * s.lampFlicker;
    beam.addColorStop(0, rgba(rgb, a));
    beam.addColorStop(1, rgba(rgb, a * 0.12));
    ctx.fillStyle = beam;
    ctx.fill();
    // Light pool on the table
    ctx.fillStyle = rgba(rgb, a * 0.35);
    ctx.beginPath();
    ctx.ellipse(g.cx, botY, botHalf * 1.05, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Passport document
  drawDocument(ctx, g, p, s, rgb, it);

  // Scan sweep band
  if (s.phase === 'scanning') {
    const prog = Math.min(s.scanT / SCAN_DURATION_S, 1);
    const y = g.docY - 10 + prog * (g.docH + 20);
    ctx.save();
    ctx.shadowColor = rgba(rgb, 0.9);
    ctx.shadowBlur = 14;
    ctx.fillStyle = rgba(rgb, 0.85);
    ctx.fillRect(g.docX - 6, y, g.docW + 12, 2.5);
    ctx.fillStyle = rgba(rgb, 0.18);
    ctx.fillRect(g.docX - 6, y - 14, g.docW + 12, 14);
    ctx.restore();
    ctx.fillStyle = C.text;
    ctx.font = '700 11px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SCANNING… ${Math.round(prog * 100)}%`, g.cx, g.docY + g.docH + 24);
  }

  drawMotes(ctx, s);
  drawStatusLED(ctx, s, g);

  // Hazard overlay + badge (UV-B / UV-C)
  if (hazard) {
    ctx.fillStyle = `rgba(248, 60, 60, ${0.07 + 0.05 * Math.sin(s.t * 6)})`;
    ctx.fillRect(0, 0, W, H);
    drawHazardBadge(ctx, s, W);
  }

  // Result banner
  if ((s.phase === 'revealed' || s.phase === 'done') && s.result) {
    const a = Math.min(s.phaseT / 0.3, 1);
    ctx.save();
    ctx.globalAlpha = a * 0.95;
    ctx.font = '700 17px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = s.result.success ? C.ok : C.bad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.fillText(s.result.success ? '✔ GENUINE PASSPORT DETECTED' : '✖ VERIFICATION FAILED', g.cx, H * 0.185);
    ctx.restore();
  }
}

function drawDocument(ctx, g, p, s, rgb, it) {
  const { docX: x, docY: y, docW: w, docH: h } = g;

  // Page
  rr(ctx, x, y, w, h, 10);
  const page = ctx.createLinearGradient(x, y, x, y + h);
  page.addColorStop(0, C.doc);
  page.addColorStop(1, C.docShade);
  ctx.fillStyle = page;
  ctx.fill();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // UV-A violet wash on the paper when lit
  if (p.wavelength >= 315 && p.wavelength <= 400 && p.intensity > 0) {
    ctx.fillStyle = rgba(rgb, 0.14 * it);
    rr(ctx, x, y, w, h, 10);
    ctx.fill();
  }

  // Header
  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.font = '700 9px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PASSPORT · পাসপোর্ট', x + w / 2, y + 16);

  // Photo box with silhouette
  const phX = x + w * 0.1;
  const phY = y + h * 0.14;
  const phW = w * 0.34;
  const phH = h * 0.3;
  ctx.fillStyle = C.docPhoto;
  rr(ctx, phX, phY, phW, phH, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
  ctx.beginPath();
  ctx.arc(phX + phW / 2, phY + phH * 0.38, phW * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(phX + phW / 2, phY + phH * 0.85, phW * 0.3, phH * 0.28, 0, Math.PI, 0);
  ctx.fill();

  // Data lines
  ctx.fillStyle = C.docLine;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + w * 0.52, y + h * 0.16 + i * h * 0.07, w * 0.38 * (i % 2 ? 0.8 : 1), 2.5);
  }
  // MRZ block
  ctx.font = '700 8px monospace';
  ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
  ctx.textAlign = 'left';
  ctx.fillText('P<HSCAURA<<TRAVELER<<<<<<<<<<<<<<<<', x + 8, y + h - 16);
  ctx.fillText('C1234567<8HSC<<<<<<<<<<<7201154M30', x + 8, y + h - 7);

  // Fluorescent HSC Aura Crest (the secret security seal)
  if (s.glow > 0.01) drawCrest(ctx, g, s);

  // Success boundary effect
  if (s.glow > 0.85) {
    ctx.save();
    ctx.shadowColor = C.ok;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = rgba([57, 255, 136], 0.5 + 0.3 * Math.sin(s.t * 5));
    ctx.lineWidth = 2.5;
    rr(ctx, x - 5, y - 5, w + 10, h + 10, 13);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCrest(ctx, g, s) {
  const cx = g.docX + g.docW * 0.71;
  const cy = g.docY + g.docH * 0.3;
  const r = g.docW * 0.17;
  const pulse = 0.85 + 0.15 * Math.sin(s.t * 5);
  ctx.save();
  ctx.globalAlpha = s.glow * pulse;
  ctx.translate(cx, cy);
  ctx.shadowColor = C.ok;
  ctx.shadowBlur = 26 * s.glow;

  ctx.strokeStyle = C.ok;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Inner star (Aura Crest)
  ctx.fillStyle = '#67e8f9';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r * 0.55 : r * 0.24;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Orbiting motes on the dashed ring
  ctx.fillStyle = C.ok;
  for (let i = 0; i < 6; i++) {
    const a = s.t * 1.2 + (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 1.22, Math.sin(a) * r * 1.22, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHazardBadge(ctx, s, W) {
  const bw = 158;
  const bh = 42;
  const x = W - bw - 14;
  const y = 14;
  const a = 0.85 + 0.15 * Math.sin(s.t * 7);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(69, 10, 10, 0.92)';
  rr(ctx, x, y, bw, bh, 8);
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Warning triangle
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 9);
  ctx.lineTo(x + 31, y + 29);
  ctx.lineTo(x + 9, y + 29);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#450a0a';
  ctx.font = '700 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('!', x + 20, y + 26);
  ctx.fillStyle = '#fecaca';
  ctx.font = '700 9px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('HARMFUL RADIATION', x + 38, y + 18);
  ctx.fillStyle = 'rgba(254, 202, 202, 0.7)';
  ctx.fillText('UV-B / UV-C · DO NOT EXPOSE', x + 38, y + 31);
  ctx.restore();
}

function drawStatusLED(ctx, s, g) {
  let color = '#64748b';
  let label = 'STANDBY';
  if (s.phase === 'scanning') {
    color = C.warn;
    label = 'SCANNING…';
  } else if ((s.phase === 'revealed' || s.phase === 'done') && s.result) {
    color = s.result.success ? C.ok : C.bad;
    label = s.result.success ? 'PASS' : 'FAIL';
  }
  const x = 16;
  const y = g.H - 24;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = C.text;
  ctx.font = '700 10px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 12, y + 3.5);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
  ctx.textAlign = 'right';
  ctx.fillText(`ZONE: ${zoneFor(P.current.wavelength)}`, g.W - 16, y + 3.5);
}

function drawMotes(ctx, s) {
  for (const m of s.motes) {
    ctx.save();
    ctx.globalAlpha = Math.max(m.life, 0) * s.glow;
    ctx.shadowColor = m.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function zoneFor(nm) {
  if (nm < 280) return 'UV-C';
  if (nm < 315) return 'UV-B';
  if (nm <= 400) return 'UV-A';
  return 'VISIBLE';
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
