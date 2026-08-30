import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const variants = {
  primary: 'aura-btn aura-btn-primary aura-btn-shine',
  secondary: 'aura-btn aura-btn-secondary',
  ghost: 'aura-btn aura-btn-ghost',
  magenta: 'aura-btn aura-btn-magenta aura-btn-shine',
};

const sizes = {
  sm: 'aura-btn-sm',
  md: '',
  lg: 'aura-btn-lg',
};

/**
 * Sci-Fi HUD console button.
 * - `beam` adds an animated circulating conic-gradient "proton beam" border.
 * - `shockwave` fires a ripple burst that radiates from the tap point across the
 *   viewport (GPU-composited opacity + scale), triggered onPointerDown.
 * The ripple mount is intentionally short-lived and fully cleaned up on exit.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  asMotion = true,
  type = 'button',
  disabled,
  beam = false,
  shockwave = false,
  onClick,
  ...props
}) {
  const [ripple, setRipple] = useState(null);
  const classes = `${variants[variant] || variants.primary} ${sizes[size] || ''} ${className}`.trim();

  const triggerRipple = (e) => {
    if (!shockwave || disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX != null ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY != null ? e.clientY - rect.top : rect.height / 2;
    setRipple({ id: Date.now(), x, y });
  };

  const handleClick = (e) => {
    triggerRipple(e);
    onClick?.(e);
  };

  const renderRipple = () => (
    <AnimatePresence>
      {ripple && (
        <motion.span
          key={ripple.id}
          className="pointer-events-none fixed z-[20000] block rounded-full border-2 border-cyan-300/60"
          style={{
            left: 0,
            top: 0,
            width: 36,
            height: 36,
            translateX: ripple.x - 18,
            translateY: ripple.y - 18,
            boxShadow: '0 0 40px rgba(0,245,255,0.55), 0 0 120px rgba(0,245,255,0.35)',
          }}
          initial={{ opacity: 0.85, scale: 1 }}
          animate={{ opacity: 0, scale: 26 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          onAnimationComplete={() => setRipple(null)}
        />
      )}
    </AnimatePresence>
  );

  const inner = () => (
    <>
      {beam && <span className="aura-beam" aria-hidden="true" />}
      <span className="aura-btn-inner relative z-[1] inline-flex items-center justify-center gap-2">
        {children}
      </span>
      {renderRipple()}
    </>
  );

  if (asMotion && !disabled) {
    return (
      <motion.button
        type={type}
        className={classes}
        disabled={disabled}
        onClick={handleClick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        {...props}
      >
        {inner()}
      </motion.button>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={handleClick} {...props}>
      {inner()}
    </button>
  );
}
