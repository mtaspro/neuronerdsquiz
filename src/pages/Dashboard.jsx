import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaFire, FaUsers, FaPlay, FaPlus, FaUser, FaCog, FaQuestionCircle, FaCopy, FaEye } from 'react-icons/fa';
import { getAvatarUrl, getFallbackAvatar } from '../utils/avatarUtils';
import { useOnboarding } from '../hooks/useOnboarding';
import OnboardingTour from '../components/OnboardingTour';
import { useNotification } from '../components/NotificationSystem';
import SpectatorAccess from '../components/SpectatorAccess';
import SoundToggle from '../components/SoundToggle';
import soundManager from '../utils/soundUtils';

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
  
  // Notification hook
  const { success, info } = useNotification();
  
  // Check for existing battle room
  useEffect(() => {
    const checkExistingBattleRoom = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/battle/active`);
        const data = await response.json();
        
        if (data.battleRoom) {
          setActiveBattleRoom(data.battleRoom);
          setBattleRoomId(data.battleRoom.id);
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
    const userData = localStorage.getItem('userData');
    const token = localStorage.getItem('authToken');
    
    if (userData && token) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Check if this is a new user and start the tour
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (!hasSeenTutorial) {
          console.log('🎯 Starting onboarding tour for new user');
          startTour();
          localStorage.setItem('hasSeenTutorial', 'true');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
    setIsLoading(false);
  }, [navigate]);

  // Fetch chapters from API
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setChaptersLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${apiUrl}/api/quizzes/chapters`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChapters(response.data);
      } catch (error) {
        console.error('Failed to fetch chapters:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          navigate('/login');
        }
        setChapters([]);
      } finally {
        setChaptersLoading(false);
      }
    };

    fetchChapters();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
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
      const token = localStorage.getItem('authToken');
      
      await axios.delete(`${apiUrl}/api/auth/delete-account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clear auth data and redirect
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
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
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-gray-800 dark:text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900 to-blue-900 dark:from-gray-800 dark:to-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
            <div className="welcome-section">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-white">Welcome back, {user?.username || 'Student'}! 🎓</h1>
              <p className="text-cyan-200 text-base lg:text-lg">Ready to test your knowledge?</p>
            </div>
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
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h4>
            
            {/* Chapter Dropdown */}
            <div className="mb-4 chapter-selection">
              <label htmlFor="chapter-select" className="text-cyan-600 dark:text-cyan-300 font-semibold mb-1 block">Select Chapter</label>
              <select 
                id="chapter-select" 
                className="px-4 py-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 border border-gray-300 dark:border-gray-600 w-full transition-colors"
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartQuiz}
              onMouseEnter={() => soundManager.play('click')}
              className="start-quiz-btn bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 w-full"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">🚀</span>
                <span>Start Quiz</span>
              </div>
            </motion.button>

            {/* Leaderboard Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { soundManager.play('transition'); navigate('/leaderboard'); }}
              onMouseEnter={() => soundManager.play('click')}
              className="leaderboard-link bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 w-full mt-4"
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
              className="badges-link bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 w-full mt-4"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">🎯</span>
                <span>View Badges</span>
              </div>
            </motion.button>

            {/* Edit Profile Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { soundManager.play('transition'); navigate('/profile/edit'); }}
              onMouseEnter={() => soundManager.play('click')}
              className="profile-section bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full mt-4"
            >
              <div className="flex items-center justify-center space-x-2">
                <FaUser className="text-lg" />
                <span>Edit Profile</span>
              </div>
            </motion.button>

            {/* Behind The Scenes Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { soundManager.play('transition'); navigate('/about'); }}
              onMouseEnter={() => soundManager.play('click')}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 w-full mt-4"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">🎬</span>
                <span>Behind The Scenes</span>
              </div>
            </motion.button>
          </div>

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
                  disabled={!selectedBattleChapter}
                  className={`w-full py-4 px-6 rounded-lg font-bold shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                    selectedBattleChapter 
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white' 
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FaPlus className="text-lg" />
                    <span>Create Battle Room</span>
                  </div>
                </motion.button>
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
                      : 'Join Battle Now!'}
                  </span>
                </div>
              </motion.button>
              {!activeBattleRoom ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Waiting for an admin to create a battle room...
                </p>
              ) : activeBattleRoom.status === 'started' && (
                <p className="text-sm text-orange-500 dark:text-orange-400 text-center">
                  Battle has already started. Wait for the next one!
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
      </div>

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