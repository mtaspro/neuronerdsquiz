import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const KINETIC_EASE = [0.16, 1, 0.3, 1];
const ENTRY_DURATION = 0.24;
const EXIT_DURATION = 0.16;
const STAGGER_DELAY = 0.025;

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ENTRY_DURATION,
      ease: KINETIC_EASE,
      staggerChildren: STAGGER_DELAY,
      delayChildren: 0.02
    }
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: {
      duration: EXIT_DURATION,
      ease: KINETIC_EASE
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ENTRY_DURATION,
      ease: KINETIC_EASE
    }
  },
  exit: {
    opacity: 0,
    y: 16,
    transition: {
      duration: EXIT_DURATION,
      ease: KINETIC_EASE
    }
  }
};

const PageTransition = ({ children, className = '' }) => {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`min-h-screen ${className}`}
    >
      <motion.div variants={itemVariants}>
        {children}
      </motion.div>
    </motion.div>
  );
};

export default PageTransition;