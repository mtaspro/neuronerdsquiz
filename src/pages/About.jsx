import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaGithub, 
  FaTwitter, 
  FaFacebook, 
  FaDiscord,  
  FaLinkedin,
  FaWikipediaW,
  FaCode,
  FaDatabase,
  FaServer,
  FaPalette,
  FaRocket,
  FaBrain,
  FaUsers,
  FaHeart,
  FaLightbulb,
  FaCoffee,
  FaGamepad,
  FaEnvelope,
  FaLaptopCode
} from 'react-icons/fa';

// Team Section Component
const TeamSection = ({ teamMembers, setCursorVariant }) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  
  return (
    <motion.section ref={sectionRef} className="relative">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-3xl blur-3xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: isInView ? 1 : 0.8, opacity: isInView ? 1 : 0 }}
        transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
      />
      
      <motion.div
        initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
        animate={{ clipPath: isInView ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)" }}
        transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }}
        className="text-center mb-16 relative z-10"
      >
        <motion.h2 
          className="text-5xl md:text-6xl font-bold mb-6"
          style={{ 
            background: 'linear-gradient(45deg, #8B5CF6, #3B82F6, #06B6D4)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          Meet Our Team
        </motion.h2>
        <motion.div
          className="flex justify-center items-center space-x-4 text-4xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span>👥</span>
        </motion.div>
        <motion.p 
          className="text-lg text-gray-600 dark:text-gray-300 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: isInView ? 1 : 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          The brilliant minds behind Neuronerds Quiz and NeuraX AI
        </motion.p>
      </motion.div>

      <div className="space-y-12">
        {teamMembers.map((member, index) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
            animate={{ 
              opacity: isInView ? 1 : 0, 
              x: isInView ? 0 : (index % 2 === 0 ? -100 : 100)
            }}
            transition={{ 
              duration: 1.5, 
              delay: index * 0.3,
              ease: [0.23, 1, 0.32, 1]
            }}
            className="group"
          >
            <motion.div
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-3xl transition-all duration-700 relative overflow-hidden"
              whileHover={{ 
                scale: 1.02,
                rotateY: index % 2 === 0 ? 2 : -2,
                transition: { duration: 0.3 }
              }}
              onMouseEnter={() => setCursorVariant('hover')}
              onMouseLeave={() => setCursorVariant('default')}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              />
              
              <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8 text-center lg:text-left relative z-10">
                <div className="flex-1">
                  <motion.p 
                    className="text-gray-600 dark:text-gray-300 mb-4 text-lg leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                    transition={{ delay: index * 0.3 + 0.2, duration: 0.8 }}
                  >
                    {member.description}
                  </motion.p>
                  
                  <motion.div 
                    className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 mb-6 border border-purple-200/30 dark:border-purple-700/30"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: isInView ? 1 : 0, scale: isInView ? 1 : 0.9 }}
                    transition={{ delay: index * 0.3 + 0.4, duration: 0.8 }}
                  >
                    <motion.p 
                      className="italic text-gray-700 dark:text-gray-300 relative"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isInView ? 1 : 0 }}
                      transition={{ delay: index * 0.3 + 0.6, duration: 1 }}
                    >
                      <span className="text-4xl text-purple-400 absolute -top-2 -left-2">"</span>
                      {member.message}
                      <span className="text-4xl text-purple-400 absolute -bottom-4 -right-2">"</span>
                    </motion.p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                    transition={{ delay: index * 0.3 + 0.8, duration: 0.8 }}
                  >
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-4 text-lg">Key Contributions:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {member.contributions.map((contribution, idx) => (
                        <motion.div 
                          key={idx} 
                          className="flex items-center space-x-3 group/item"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : -20 }}
                          transition={{ delay: index * 0.3 + 1 + (idx * 0.1), duration: 0.5 }}
                          whileHover={{ x: 5 }}
                        >
                          <motion.span 
                            className="text-green-500 text-lg"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                          >
                            ✓
                          </motion.span>
                          <span className="text-sm text-gray-600 dark:text-gray-300 group-hover/item:text-gray-800 dark:group-hover/item:text-white transition-colors">
                            {contribution}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                <motion.div 
                  className="flex-shrink-0 text-center lg:text-right"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: isInView ? 1 : 0, scale: isInView ? 1 : 0.8 }}
                  transition={{ delay: index * 0.3 + 0.2, duration: 0.8 }}
                >
                  <motion.div 
                    className="text-7xl mb-4"
                    whileHover={{ 
                      scale: 1.2, 
                      rotate: [0, -10, 10, 0],
                      transition: { duration: 0.5 }
                    }}
                  >
                    {member.avatar}
                  </motion.div>
                  <motion.h3 
                    className="text-2xl font-bold text-gray-800 dark:text-white mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 10 }}
                    transition={{ delay: index * 0.3 + 0.4, duration: 0.6 }}
                  >
                    {member.name}
                  </motion.h3>
                  <motion.p 
                    className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 10 }}
                    transition={{ delay: index * 0.3 + 0.5, duration: 0.6 }}
                  >
                    {member.role}
                  </motion.p>
                  {(member.name.includes('Akhyar') || member.name.includes('Tanvir') || member.name.includes('Ahmed')) && (
                    <motion.p 
                      className="text-sm font-medium text-blue-500 dark:text-blue-300 mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isInView ? 1 : 0 }}
                      transition={{ delay: index * 0.3 + 0.6, duration: 0.6 }}
                    >
                      Neuronerds Study Group
                    </motion.p>
                  )}
                  
                  <motion.div 
                    className="flex justify-center lg:justify-end space-x-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                    transition={{ delay: index * 0.3 + 0.8, duration: 0.6 }}
                  >
                    {member.socials.map((social, socialIdx) => (
                      <motion.a
                        key={social.platform}
                        href={social.url}
                        target={social.platform === 'Email' ? '_self' : '_blank'}
                        rel={social.platform === 'Email' ? '' : 'noopener noreferrer'}
                        className={`${social.color} hover:scale-125 transition-all duration-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700`}
                        title={social.platform}
                        whileHover={{ 
                          scale: 1.3, 
                          rotate: 360,
                          transition: { duration: 0.3 }
                        }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: isInView ? 1 : 0, scale: isInView ? 1 : 0 }}
                        transition={{ delay: index * 0.3 + 1 + (socialIdx * 0.1), duration: 0.4 }}
                      >
                        <social.icon className="text-2xl" />
                      </motion.a>
                    ))}
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

