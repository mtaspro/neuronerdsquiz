import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * Parallax Element Component
 * Creates smooth parallax effects for backgrounds and elements
 */
const ParallaxElement = ({ 
  children, 
  speed = 0.5,     // Parallax speed (0-1, lower = slower)
  direction = 'y', // Direction: 'y', 'x', or 'both'
  className = '',
  style = {}
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  // Transform values based on direction
  const transforms = {
    y: useTransform(scrollYProgress, [0, 1], [0, -200 * speed]),
    x: useTransform(scrollYProgress, [0, 1], [0, -100 * speed]),
    both: {
      y: useTransform(scrollYProgress, [0, 1], [0, -200 * speed]),
      x: useTransform(scrollYProgress, [0, 1], [0, -100 * speed])
    }
  };

  const getTransform = () => {
    switch (direction) {
      case 'x': return { x: transforms.x };
      case 'both': return transforms.both;
      default: return { y: transforms.y };
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        ...style,
        ...getTransform()
      }}
    >
      {children}
    </motion.div>
  );
};

export default ParallaxElement;