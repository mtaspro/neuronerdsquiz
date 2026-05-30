import { motion } from 'framer-motion';

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

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  asMotion = true,
  type = 'button',
  disabled,
  onClick,
  ...props
}) {
  const classes = `${variants[variant] || variants.primary} ${sizes[size] || ''} ${className}`.trim();

  if (asMotion && !disabled) {
    return (
      <motion.button
        type={type}
        className={classes}
        disabled={disabled}
        onClick={onClick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
