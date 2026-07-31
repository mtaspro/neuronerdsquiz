import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/ui/PageShell';
import PageTransition from '../components/PageTransition';
import Button from '../components/ui/Button';
import { FaArrowLeft, FaCrown, FaTrophy, FaMedal, FaStar } from 'react-icons/fa';

const legends = [
  {
    name: 'Akhyar Fardin',
    role: 'Founding Visionary',
    avatar: '🧠',
    image: '', // paste CDN image link here, leave empty to use emoji fallback
    quote: '"HSCAura represents our vision of making learning competitive, engaging, and accessible to everyone. When friends compete in a healthy environment, they push each other to achieve greatness."',
    contributions: ['Strategic vision and roadmap', 'Community growth initiatives', 'Educational content planning', 'Future-proof Study plan strategy'],
    badge: 'Founder',
    badgeIcon: FaCrown,
    color: 'from-yellow-400 to-amber-600'
  },
  {
    name: 'Md. Tanvir Mahtab',
    role: 'Operations Lead',
    avatar: '📊',
    image: '', // paste CDN image link here
    quote: '"Every great platform needs solid planning and execution. My role was to ensure that our vision translates into actionable plans and that our operations run smoothly to lead our growing community."',
    contributions: ['Project planning and coordination', 'Strategic operations management', 'Team coordination', 'Quality assurance'],
    badge: 'Co-founder',
    badgeIcon: FaTrophy,
    color: 'from-cyan-400 to-blue-600'
  },
  {
    name: 'Zahin Ushrut Parsa',
    role: 'Managing Director',
    avatar: '🗓️',
    image: '', // paste CDN image link here
    quote: '"Managing HSCAura is about creating an environment where everyone can thrive. From scheduling exams to hosting battles, every task is an opportunity to make learning more engaging and organized."',
    contributions: ['Exam scheduling and coordination', 'Battle hosting and management', 'Group activity oversight', 'Community engagement'],
    badge: 'Director',
    badgeIcon: FaMedal,
    color: 'from-purple-400 to-violet-600'
  }
];

const LegendCard = ({ legend, index }) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 60, scale: 0.9 }}
      transition={{ 
        duration: 1, 
        delay: index * 0.2,
        ease: [0.23, 1, 0.32, 1]
      }}
      className="h-full"
    >
      <motion.div
        className="aura-glass aura-glass-card h-full relative overflow-hidden group"
        whileHover={{ 
          scale: 1.02,
          rotateY: index % 2 === 0 ? 3 : -3,
          transition: { duration: 0.4 }
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <motion.div
          className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-br-full"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-purple-500/20 to-transparent rounded-tl-full"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 + 0.5 }}
        />

        <div className="relative z-10 text-center p-6 sm:p-8">
          <motion.div
            className="relative inline-block mb-6"
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: index * 0.4,
              ease: 'easeInOut'
            }}
          >
            <motion.div
              className="absolute -inset-4 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.3), rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3))',
                backgroundSize: '200% 200%',
                filter: 'blur(8px)'
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div 
              className="relative text-6xl sm:text-7xl p-2 rounded-full border-2 border-cyan-400/30 overflow-hidden"
              style={{
                background: 'rgba(3, 3, 8, 0.8)',
                boxShadow: '0 0 30px rgba(0, 245, 255, 0.3), inset 0 0 20px rgba(0, 245, 255, 0.1)'
              }}
            >
              {legend.image ? (
                <img 
                  src={legend.image} 
                  alt={legend.name}
                  className="w-full h-full object-cover rounded-full"
                  style={{ width: '6rem', height: '6rem' }}
                />
              ) : (
                <span className="flex items-center justify-center" style={{ width: '6rem', height: '6rem' }}>
                  {legend.avatar}
                </span>
              )}
            </div>
          </motion.div>

          <motion.div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${legend.color} text-white text-sm font-bold mb-4 shadow-lg`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ delay: index * 0.2 + 0.3, duration: 0.6 }}
          >
            <legend.badgeIcon className="text-base" />
            {legend.badge}
          </motion.div>

          <motion.h3 
            className="text-2xl sm:text-3xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: index * 0.2 + 0.4, duration: 0.6 }}
          >
            {legend.name}
          </motion.h3>

          <motion.p 
            className="text-base sm:text-lg font-semibold text-purple-400 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: index * 0.2 + 0.5, duration: 0.6 }}
          >
            {legend.role}
          </motion.p>

          <motion.div
            className="relative bg-purple-500/10 rounded-xl p-5 mb-6 border border-purple-500/20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.2 + 0.6, duration: 0.8 }}
          >
            <span className="text-3xl text-purple-400 absolute -top-3 -left-1">"</span>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed italic relative z-10">
              {legend.quote}
            </p>
            <span className="text-3xl text-purple-400 absolute -bottom-4 -right-1">"</span>
          </motion.div>

          <motion.div
            className="text-left space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: index * 0.2 + 0.7, duration: 0.6 }}
          >
            <h4 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">Key Contributions</h4>
            {legend.contributions.map((contrib, idx) => (
              <motion.div 
                key={idx} 
                className="flex items-center gap-2 text-sm text-slate-400"
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                transition={{ delay: index * 0.2 + 0.8 + (idx * 0.1), duration: 0.4 }}
              >
                <motion.span 
                  className="text-cyan-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                >
                  •
                </motion.span>
                {contrib}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const HallOfFame = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <PageShell className="min-h-[calc(100vh-3.5rem)] text-slate-100 overflow-hidden">
        <motion.div 
          className="relative pt-16 pb-12 px-4 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-semibold mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <FaStar />
            <span>NEURONERDS ORIGINALS</span>
            <FaStar />
          </motion.div>
          
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
            style={{
              background: 'linear-gradient(135deg, #00f5ff, #a855f7, #ec4899)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            Hall of Fame
          </motion.h1>
          
          <motion.p 
            className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            A tribute to the original NeuroNerds Study Group members who inspired, supported, and built the foundation of this platform.
          </motion.p>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {legends.map((legend, index) => (
              <LegendCard key={legend.name} legend={legend} index={index} />
            ))}
          </div>
        </div>

        <motion.div 
          className="text-center pb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <Button
            variant="secondary"
            onClick={() => navigate('/about')}
            className="inline-flex items-center gap-2"
          >
            <FaArrowLeft />
            Back to About
          </Button>
        </motion.div>
      </PageShell>
    </PageTransition>
  );
};

export default HallOfFame;
