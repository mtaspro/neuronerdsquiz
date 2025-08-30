import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import axios from 'axios';
import { FaFire, FaUsers, FaPlay, FaPlus, FaUser, FaCog, FaQuestionCircle, FaCopy, FaEye, FaRocket, FaTrophy, FaBolt, FaEdit } from 'react-icons/fa';
import { getAvatarUrl, getFallbackAvatar } from '../utils/avatarUtils';
import { useOnboarding } from '../hooks/useOnboarding';
import OnboardingTour from '../components/OnboardingTour';
import LoadingAnimation from '../components/LoadingAnimation';
import { useNotification } from '../components/NotificationSystem';
import SpectatorAccess from '../components/SpectatorAccess';
import SoundToggle from '../components/SoundToggle';
import soundManager from '../utils/soundUtils';
import { secureStorage } from '../utils/secureStorage.js';
import { authHeader } from '../utils/auth.js';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedChapter, setSelectedChapter] = useState('');
  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [battleRoomId, setBattleRoomId] = useState('');
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [selectedBattleChapter, setSelectedBattleChapter] = useState('');
  const [activeBattleRoom, setActiveBattleRoom] = useState(null);
  const [showSpectatorModal, setShowSpectatorModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const contentRef = useRef(null);
  const isContentInView = useInView(contentRef, { once: true, margin: "-100px" });
  
  // Notification hook
  const { success, info } = useNotification();
  
  // Generate floating particles
  useEffect(() => {
    const particleArray = [];
    for (let i = 0; i < 15; i++) {
      particleArray.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.3 + 0.2,
      });
    }
    setParticles(particleArray);
  }, []);
  
  // Mouse tracking
  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);
  
  // Check for existing battle room
  useEffect(() => {
    const checkExistingBattleRoom = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/battle/active`);
        const data = await response.json();
        
        if (data.battleRoom && data.battleRoom.status !== 'expired') {
          setActiveBattleRoom(data.battleRoom);
          setBattleRoomId(data.battleRoom.id);
        } else {
          setActiveBattleRoom(null);
          setBattleRoomId('');
        }
      } catch (error) {
        console.error('Failed to check existing battle room:', error);
      }
    };
    
    checkExistingBattleRoom();
    
    // Poll for battle room updates every 5 seconds
    const interval = setInterval(checkExistingBattleRoom, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Onboarding hook
  const { shouldShowTour, setShouldShowTour, startTour, markTutorialAsCompleted } = useOnboarding();

  useEffect(() => {
    const loadUserData = async () => {
      const token = secureStorage.getToken();
      
      if (token) {
        try {
          const userData = await secureStorage.getUserData();
          if (userData) {
            setUser(userData);
            
            // Check if this is a new user and start the tour
            const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
            if (!hasSeenTutorial) {
              console.log('🎯 Starting onboarding tour for new user');
              startTour();
              localStorage.setItem('hasSeenTutorial', 'true');
            }
          } else {
            navigate('/login');
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
      setIsLoading(false);
    };
    
    loadUserData();
  }, [navigate]);

  // Fetch chapters from API
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setChaptersLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/quizzes/chapters`, {
          headers: authHeader()
        });
        setChapters(response.data);
      } catch (error) {
        console.error('Failed to fetch chapters:', error);
        if (error.response?.status === 401) {
          secureStorage.clear();
          navigate('/login');
        }
        setChapters([]);
      } finally {
        setChaptersLoading(false);
      }
    };

    const fetchUnreadCount = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/user/inbox/unread-count`, {
          headers: authHeader()
        });
        setUnreadCount(response.data.count || 0);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchChapters();
    fetchUnreadCount();
    
    // Poll for unread messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    secureStorage.clear();
    window.dispatchEvent(new Event('userAuthChange')); // Dispatch event
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(`Are you sure you want to delete your account "${user?.username}"? This will permanently remove your account and all your data. This action cannot be undone.`)) {
      return;
    }
    
    if (!window.confirm('This is your final warning. Your account and all data will be permanently deleted. Are you absolutely sure?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      await axios.delete(`${apiUrl}/api/auth/delete-account`, {
        headers: authHeader()
      });
      
      // Clear auth data and redirect
      secureStorage.clear();
      window.dispatchEvent(new Event('userAuthChange'));
      alert('Your account has been successfully deleted.');
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = () => {
    if (!selectedChapter) {
      soundManager.play('error');
      alert('Please select a chapter to start the quiz.');
      return;
    }
    soundManager.play('success');
    navigate('/quiz', { state: { chapter: selectedChapter } });
  };

  const handleCreateBattle = async () => {
    if (!selectedBattleChapter) {
      alert('Please select a chapter for the battle.');
      return;
    }
    const roomId = `battle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Broadcast battle room creation to all users
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/battle/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader()
        },
        body: JSON.stringify({
          roomId,
          chapter: selectedBattleChapter
        })
      });
      
      if (response.ok) {
        success('Battle room created! Users can now join the battle.', {
          duration: 5000,
          title: '🔥 Battle Room Created!'
        });
      }
      
      navigate(`/battle/${roomId}`, { state: { chapter: selectedBattleChapter } });
    } catch (error) {
      console.error('Failed to create battle room:', error);
      // Fallback - still navigate to battle room
      navigate(`/battle/${roomId}`, { state: { chapter: selectedBattleChapter } });
    }
  };

  const handleJoinBattle = () => {
    if (!activeBattleRoom) {
      alert('No battle room available to join.');
      return;
    }
    navigate(`/battle/${activeBattleRoom.id}`);
  };

  const handleEndBattle = async () => {
    if (!activeBattleRoom) return;
    
    if (!window.confirm('Are you sure you want to end this battle? This will stop the battle for all participants.')) {
      return;
    }
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/battle/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader()
        },
        body: JSON.stringify({ 
          roomId: activeBattleRoom.id,
          reason: 'stopped'
        })
      });
      
      if (response.ok) {
        success('Battle ended successfully!', {
          duration: 3000,
          title: '🛑 Battle Stopped'
        });
        setActiveBattleRoom(null);
      } else {
        throw new Error('Failed to end battle');
      }
    } catch (error) {
      console.error('Failed to end battle:', error);
      alert('Failed to end battle. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center transition-colors duration-200">
        <LoadingAnimation message="Loading dashboard..." size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950 text-gray-900 dark:text-white transition-all duration-500 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, -10, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      
      {/* Interactive Cursor Effect */}
      <motion.div
        className="fixed w-6 h-6 rounded-full pointer-events-none z-[9999] bg-gradient-to-r from-cyan-500 to-purple-500 opacity-60 mix-blend-difference"
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
        }}
        animate={{ 
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-cyan-900 via-blue-900 to-purple-900 dark:from-gray-800 dark:via-gray-900 dark:to-purple-900 p-8 relative overflow-hidden"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-1"></div>
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
            <motion.div 
              className="welcome-section"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.h1 
                className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-purple-200"
              >
                Welcome back, {user?.username || 'Student'}! 🎓
              </motion.h1>
              <motion.p 
                className="text-cyan-200 text-base lg:text-lg flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🚀
                </motion.span>
                Ready to test your knowledge?
              </motion.p>
            </motion.div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  src={user?.avatar ? getAvatarUrl(user.avatar) : getFallbackAvatar(user?.username || 'User')}
                  alt={user?.username || 'User'}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-cyan-300 object-cover"
                  onError={(e) => { e.target.src = getFallbackAvatar(user?.username || 'User'); }}
                />
                <div className="text-left sm:text-right">
                  <p className="text-xs sm:text-sm text-cyan-200">Logged in as</p>
                  <p className="font-semibold text-white text-sm sm:text-base">{user?.email}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <SoundToggle className="text-xs" />
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-800 hover:bg-red-900 px-2 sm:px-4 py-2 rounded-lg transition-colors text-white text-xs sm:text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-3 sm:px-4 py-2 rounded-lg transition-colors text-white text-xs sm:text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        ref={contentRef}
        className="max-w-6xl mx-auto p-8 relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <motion.div 
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl hover:shadow-3xl transition-all duration-500 relative overflow-hidden group"
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <motion.h4 
              className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                ⚡
              </motion.span>
              Quick Actions
            </motion.h4>
            
            {/* Chapter Dropdown */}
            <div className="mb-4 chapter-selection relative z-20">
              <label htmlFor="chapter-select" className="text-cyan-600 dark:text-cyan-300 font-semibold mb-1 block">Select Chapter</label>
              <select 
                id="chapter-select" 
                className="px-4 py-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 border border-gray-300 dark:border-gray-600 w-full transition-colors relative z-20"
                value={selectedChapter}
                onChange={e => setSelectedChapter(e.target.value)}
                disabled={chaptersLoading}
              >
                <option value="">-- Choose a chapter --</option>
                {chapters.map(chapter => (
                  <option key={chapter._id || chapter.name} value={chapter.name}>
                    {chapter.name}
                  </option>
                ))}
              </select>
              {chaptersLoading && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading chapters...</p>}
            </div>

            {/* Start Quiz Button */}
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 20px 40px rgba(6, 182, 212, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartQuiz}
              onMouseEnter={() => soundManager.play('click')}
              className="start-quiz-btn bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 w-full relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
              <div className="flex items-center justify-center space-x-2 relative z-10">
                <motion.span 
                  className="text-2xl"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🚀
                </motion.span>
                <span>Start Quiz</span>
                <motion.div
                  className="absolute -right-1 -top-1 w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
            </motion.button>

            {/* Leaderboard Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { soundManager.play('transition'); navigate('/leaderboard'); }}
              onMouseEnter={() => soundManager.play('click')}
              className="leaderboard-link bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 w-full mt-4 relative z-20"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">🏆</span>
                <span>View Leaderboard</span>
              </div>
            </motion.button>

            {/* Badges Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { soundManager.play('transition'); navigate('/badges'); }}
              onMouseEnter={() => soundManager.play('click')}
              className="badges-link bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 w-full mt-4 relative z-20"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">🎯</span>
                <span>View Badges</span>
              </div>
            </motion.button>

            {/* View Profile Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { soundManager.play('transition'); navigate('/profile'); }}
              onMouseEnter={() => soundManager.play('click')}
              className="profile-section bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full mt-4 relative z-20"
            >
              <div className="flex items-center justify-center space-x-2">
                <FaUser className="text-lg" />
                <span>View Profile</span>
              </div>
            </motion.button>

            {/* Edit Profile Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { soundManager.play('transition'); navigate('/profile/edit'); }}
              onMouseEnter={() => soundManager.play('click')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full mt-4 relative z-20"
            >
              <div className="flex items-center justify-center space-x-2">
                <FaEdit className="text-lg" />
                <span>Edit Profile</span>
              </div>
            </motion.button>

            {/* WhatsApp Messenger Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { soundManager.play('transition'); navigate('/whatsapp'); }}
              onMouseEnter={() => soundManager.play('click')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full mt-4 relative"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">📱</span>
                <span>WhatsApp Messenger</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            </motion.button>

            {/* Inbox Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { soundManager.play('transition'); navigate('/inbox'); }}
              onMouseEnter={() => soundManager.play('click')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full mt-4 relative z-20"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">📬</span>
                <span>Inbox</span>
              </div>
            </motion.button>

            {/* Behind The Scenes Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { soundManager.play('transition'); navigate('/about'); }}
              onMouseEnter={() => soundManager.play('click')}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 w-full mt-4 relative z-20"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">🎬</span>
                <span>Behind The Scenes</span>
              </div>
            </motion.button>
          </motion.div>

          {/* Quiz Battle Section */}
          <div className="battle-section bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20 backdrop-blur-sm rounded-xl p-6 border border-orange-200/50 dark:border-orange-700/50 shadow-lg">
            <div className="flex items-center mb-4">
              <FaFire className="text-orange-500 text-2xl mr-2" />
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Quiz Battle</h4>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Challenge your friends in real-time multiplayer quiz battles!
            </p>
            
            {/* Admin-only Create Battle Section */}
            {user?.isAdmin === true && (
              <div className="mb-4">
                {/* Chapter Selection for Battle */}
                <div className="mb-3">
                  <label htmlFor="battle-chapter-select" className="text-orange-600 dark:text-orange-300 font-semibold mb-1 block text-sm">
                    Select Chapter for Battle
                  </label>
                  <select 
                    id="battle-chapter-select" 
                    className="px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 border border-gray-300 dark:border-gray-600 w-full transition-colors text-sm"
                    value={selectedBattleChapter}
                    onChange={e => setSelectedBattleChapter(e.target.value)}
                    disabled={chaptersLoading}
                  >
                    <option value="">-- Choose chapter for battle --</option>
                    {chapters.map(chapter => (
                      <option key={chapter._id || chapter.name} value={chapter.name}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Create Battle Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateBattle}
                  disabled={!selectedBattleChapter || (activeBattleRoom && activeBattleRoom.status === 'waiting')}
                  className={`w-full py-4 px-6 rounded-lg font-bold shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 mb-3 ${
                    selectedBattleChapter && (!activeBattleRoom || activeBattleRoom.status !== 'waiting')
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white' 
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FaPlus className="text-lg" />
                    <span>Create Battle Room</span>
                  </div>
                </motion.button>
                
                {/* End Battle Button - Only show if battle is active */}
                {activeBattleRoom && activeBattleRoom.status === 'started' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEndBattle}
                    className="w-full py-3 px-4 rounded-lg font-bold shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>🛑</span>
                      <span>End Battle</span>
                    </div>
                  </motion.button>
                )}
              </div>
            )}

            {/* Join Battle - For all users */}
            <div className="space-y-3">
              {activeBattleRoom && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-3">
                  <div className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                    ⚔️ Battle Available!
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-300">
                    Chapter: {activeBattleRoom.chapter}
                  </div>
                </div>
              )}
              <motion.button
                whileHover={{ scale: (activeBattleRoom && activeBattleRoom.status === 'waiting') ? 1.05 : 1 }}
                whileTap={{ scale: (activeBattleRoom && activeBattleRoom.status === 'waiting') ? 0.95 : 1 }}
                onClick={handleJoinBattle}
                disabled={!activeBattleRoom || activeBattleRoom.status !== 'waiting'}
                className={`w-full font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  activeBattleRoom && activeBattleRoom.status === 'waiting'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white focus:ring-green-500 animate-pulse' 
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <FaPlay className="text-sm" />
                  <span>
                    {!activeBattleRoom 
                      ? 'No Battle Available' 
                      : activeBattleRoom.status === 'started' 
                      ? 'Battle In Progress'
                      : activeBattleRoom.status === 'ended'
                      ? 'Battle Ended'
                      : 'Join Battle Now!'}
                  </span>
                </div>
              </motion.button>
              {!activeBattleRoom ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Waiting for an admin to create a battle room...
                </p>
              ) : activeBattleRoom.status === 'started' ? (
                <p className="text-sm text-orange-500 dark:text-orange-400 text-center">
                  Battle has already started. Wait for the next one!
                </p>
              ) : activeBattleRoom.status === 'ended' && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Battle has ended. Wait for the next one!
                </p>
              )}
              
              {/* Spectator Mode Button */}
              {activeBattleRoom && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSpectatorModal(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 mt-3"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FaEye className="text-sm" />
                    <span>Watch Battle</span>
                  </div>
                </motion.button>
              )}
              {activeBattleRoom && (
                <p className="text-xs text-purple-400 text-center mt-1">
                  Spectate the active battle in real-time
                </p>
              )}
            </div>
          </div>

          {/* Available Quizzes */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Available Quizzes</h4>
            {chaptersLoading ? (
              <div className="text-center py-8">
                <div className="text-cyan-600 dark:text-cyan-400">Loading quizzes...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {chapters.reduce((acc, chapter) => {
                  const subject = chapter.subject || 'General';
                  if (!acc[subject]) acc[subject] = [];
                  acc[subject].push(chapter);
                  return acc;
                }, {}) && Object.entries(chapters.reduce((acc, chapter) => {
                  const subject = chapter.subject || 'General';
                  if (!acc[subject]) acc[subject] = [];
                  acc[subject].push(chapter);
                  return acc;
                }, {})).map(([subject, subjectChapters]) => (
                  <div key={subject} className="bg-gray-100/80 dark:bg-gray-700/80 rounded-lg p-4 border border-gray-200/50 dark:border-gray-600/50">
                    <h5 className="font-bold text-purple-600 dark:text-purple-400 mb-3">{subject}</h5>
                    <div className="space-y-2">
                      {subjectChapters.map(chapter => (
                        <div key={chapter._id || chapter.name} className="bg-white/60 dark:bg-gray-600/60 rounded p-3 border border-gray-200/30 dark:border-gray-500/30">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h6 className="font-semibold text-cyan-600 dark:text-cyan-300">{chapter.name}</h6>
                              {chapter.description && (
                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{chapter.description}</p>
                              )}
                            </div>
                            <div className="text-right ml-3">
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {chapter.questionCount || 0} questions
                              </div>
                              {chapter.practiceMode && (
                                <div className="text-xs text-orange-600 dark:text-orange-400">Practice Mode</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Floating Help Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={startTour}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-3 sm:p-4 rounded-full shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-50"
        title="Take a tour of the platform"
      >
        <FaQuestionCircle className="text-lg sm:text-xl" />
      </motion.button>

      {/* Onboarding Tour */}
      <OnboardingTour
        shouldShowTour={shouldShowTour}
        setShouldShowTour={setShouldShowTour}
        onTourComplete={markTutorialAsCompleted}
      />
      
      {/* Spectator Access Modal */}
      {activeBattleRoom && (
        <SpectatorAccess
          isOpen={showSpectatorModal}
          onClose={() => setShowSpectatorModal(false)}
          roomId={activeBattleRoom.id}
          autoJoin={true}
        />
      )}
    </div>
  );
};

export default Dashboard;