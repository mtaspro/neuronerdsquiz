import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaGithub, 
  FaTwitter, 
  FaFacebook, 
  FaLinkedin,
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
  FaGamepad
} from 'react-icons/fa';

const About = () => {
  const navigate = useNavigate();

  const techStack = [
    { name: 'React.js', icon: '⚛️', description: 'Frontend framework for dynamic UI' },
    { name: 'Node.js', icon: '🟢', description: 'Backend runtime environment' },
    { name: 'Express.js', icon: '🚀', description: 'Web application framework' },
    { name: 'MongoDB', icon: '🍃', description: 'NoSQL database for data storage' },
    { name: 'Socket.io', icon: '🔌', description: 'Real-time communication for battles' },
    { name: 'Tailwind CSS', icon: '🎨', description: 'Utility-first CSS framework' },
    { name: 'Framer Motion', icon: '✨', description: 'Animation library for smooth UX' },
    { name: 'JWT', icon: '🔐', description: 'Secure authentication system' }
  ];

  const teamMembers = [
    {
      name: 'Ahmed Azmain Mahtab',
      role: 'Lead Developer',
      avatar: '👨‍💻',
      description: 'Full-stack development, feature planning, design, and deployment',
      message: 'Building Neuronerds Quiz has been an incredible journey of turning ideas into reality. Every line of code represents hours of passion and dedication to create something that truly helps friends learn and compete in a fun way.',
      contributions: [
        'Complete full-stack architecture',
        'Real-time battle system implementation',
        'Comprehensive badge system',
        'Security & authentication',
        'UI/UX design and animations'
      ],
      socials: [
        { platform: 'GitHub', icon: FaGithub, url: '#', color: 'text-gray-800 dark:text-gray-200' },
        { platform: 'Twitter', icon: FaTwitter, url: '#', color: 'text-blue-500' },
        { platform: 'Facebook', icon: FaFacebook, url: '#', color: 'text-blue-600' }
      ]
    },
    {
      name: 'Md. Akhyar Fardin',
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
        { platform: 'Twitter', icon: FaTwitter, url: '#', color: 'text-blue-500' }
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
        { platform: 'LinkedIn', icon: FaLinkedin, url: '#', color: 'text-blue-700' }
      ]
    }
  ];

  const milestones = [
    { icon: '💡', title: 'The Idea', description: 'Born from the need to make learning more engaging and competitive' },
    { icon: '🏗️', title: 'Development', description: 'Days of coding, testing, and refining the perfect quiz experience' },
    { icon: '⚔️', title: 'Battle System', description: 'Real-time multiplayer battles that changed everything' },
    { icon: '🏆', title: 'Badge System', description: 'Competitive achievements that motivate continuous learning' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 dark:from-gray-800 dark:to-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors"
            >
              <FaArrowLeft />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold text-white mb-4">
              Behind The Scenes 🎬
            </h1>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Meet the passionate team and discover the story behind Neuronerds Quiz - 
              where learning meets competition and innovation drives education forward.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-16">
        {/* Team Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Meet Our Team 👥
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              The brilliant minds behind Neuronerds Quiz
            </p>
          </div>

          <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-8">
                  {/* Avatar and Basic Info - Now on the left */}
                  <div className="flex-shrink-0 text-center lg:text-left">
                    <div className="text-6xl mb-4">{member.avatar}</div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                      {member.name}
                    </h3>
                    <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-4">
                      {member.role}
                    </p>
                    
                    {/* Social Links */}
                    <div className="flex justify-center lg:justify-start space-x-4">
                      {member.socials.map((social) => (
                        <a
                          key={social.platform}
                          href={social.url}
                          className={`${social.color} hover:scale-110 transition-transform duration-200`}
                          title={social.platform}
                        >
                          <social.icon className="text-2xl" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Details - Now on the right */}
                  <div className="flex-1">
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-lg">
                      {member.description}
                    </p>
                    
                    {/* Personal Message */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-6">
                      <p className="italic text-gray-700 dark:text-gray-300">
                        "{member.message}"
                      </p>
                    </div>

                    {/* Contributions */}
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Key Contributions:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {member.contributions.map((contribution, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{contribution}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tech Stack Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Tech Stack 🛠️
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Cutting-edge technologies powering our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="text-4xl mb-3">{tech.icon}</div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">
                  {tech.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {tech.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Behind The Scenes Story */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Our Journey 🚀
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              From concept to reality - the story of Neuronerds Quiz
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center"
              >
                <div className="text-4xl mb-3">{milestone.icon}</div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">
                  {milestone.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {milestone.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Fun Facts */}
          <div className="mt-12 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-white">
              Fun Development Facts ☕
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <FaCoffee className="text-4xl text-brown-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-800 dark:text-white">500+ Cups of Coffee</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Fueled our coding sessions</p>
              </div>
              <div>
                <FaCode className="text-4xl text-blue-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-800 dark:text-white">10,000+ Lines of Code</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Crafted with love and precision</p>
              </div>
              <div>
                <FaGamepad className="text-4xl text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-800 dark:text-white">Countless Test Battles</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">To perfect the experience</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Future Plans */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
              What's Next? 🔮
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Exciting features coming to Neuronerds Quiz
            </p>
          </div>

          <div className="bg-gradient-to-r from-cyan-50 to-purple-50 dark:from-cyan-900/20 dark:to-purple-900/20 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <FaBrain className="text-5xl text-purple-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                  AI Chatbot Integration
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Introducing <strong>Neuraflow</strong> - an intelligent AI assistant that will help students 
                  with personalized learning recommendations, instant doubt resolution, and adaptive quiz suggestions.
                </p>
              </div>
              <div className="text-center">
                <FaRocket className="text-5xl text-blue-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                  Enhanced Features
                </h3>
                <div className="text-left space-y-2">
                  <p className="text-gray-600 dark:text-gray-300">• Advanced analytics dashboard</p>
                  <p className="text-gray-600 dark:text-gray-300">• Mobile app for iOS and Android</p>
                  <p className="text-gray-600 dark:text-gray-300">• Voice-based quiz interactions</p>
                  <p className="text-gray-600 dark:text-gray-300">• Collaborative study groups</p>
                  <p className="text-gray-600 dark:text-gray-300">• Gamified learning paths</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Message to Users */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-8 text-center">
            <FaHeart className="text-5xl text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
              A Message to Our Amazing Community 💝
            </h2>
            <div className="max-w-4xl mx-auto space-y-4 text-lg text-gray-700 dark:text-gray-300">
              <p>
                To every friends who has taken a quiz, every competitor who has battled with friends, 
                and every learner who has earned a badge - <strong>thank you!</strong> Your enthusiasm 
                and engagement drive us to keep improving and innovating.
              </p>
              <p>
                We believe that learning should be fun, competitive, and rewarding. Every feature we build, 
                every bug we fix, and every enhancement we make is with you in mind. Success will come to us gradually in sha allah.
              </p>
              <p className="font-semibold text-purple-600 dark:text-purple-400">
                Keep learning, keep competing, and most importantly - keep having fun! 
                The future of education is bright, and we're part of making it happen. 🌟
              </p>
            </div>
            
            <div className="mt-8 flex justify-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all"
              >
                enough reading😴
              </motion.button>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default About;