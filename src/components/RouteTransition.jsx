import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const KINETIC_EASE = [0.16, 1, 0.3, 1];

const RouteTransition = ({ children }) => {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{
        duration: 0.2,
        ease: KINETIC_EASE
      }}
      className="flex-1 min-h-0"
    >
      {children}
    </motion.div>
  );
};

export default RouteTransition;