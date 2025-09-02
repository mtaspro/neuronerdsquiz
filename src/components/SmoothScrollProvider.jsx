import React, { createContext, useContext } from 'react';
import { useSmoothScroll } from '../hooks/useSmoothScroll';

/**
 * Smooth Scroll Context Provider
 * Provides Lenis instance to child components for scroll control
 */
const SmoothScrollContext = createContext(null);

export const useLenis = () => useContext(SmoothScrollContext);

export const SmoothScrollProvider = ({ children }) => {
  const lenis = useSmoothScroll();

  return (
    <SmoothScrollContext.Provider value={lenis}>
      {children}
    </SmoothScrollContext.Provider>
  );
};