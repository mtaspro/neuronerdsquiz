import { useEffect } from 'react';

/**
 * Smoothly maps DeviceOrientation (phone tilt) onto two CSS custom properties
 * (--gyro-x / --gyro-y, in px) which descendants use to shift background layers.
 * Values are eased in a single rAF loop and written straight to the DOM — no
 * per-event React re-renders — so mobile stays at a buttery 60fps.
 * iOS 13+ blocks the sensor until a user-gesture permission request, handled below.
 */
export function useGyroscopeParallax(ref, maxX = 12, maxY = 10, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    const el = ref.current;
    if (!el) return undefined;

    let rafId = 0;
    let registered = false;
    let target = { x: 0, y: 0 };
    let smoothed = { x: 0, y: 0 };

    const apply = () => {
      el.style.setProperty('--gyro-x', smoothed.x.toFixed(2));
      el.style.setProperty('--gyro-y', smoothed.y.toFixed(2));
    };

    const loop = () => {
      smoothed.x += (target.x - smoothed.x) * 0.09;
      smoothed.y += (target.y - smoothed.y) * 0.09;
      if (Math.abs(target.x - smoothed.x) < 0.01) smoothed.x = target.x;
      if (Math.abs(target.y - smoothed.y) < 0.01) smoothed.y = target.y;
      apply();
      rafId = requestAnimationFrame(loop);
    };

    const onOrient = (e) => {
      const beta = e.beta ?? 0;   // front-to-back (-180..180)
      const gamma = e.gamma ?? 0; // left-to-right (-90..90)
      const x = -gamma / 30;
      const y = (beta - 45) / 45; // ~45° is portrait-resting
      target.x = Math.max(-1, Math.min(1, x)) * maxX;
      target.y = Math.max(-1, Math.min(1, y)) * maxY;
    };

    const register = () => {
      if (registered) return;
      const DOE = window.DeviceOrientationEvent;
      if (typeof DOE === 'undefined') return;
      if (typeof DOE.requestPermission === 'function') {
        DOE.requestPermission()
          .then((state) => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', onOrient, { passive: true });
              registered = true;
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener('deviceorientation', onOrient, { passive: true });
        registered = true;
      }
    };

    const onFirstGesture = () => {
      register();
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('touchstart', onFirstGesture);
    };

    // Android / desktop: attach immediately. iOS: first gesture grants permission.
    register();
    window.addEventListener('pointerdown', onFirstGesture);
    window.addEventListener('touchstart', onFirstGesture);

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('deviceorientation', onOrient);
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('touchstart', onFirstGesture);
    };
  }, [ref, enabled, maxX, maxY]);
}