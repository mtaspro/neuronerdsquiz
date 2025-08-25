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
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
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

// Tech Stack Section
const TechStackSection = ({ setCursorVariant }) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  
  const techStack = [
    { name: 'React.js', icon: '⚛️', description: 'Frontend framework with hooks & context' },
    { name: 'Node.js', icon: '🟢', description: 'Backend runtime with ES6+ modules' },
    { name: 'Express.js', icon: '🚀', description: 'RESTful API with middleware architecture' },
    { name: 'MongoDB', icon: '🍃', description: 'NoSQL database with Mongoose ODM' },
    { name: 'Socket.io', icon: '🔌', description: 'Real-time battles & notifications' },
    { name: 'Tailwind CSS', icon: '🎨', description: 'Responsive design with dark mode' },
    { name: 'Framer Motion', icon: '✨', description: 'Smooth animations & transitions' },
    { name: 'JWT', icon: '🔐', description: 'Secure auth with role-based access' }
  ];
  
  return (
    <motion.section ref={sectionRef} className="relative">
      <motion.div
        initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
        animate={{ clipPath: isInView ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)" }}
        transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }}
        className="text-center mb-16"
      >
        <motion.h2 
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
          style={{ 
            background: 'linear-gradient(45deg, #10B981, #3B82F6, #8B5CF6)',
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
          Tech Stack
        </motion.h2>
        <motion.div
          className="flex justify-center items-center space-x-4 text-4xl mb-4"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <span>🛠️</span>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {techStack.map((tech, index) => (
          <motion.div
            key={tech.name}
            initial={{ opacity: 0, y: 100, rotateX: -30 }}
            animate={{ 
              opacity: isInView ? 1 : 0, 
              y: isInView ? 0 : 100,
              rotateX: isInView ? 0 : -30
            }}
            transition={{ 
              duration: 1.2, 
              delay: index * 0.15,
              ease: [0.23, 1, 0.32, 1]
            }}
            className="group perspective-1000"
          >
            <motion.div
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 text-center relative overflow-hidden transform-gpu"
              whileHover={{ 
                scale: 1.1,
                rotateY: 15,
                rotateX: 10,
                transition: { duration: 0.4 }
              }}
              animate={{
                y: [0, -10, 0],
                rotateZ: [0, 2, -2, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: index * 0.5
              }}
              onMouseEnter={() => setCursorVariant('hover')}
              onMouseLeave={() => setCursorVariant('default')}
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100"
                animate={{
                  background: [
                    'linear-gradient(45deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
                    'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))',
                    'linear-gradient(225deg, rgba(16, 185, 129, 0.1), rgba(139, 92, 246, 0.1))'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              <motion.div 
                className="text-5xl mb-4 relative z-10"
                whileHover={{ 
                  scale: 1.5, 
                  rotate: [0, -15, 15, 0],
                  y: [-5, 5, -5],
                  transition: { duration: 0.6 }
                }}
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: index * 0.3
                }}
              >
                {tech.icon}
              </motion.div>
              
              <motion.h3 
                className="font-bold text-lg text-gray-800 dark:text-white mb-3 relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                transition={{ delay: index * 0.15 + 0.3, duration: 0.8 }}
              >
                {tech.name}
              </motion.h3>
              
              <motion.p 
                className="text-sm text-gray-600 dark:text-gray-300 relative z-10 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                transition={{ delay: index * 0.15 + 0.5, duration: 0.8 }}
              >
                {tech.description}
              </motion.p>
              
              {/* Floating particles inside card */}
              <motion.div
                className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full opacity-60"
                animate={{
                  y: [0, -20, 0],
                  x: [0, 10, 0],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.2
                }}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

// Journey Section
const JourneySection = ({ setCursorVariant }) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  
  const milestones = [
    { icon: '💡', title: 'The Vision', description: 'Making competitive learning accessible to everyone' },
    { icon: '🏆', title: 'Badge System', description: 'Achievement system with 15+ unique badges' },
    { icon: '🤖', title: 'AI Integration', description: 'NeuraX - Advanced AI assistant with multimodal capabilities' },
    { icon: '🚀', title: 'Future Ready', description: 'Continuous innovation and feature development' }
  ];
  
  return (
    <motion.section ref={sectionRef} className="relative">
      <motion.div
        initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
        animate={{ clipPath: isInView ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)" }}
        transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }}
        className="text-center mb-16"
      >
        <motion.h2 
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
          style={{ 
            background: 'linear-gradient(45deg, #F97316, #EF4444, #EC4899)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Our Journey
        </motion.h2>
        <motion.div
          className="flex justify-center items-center space-x-4 text-4xl mb-4"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span>🚀</span>
        </motion.div>
      </motion.div>

      {/* Animated Timeline */}
      <div className="relative">
        <motion.div
          className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-orange-500 via-red-500 to-pink-500 rounded-full"
          initial={{ height: 0 }}
          animate={{ height: isInView ? '100%' : 0 }}
          transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {milestones.map((milestone, index) => (
            <motion.div
              key={milestone.title}
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={{ 
                opacity: isInView ? 1 : 0, 
                y: isInView ? 0 : 100,
                scale: isInView ? 1 : 0.8
              }}
              transition={{ 
                duration: 1.5, 
                delay: index * 0.3,
                ease: [0.23, 1, 0.32, 1]
              }}
              className="group relative"
            >
              {/* Timeline connector */}
              <motion.div
                className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full border-4 border-white dark:border-gray-900 shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: isInView ? 1 : 0 }}
                transition={{ delay: index * 0.3 + 0.5, duration: 0.5 }}
                whileHover={{ scale: 1.5 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                />
              </motion.div>
              
              <motion.div
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 relative overflow-hidden mt-8"
                whileHover={{ 
                  scale: 1.1,
                  rotateY: 10,
                  transition: { duration: 0.4 }
                }}
                animate={{
                  y: [0, -5, 0],
                  rotateX: [0, 2, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: index * 0.7
                }}
                onMouseEnter={() => setCursorVariant('hover')}
                onMouseLeave={() => setCursorVariant('default')}
              >
                {/* Animated background glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100"
                  animate={{
                    background: [
                      'linear-gradient(45deg, rgba(249, 115, 22, 0.1), rgba(236, 72, 153, 0.1))',
                      'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(239, 68, 68, 0.1))',
                      'linear-gradient(225deg, rgba(239, 68, 68, 0.1), rgba(249, 115, 22, 0.1))'
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                
                <motion.div 
                  className="text-5xl mb-4 relative z-10"
                  whileHover={{ 
                    scale: 1.3, 
                    rotate: [0, -20, 20, 0],
                    y: [-10, 10, -10],
                    transition: { duration: 0.8 }
                  }}
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: index * 0.4
                  }}
                >
                  {milestone.icon}
                </motion.div>
                
                <motion.h3 
                  className="font-bold text-xl text-gray-800 dark:text-white mb-3 relative z-10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : -20 }}
                  transition={{ delay: index * 0.3 + 0.7, duration: 0.8 }}
                >
                  {milestone.title}
                </motion.h3>
                
                <motion.p 
                  className="text-gray-600 dark:text-gray-300 leading-relaxed relative z-10"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : 20 }}
                  transition={{ delay: index * 0.3 + 0.9, duration: 0.8 }}
                >
                  {milestone.description}
                </motion.p>
                
                {/* Corner decorations */}
                <motion.div
                  className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full opacity-70"
                  animate={{
                    scale: [1, 1.5, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.3
                  }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

// Future Plans Section
const FuturePlansSection = ({ setCursorVariant }) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  
  return (
    <motion.section ref={sectionRef} className="relative">
      <motion.div
        initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
        animate={{ clipPath: isInView ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)" }}
        transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }}
        className="text-center mb-16"
      >
        <motion.h2 
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
          style={{ 
            background: 'linear-gradient(45deg, #06B6D4, #8B5CF6, #EC4899)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          What's Next?
        </motion.h2>
        <motion.div
          className="flex justify-center items-center space-x-4 text-4xl mb-4"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <span>🔮</span>
        </motion.div>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-br from-cyan-50 to-purple-50 dark:from-cyan-900/20 dark:to-purple-900/20 rounded-3xl p-8 border border-cyan-200/50 dark:border-cyan-700/50"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: isInView ? 1 : 0, scale: isInView ? 1 : 0.9 }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : -50 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            onMouseEnter={() => setCursorVariant('hover')}
            onMouseLeave={() => setCursorVariant('default')}
          >
            <FaBrain className="text-6xl text-purple-500 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
              NeuraX - Advanced AI Assistant
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our cutting-edge AI assistant with voice interaction, web search, OCR capabilities, and bilingual support.
            </p>
          </motion.div>

          <motion.div 
            className="text-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : 50 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            onMouseEnter={() => setCursorVariant('hover')}
            onMouseLeave={() => setCursorVariant('default')}
          >
            <FaRocket className="text-6xl text-blue-500 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
              Upcoming Features
            </h3>
            <div className="text-left space-y-2">
              <p className="text-gray-600 dark:text-gray-300">• Mobile app for iOS and Android</p>
              <p className="text-gray-600 dark:text-gray-300">• Advanced analytics dashboard</p>
              <p className="text-gray-600 dark:text-gray-300">• Team-based study groups</p>
              <p className="text-gray-600 dark:text-gray-300">• Custom quiz creation tools</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.section>
  );
};

// Final Message Section
const FinalMessageSection = ({ navigate, setCursorVariant }) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  
  return (
    <motion.section ref={sectionRef} className="relative">
      <motion.div 
        className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-3xl p-12 text-center border border-pink-200/50 dark:border-pink-700/50 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: isInView ? 1 : 0, scale: isInView ? 1 : 0.9 }}
        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
      >
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <FaHeart className="text-6xl text-red-500 mx-auto mb-8" />
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-8">
            A Message to Our Amazing Community 💝
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-6 text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-12 px-4">
            <p>
              To every friend who has taken a quiz, every competitor who has battled with friends, 
              and every learner who has earned a badge - thank you! Your enthusiasm 
              and engagement drive us to keep improving and innovating.
            </p>
            <p className="font-semibold text-purple-600 dark:text-purple-400">
              Keep learning, keep competing, and most importantly - keep having fun! 
              The future of education is bright, and we're part of making it happen. 🌟
            </p>
          </div>
          
          <motion.button
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(139, 92, 246, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 sm:py-4 sm:px-12 rounded-full shadow-2xl transition-all duration-500 text-base sm:text-lg w-full sm:w-auto"
            onMouseEnter={() => setCursorVariant('hover')}
            onMouseLeave={() => setCursorVariant('default')}
          >
            enough reading 😴
          </motion.button>
        </motion.div>
      </motion.div>
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
  
  // Scroll-triggered animations
  const scrollY = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.2, 0.8]);

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
      {/* Advanced Custom Cursor - Hidden on Mobile */}
      <motion.div
        className="fixed pointer-events-none z-[9999] mix-blend-difference hidden md:block"
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
              animate={{ opacity: 1, rotate: cursorVariant === 'hover' ? -180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              EXPLORE
            </motion.span>
          )}
        </div>
      </motion.div>
      
      {/* Dynamic Floating Elements */}
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
              opacity: particle.opacity * 0.4,
              y: scrollY
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, 30, -30, 0],
              scale: [1, 2, 1],
              rotate: [0, 360, 720]
            }}
            transition={{
              duration: particle.speed * 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        
        {/* Scroll-reactive geometric shapes */}
        <motion.div
          className="absolute top-1/4 right-10 w-20 h-20 border-4 border-cyan-400/30"
          style={{ rotate, scale }}
        />
        <motion.div
          className="absolute bottom-1/4 left-10 w-16 h-16 bg-purple-500/20 rounded-full"
          style={{ y: scrollY, rotate: rotate }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-pink-400/20 rotate-45"
          style={{ scale, rotate: useTransform(scrollYProgress, [0, 1], [0, -360]) }}
        />
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
            <motion.h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-8">
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
            
            <motion.div className="overflow-hidden px-4">
              <motion.p
                initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                transition={{ duration: 2, delay: 1.5, ease: [0.23, 1, 0.32, 1] }}
                className="text-lg sm:text-xl md:text-2xl text-purple-200 max-w-4xl mx-auto leading-relaxed"
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

      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />
      
      {/* Floating Navigation Dots */}
      <motion.div 
        className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 space-y-4"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 3 }}
      >
        {['Team', 'Tech', 'Journey', 'Future'].map((section, index) => (
          <motion.div
            key={section}
            className="w-3 h-3 rounded-full bg-white/50 cursor-pointer hover:bg-white transition-colors"
            whileHover={{ scale: 1.5 }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              delay: index * 0.5 
            }}
          />
        ))}
      </motion.div>
      
      <motion.div 
        className="max-w-6xl mx-auto p-8 space-y-32 relative z-10"
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, -100]) }}
      >
        {/* Team Section with Parallax */}
        <motion.div style={{ y: useTransform(scrollYProgress, [0, 0.3], [0, -50]) }}>
          <TeamSection 
            teamMembers={teamMembers} 
            setCursorVariant={setCursorVariant}
          />
        </motion.div>

        {/* Tech Stack Section with Parallax */}
        <motion.div style={{ y: useTransform(scrollYProgress, [0.2, 0.5], [50, -50]) }}>
          <TechStackSection setCursorVariant={setCursorVariant} />
        </motion.div>
        
        {/* Journey Section with Parallax */}
        <motion.div style={{ y: useTransform(scrollYProgress, [0.4, 0.7], [100, -100]) }}>
          <JourneySection setCursorVariant={setCursorVariant} />
        </motion.div>
        
        {/* Future Plans Section with Parallax */}
        <motion.div style={{ y: useTransform(scrollYProgress, [0.6, 0.9], [150, -150]) }}>
          <FuturePlansSection setCursorVariant={setCursorVariant} />
        </motion.div>
        
        {/* Final Message Section with Parallax */}
        <motion.div style={{ y: useTransform(scrollYProgress, [0.8, 1], [200, -200]) }}>
          <FinalMessageSection navigate={navigate} setCursorVariant={setCursorVariant} />
        </motion.div>
      </motion.div>
      
      {/* Dynamic Background Gradient */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: useTransform(
            scrollYProgress,
            [0, 0.25, 0.5, 0.75, 1],
            [
              'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1), transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1), transparent 50%)',
              'radial-gradient(circle at 40% 40%, rgba(120, 200, 255, 0.1), transparent 50%), radial-gradient(circle at 60% 60%, rgba(255, 200, 120, 0.1), transparent 50%)',
              'radial-gradient(circle at 60% 20%, rgba(200, 120, 255, 0.1), transparent 50%), radial-gradient(circle at 40% 80%, rgba(120, 255, 200, 0.1), transparent 50%)',
              'radial-gradient(circle at 80% 60%, rgba(255, 200, 200, 0.1), transparent 50%), radial-gradient(circle at 20% 40%, rgba(200, 255, 120, 0.1), transparent 50%)',
              'radial-gradient(circle at 50% 50%, rgba(180, 180, 255, 0.1), transparent 50%), radial-gradient(circle at 50% 50%, rgba(255, 180, 255, 0.1), transparent 50%)'
            ]
          )
        }}
      />
    </div>
  );
};

export default About;