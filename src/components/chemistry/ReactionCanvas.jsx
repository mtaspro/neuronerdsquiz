import React, { useEffect, useRef } from 'react';

/**
 * ReactionCanvas — test-tube animation driven by a rule's `visual` type.
 * visuals: 'color-fade' | 'silver-mirror' | 'precipitate' | 'bubbles' | 'smoke' | 'none'
 */
export default function ReactionCanvas({ result, running }) {
  const wrap = useRef(null);
  const cv = useRef(null);
  const S = useRef({ t: 0, p: 0 }); // t=clock, p=reaction progress 0→1

  useEffect(() => {
    if (running) { S.current.p = 0; }
  }, [running, result]);

  useEffect(() => {
    const c = cv.current; const w = wrap.current;
    if (!c || !w) return undefined;
    const ctx = c.getContext('2d');
    let raf = 0; let last = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      c.width = w.clientWidth * dpr; c.height = w.clientHeight * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(w);

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      S.current.t += dt;
      if (running && S.current.p < 1) S.current.p = Math.min(1, S.current.p + dt / 2.5);
      draw(ctx, c.width / dpr, c.height / dpr, dpr);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, result]);

  function draw(ctx, W, H, dpr) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // bench
    ctx.fillStyle = '#070b13'; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, ty = H * 0.18, tw = 60, th = H * 0.62;

    // liquid color: reagent base → result color
    const p = S.current.p;
    const baseCol = result ? result.color : '#334155';
    const liquidH = th * 0.55;
    const ly = ty + th - liquidH;

    // tube glass
    ctx.strokeStyle = 'rgba(148,163,184,.5)'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - tw / 2, ty);
    ctx.lineTo(cx - tw / 2, ty + th - 15);
    ctx.quadraticCurveTo(cx - tw / 2, ty + th, cx, ty + th);
    ctx.quadraticCurveTo(cx + tw / 2, ty + th, cx + tw / 2, ty + th - 15);
    ctx.lineTo(cx + tw / 2, ty);
    ctx.stroke();

    // liquid
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - tw / 2 + 4, ly);
    ctx.lineTo(cx - tw / 2 + 4, ty + th - 15);
    ctx.quadraticCurveTo(cx - tw / 2 + 4, ty + th - 4, cx, ty + th - 4);
    ctx.quadraticCurveTo(cx + tw / 2 - 4, ty + th - 4, cx + tw / 2 - 4, ty + th - 15);
    ctx.lineTo(cx + tw / 2 - 4, ly);
    ctx.closePath(); ctx.clip();

    ctx.fillStyle = running || p > 0 ? baseCol : '#1e293b';
    ctx.globalAlpha = result?.visual === 'color-fade' ? 1 - 0.85 * p : 0.9;
    ctx.fillRect(cx - tw / 2, ly, tw, liquidH + 20);
    ctx.globalAlpha = 1;

    const t = S.current.t;
    const v = result?.visual;

    if (v === 'bubbles' && p > 0.1) {
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      for (let i = 0; i < 14; i++) {
        const bx = cx - tw / 2 + 8 + ((i * 37 + t * 40) % (tw - 16));
        const by = ty + th - 8 - ((t * (30 + i * 7)) % liquidH);
        ctx.beginPath(); ctx.arc(bx, by, 1.5 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
    }
    if (v === 'precipitate' && p > 0.2) {
      ctx.fillStyle = baseCol;
      for (let i = 0; i < 26; i++) {
        const px = cx - tw / 2 + 6 + ((i * 23) % (tw - 12));
        const py = ty + th - 6 - Math.min(liquidH * p, (i * 9) % liquidH) * (0.3 + 0.7 * p);
        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 0.4; ctx.fillRect(cx - tw / 2 + 4, ty + th - 12, tw - 8, 8); ctx.globalAlpha = 1;
    }
    if (v === 'silver-mirror' && p > 0.15) {
      const g = ctx.createLinearGradient(cx - tw / 2, 0, cx + tw / 2, 0);
      g.addColorStop(0, 'rgba(226,232,240,' + 0.9 * p + ')');
      g.addColorStop(1, 'rgba(148,163,184,' + 0.5 * p + ')');
      ctx.fillStyle = g;
      ctx.fillRect(cx - tw / 2 + 3, ly, 5, liquidH);
      ctx.fillRect(cx + tw / 2 - 8, ly, 5, liquidH);
    }
    if (v === 'smoke' && p > 0.1) {
      ctx.fillStyle = 'rgba(148,163,184,' + 0.5 * p + ')';
      for (let i = 0; i < 6; i++) {
        const sy = ty - ((t * 25 + i * 20) % (H * 0.14));
        const sx = cx + Math.sin(t * 2 + i) * 10;
        ctx.beginPath(); ctx.arc(sx, sy, 5 + i, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();

    // labels
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 12px "Space Grotesk",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(result ? result.product : 'select reactant + reagent', cx, ty + th + 24);
  }

  return (
    <div ref={wrap} className="relative w-full overflow-hidden rounded-2xl border border-emerald-400/20 bg-[#070b13]" style={{ aspectRatio: '16/10' }}>
      <canvas ref={cv} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
