import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * Custom hook for smooth scrolling with Lenis
 * Provides inertia, momentum, and parallax effects
 */
export const useSmoothScroll = (options = {}) => {
  const lenisRef = useRef(null);

  useEffect(() => {
    // Initialize Lenis with optimized settings
    lenisRef.current = new Lenis({
      duration: 1.2,        // Scroll duration (higher = smoother)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing
      direction: 'vertical', // Scroll direction
      gestureDirection: 'vertical', // Gesture direction
      smooth: true,         // Enable smooth scrolling
      mouseMultiplier: 1,   // Mouse wheel sensitivity
      smoothTouch: false,   // Disable on touch devices for better performance
      touchMultiplier: 2,   // Touch sensitivity
      infinite: false,      // Disable infinite scroll
      ...options
    });

    // Animation loop for smooth scrolling
    const raf = (time) => {
      lenisRef.current?.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Cleanup
    return () => {
      lenisRef.current?.destroy();
    };
  }, []);

  return lenisRef.current;
};