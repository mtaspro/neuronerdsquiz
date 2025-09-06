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
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
      // Prevent smooth scrolling on specific elements
      prevent: (node) => {
        return node.closest('.modal') || 
               node.closest('.dialog') || 
               node.closest('[role="dialog"]') ||
               node.closest('.overflow-y-auto') ||
               node.closest('.overflow-auto') ||
               node.hasAttribute('data-lenis-prevent');
      },
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