const About = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorVariant, setCursorVariant] = useState('default');
  const [particles, setParticles] = useState([]);
  
  const { scrollYProgress } = useScroll({ target: containerRef });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const backgroundY = useTransform(smoothProgress, [0, 1], [0, -200]);
  const headerScale = useTransform(smoothProgress, [0, 0.2], [1, 0.8]);
  const headerOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);
  
  // Generate floating particles
  useEffect(() => {
    const particleArray = [];
    for (let i = 0; i < 50; i++) {
      particleArray.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 2 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        color: ['cyan', 'purple', 'blue', 'pink'][Math.floor(Math.random() * 4)]
      });
    }
    setParticles(particleArray);
  }, []);
  
  // Advanced cursor tracking
  useEffect(() => {
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    
    const updateMousePosition = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    
    const animateCursor = () => {
      cursorX += (mouseX - cursorX) * 0.1;
      cursorY += (mouseY - cursorY) * 0.1;
      setMousePosition({ x: cursorX, y: cursorY });
      requestAnimationFrame(animateCursor);
    };
    
    window.addEventListener('mousemove', updateMousePosition);
    animateCursor();
    
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);
  
  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const teamMembers = [
    {
      name: 'Ahmed Azmain Mahtab',
      role: 'Lead Developer',
      avatar: '👨💻',
      description: 'Full-stack development, feature planning, design, and deployment',
      message: 'Building Neuronerds Quiz and NeuraX has been an incredible journey of turning ideas into reality. From simple quizzes to advanced AI capabilities - every line of code represents hours of passion and dedication to create something that truly revolutionizes how students learn.',
      contributions: [
        'Complete full-stack architecture',
        'Real-time battle system implementation',
        'Comprehensive badge system',
        'Security & authentication',
        'UI/UX design and animations'
      ],
      socials: [
        { platform: 'X', icon: FaTwitter, url: 'https://x.com/AAMahtab', color: 'text-gray-800 dark:text-gray-200' },
        { platform: 'GitHub', icon: FaGithub, url: 'https://github.com/mtaspro', color: 'text-gray-800 dark:text-gray-200' },
        { platform: 'Devpost', icon: FaLaptopCode, url: 'https://devpost.com/mtaspro', color: 'text-gray-800 dark:text-gray-200' },
        { platform: 'Email', icon: FaEnvelope, url: 'mailto:mowama36@gmail.com', color: 'text-gray-800 dark:text-gray-200' }
      ]
    },
    {
      name: 'Akhyar Fardin',
      role: 'Founder & CEO',
      avatar: '🧠',
      description: 'Visionary behind the Neuronerds movement',
      message: 'Neuronerds represents our vision of making learning competitive, engaging, and accessible to everyone. We believe that when friends compete in a healthy environment, they push each other to achieve greatness.',
      contributions: [
        'Strategic vision and roadmap',
        'Community growth initiatives',
        'Educational content planning',
        'Group Founder and Head',
        'Future-proof Study plan strategy'
      ],
      socials: [
        { platform: 'X', icon: FaTwitter, url: 'https://x.com/AkhyarFardin', color: 'text-gray-800 dark:text-gray-200' },
        { platform: 'GitHub', icon: FaGithub, url: 'https://github.com/fardinatwork', color: 'text-gray-800 dark:text-gray-200' },
        { platform: 'Wikipedia', icon: FaWikipediaW, url: 'https://en.wikipedia.org/wiki/Special:CentralAuth?target=Fardin+work', color: 'text-gray-800 dark:text-gray-200' }
      ]
    },
    {
      name: 'Md. Tanvir Mahtab',
      role: 'Co-founder & Managing Director',
      avatar: '📊',
      description: 'Handles planning, developing, organization, and strategic operations',
      message: 'Every great platform needs solid planning and execution. My role is to ensure that our vision translates into actionable plans and that our operations run smoothly to lead our growing community.',
      contributions: [
        'Project planning and coordination',
        'Strategic operations management',
        'Team coordination',
        'Quality assurance',
        'Study planning strategy'
      ],
      socials: [
        { platform: 'GitHub', icon: FaGithub, url: 'https://github.com/Tanvir-007-ctg', color: 'text-gray-800 dark:text-gray-200' },
        { platform: 'wikipedia', icon: FaWikipediaW, url: 'https://bn.m.wikipedia.org/wiki/%E0%A6%AC%E0%A7%8D%E0%A6%AF%E0%A6%AC%E0%A6%B9%E0%A6%BE%E0%A6%B0%E0%A6%95%E0%A6%BE%E0%A6%B0%E0%A7%80:Md._T_Mahtab', color: 'text-gray-800 dark:text-gray-200' }
      ]
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200 overflow-hidden">
      {/* Advanced Custom Cursor */}
      <motion.div
        className="fixed pointer-events-none z-[9999] mix-blend-difference"
        style={{ 
          left: mousePosition.x - 25, 
          top: mousePosition.y - 25,
          width: cursorVariant === 'hover' ? '80px' : '50px',
          height: cursorVariant === 'hover' ? '80px' : '50px'
        }}
        animate={{
          scale: cursorVariant === 'hover' ? 1.5 : 1,
          rotate: cursorVariant === 'hover' ? 180 : 0
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      >
        <div className="w-full h-full rounded-full bg-white opacity-90 flex items-center justify-center">
          {cursorVariant === 'hover' && (
            <motion.span 
              className="text-black text-xs font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              EXPLORE
            </motion.span>
          )}
        </div>
      </motion.div>
      
      {/* Floating Particles Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={`absolute rounded-full bg-${particle.color}-400`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity * 0.3,
            }}
            animate={{
              y: [0, -50, 0],
              x: [0, 20, -20, 0],
              scale: [1, 1.5, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: particle.speed * 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      
      {/* Parallax Header */}
      <motion.div 
        className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 dark:from-gray-800 dark:to-gray-900 p-8 min-h-screen flex items-center justify-center overflow-hidden"
        style={{ y: backgroundY, scale: headerScale, opacity: headerOpacity }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-20 w-32 h-32 bg-cyan-500/20 rounded-full blur-xl"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-48 h-48 bg-purple-500/20 rounded-full blur-xl"
            animate={{
              scale: [1.2, 0.8, 1.2],
              opacity: [0.4, 0.7, 0.4],
              x: [0, -40, 0],
              y: [0, 40, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center space-x-4 mb-12"
          >
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors group"
              whileHover={{ scale: 1.05, x: -5 }}
              onMouseEnter={() => setCursorVariant('hover')}
              onMouseLeave={() => setCursorVariant('default')}
            >
              <motion.div
                animate={{ x: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FaArrowLeft />
              </motion.div>
              <span>Back to Dashboard</span>
            </motion.button>
          </motion.div>
          
          {/* Hero Title with Character Animation */}
          <motion.div className="text-center">
            <motion.h1 className="text-6xl md:text-8xl font-bold text-white mb-8">
              {Array.from("Behind The Scenes").map((char, index) => (
                <motion.span
                  key={index}
                  className="inline-block"
                  initial={{
                    clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)",
                    transform: "translate(0%, 20%)"
                  }}
                  animate={{
                    clipPath: "polygon(0 0%, 100% 0%, 100% 100%, 0% 100%)",
                    transform: "translate(0%, 0%)"
                  }}
                  transition={{
                    duration: 1.5,
                    delay: index * 0.05,
                    ease: [0.23, 1, 0.32, 1]
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
              <motion.span
                className="inline-block ml-4 text-7xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 2 }}
              >
                🎬
              </motion.span>
            </motion.h1>
            
            <motion.div className="overflow-hidden">
              <motion.p
                initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                transition={{ duration: 2, delay: 1.5, ease: [0.23, 1, 0.32, 1] }}
                className="text-xl md:text-2xl text-purple-200 max-w-4xl mx-auto leading-relaxed"
              >
                Meet the passionate team behind Neuronerds Quiz and discover NeuraX - 
                our advanced AI assistant that's revolutionizing how students learn and compete.
              </motion.p>
            </motion.div>
            
            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5, duration: 0.8 }}
              className="mt-16"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-white/60 text-sm flex flex-col items-center space-y-2"
              >
                <span>Scroll to explore</span>
                <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center">
                  <motion.div
                    animate={{ y: [0, 12, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1 h-3 bg-white/60 rounded-full mt-2"
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto p-8 space-y-32 relative z-10">
        {/* Team Section */}
        <TeamSection 
          teamMembers={teamMembers} 
          setCursorVariant={setCursorVariant}
        />

        {/* Simple placeholder sections for now */}
        <motion.section className="text-center py-20">
          <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Tech Stack 🛠️
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            More sections coming soon...
          </p>
        </motion.section>
      </div>
    </div>
  );
};

export default About;