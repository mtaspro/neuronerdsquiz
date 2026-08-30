import { useEffect, useRef } from 'react';

/**
 * Lightweight "multiverse" node/vector particle field rendered on a single
 * <canvas>. Built for mid-range Android:
 *  - devicePixelRatio clamped to 2, particle count reduced on touch devices
 *  - animation loop fully stops (no scheduling) when scrolled off-screen or
 *    when the tab is hidden — frees GPU/battery
 *  - pointer/touch attracts nodes + spawns a couple of ephemeral follower nodes
 *  - prefers-reduced-motion renders one static frame only
 */
export default function CanvasParticleField({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    let rafId = 0;
    let w = 0;
    let h = 0;
    let particles = [];
    let visible = true;
    let running = true;
    const pointer = { x: -9999, y: -9999, active: false };

    const isTouch =
      (navigator.maxTouchPoints || 0) > 0 || window.matchMedia('(max-width: 767px)').matches;
    const COUNT = isTouch ? 22 : 42;
    const LINK = isTouch ? 90 : 130;
    const LINK_SQ = LINK * LINK;
    const POINTER_SQ = 160 * 160;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width || window.innerWidth);
      h = Math.max(1, rect.height || window.innerHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (nearPointer) => {
      const jitter = (v) => v + (Math.random() - 0.5) * 80;
      const base =
        nearPointer && pointer.active
          ? { x: jitter(pointer.x), y: jitter(pointer.y) }
          : { x: Math.random() * w, y: Math.random() * h };
      return {
        x: base.x,
        y: base.y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.7 + 0.7,
        rgb: Math.random() > 0.5 ? '0,245,255' : '168,85,247',
      };
    };

    const init = () => {
      particles = Array.from({ length: COUNT }, () => spawn(false));
    };

    const onPointer = (e) => {
      const cx = e.clientX ?? e.touches?.[0]?.clientX;
      const cy = e.clientY ?? e.touches?.[0]?.clientY;
      if (cx == null || cy == null) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = cx - rect.left;
      pointer.y = cy - rect.top;
      pointer.active = true;
      if (particles.length < COUNT + 12) particles.push(spawn(true));
    };
const step = () => {
      if (pointer.active) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > 0 && d2 < POINTER_SQ) {
            const d = Math.sqrt(d2);
            const force = ((160 - d) / 160) * 0.02;
            p.vx += (dx / d) * force;
            p.vy += (dy / d) * force;
          }
        }
      }
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > w) { p.x = w; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > h) { p.y = h; p.vy *= -1; }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const n = particles.length;
      // Link lines between close nodes
      for (let i = 0; i < n; i++) {
        const a = particles[i];
        for (let j = i + 1; j < n; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_SQ) {
            const alpha = (1 - d2 / LINK_SQ) * 0.22;
            ctx.strokeStyle = `rgba(0,245,255,${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      // Nodes
      for (let i = 0; i < n; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.rgb},0.7)`;
        ctx.fill();
      }
    };

    const renderLoop = () => {
      rafId = requestAnimationFrame(renderLoop);
      step();
      draw();
    };

    const start = () => {
      if (!rafId && running && !reduceMotion) rafId = requestAnimationFrame(renderLoop);
    };

    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
        if (!reduceMotion) ctx.clearRect(0, 0, w, h);
      }
    };

    // Pause the whole loop when the field scrolls off-screen.
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        running = visible && !document.hidden;
        if (running) start();
        else stop();
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    const onVis = () => {
      running = visible && !document.hidden;
      if (running) start();
      else stop();
    };
    document.addEventListener('visibilitychange', onVis);

    resize();
    init();
    if (reduceMotion) {
      draw(); // still show a static aeon frame for users who opt out of motion
    } else {
      start();
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('touchmove', onPointer, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchmove', onPointer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div className={`absolute inset-0 ${className}`}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}