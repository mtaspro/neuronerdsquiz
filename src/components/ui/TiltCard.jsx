import { useRef } from 'react';

// Lightweight 3D tilt card with cursor/touch-tracking edge spotlight.
// Writes straight to CSS vars (--rx/--ry/--spot-*) — no React re-renders.
export default function TiltCard({ children, className = '' }) {
  const ref = useRef(null);

  const apply = (clientX, clientY) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
    el.style.setProperty('--spot-x', `${px}px`);
    el.style.setProperty('--spot-y', `${py}px`);
    el.style.setProperty('--rx', `${((py / r.height) - 0.5) * -8}deg`);
    el.style.setProperty('--ry', `${((px / r.width) - 0.5) * 8}deg`);
  };

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    el.classList.add('is-tilting');
    const cx = e.clientX != null ? e.clientX : e.touches?.[0]?.clientX;
    const cy = e.clientY != null ? e.clientY : e.touches?.[0]?.clientY;
    if (cx != null && cy != null) apply(cx, cy);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('is-tilting');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={ref}
      className={`aura-tilt-card relative h-full w-full ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onTouchMove={onMove}
      onTouchEnd={onLeave}
    >
      {children}
      <span className="aura-card-spot" aria-hidden="true" />
    </div>
  );
}