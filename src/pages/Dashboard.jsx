import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaFire, FaUsers, FaPlay, FaPlus, FaUser, FaCog, FaQuestionCircle } from 'react-icons/fa';
import { getAvatarUrl, getFallbackAvatar } from '../utils/avatarUtils';
import { useOnboarding } from '../hooks/useOnboarding';

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
  
  // Onboarding hook
  const { startTour } = useOnboarding();

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
        const response = await axios.get(`${apiUrl}/api/quizzes/chapters`);
        setChapters(response.data);
      } catch (error) {
        console.error('Failed to fetch chapters:', error);
        // Fallback to default chapters if API fails
        setChapters([
          { name: 'Chapter-1', description: 'Introduction to Basics' },
          { name: 'Chapter-2', description: 'Advanced Concepts' },
          { name: 'Chapter-3', description: 'Practical Applications' },
          { name: 'Chapter-4', description: 'Final Assessment' }
        ]);
      } finally {
        setChaptersLoading(false);
      }
    };

    fetchChapters();
  }, []);

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
      
      await axios.delete(`${apiUrl}/api/admin/users/${user._id}`, {
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
      alert('Please select a chapter to start the quiz.');
      return;
    }
    navigate('/quiz', { state: { chapter: selectedChapter } });
  };

  const handleCreateBattle = () => {
    if (!selectedBattleChapter) {
      alert('Please select a chapter for the battle.');
      return;
    }
    const roomId = `battle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    navigate(`/battle/${roomId}`, { state: { chapter: selectedBattleChapter } });
  };

  const handleJoinBattle = () => {
    if (!battleRoomId.trim()) {
      alert('Please enter a room ID to join.');
      return;
    }
    navigate(`/battle/${battleRoomId.trim()}`);
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
          <div className="flex justify-between items-center mb-8">
            <div className="welcome-section">
              <h1 className="text-4xl font-bold mb-2 text-white">Welcome back, {user?.username || 'Student'}! 🎓</h1>
              <p className="text-cyan-200 text-lg">Ready to test your knowledge?</p>
            </div>
            <div className="flex items-center space-x-4">
              {user?.avatar && (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={user.username || 'User'}
                  className="w-12 h-12 rounded-full border-2 border-cyan-300 object-cover"
                  onError={(e) => { e.target.src = getFallbackAvatar(user.username || 'User'); }}
                />
              )}
              <div className="text-right">
                <p className="text-sm text-cyan-200">Logged in as</p>
                <p className="font-semibold text-white">{user?.email}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-800 hover:bg-red-900 px-4 py-2 rounded-lg transition-colors text-white text-sm"
                >
                  Delete Account
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-white"
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
              onClick={() => navigate('/leaderboard')}
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
              onClick={() => navigate('/badges')}
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
              onClick={() => navigate('/profile/edit')}
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
              onClick={() => navigate('/about')}
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
            {user?.isAdmin && (
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

            {/* Join Battle */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={battleRoomId}
                onChange={(e) => setBattleRoomId(e.target.value)}
                className="w-full px-4 py-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-orange-400 border border-gray-300 dark:border-gray-600 transition-colors"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleJoinBattle}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full"
              >
                <div className="flex items-center justify-center space-x-2">
                  <FaPlay className="text-sm" />
                  <span>Join Battle</span>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Available Chapters */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Available Chapters</h4>
            {chaptersLoading ? (
              <div className="text-center py-8">
                <div className="text-cyan-600 dark:text-cyan-400">Loading chapters...</div>
              </div>
            ) : (
              <div className="space-y-3">
                {chapters.map(chapter => (
                  <div key={chapter._id || chapter.name} className="bg-gray-100/80 dark:bg-gray-700/80 rounded-lg p-4 border border-gray-200/50 dark:border-gray-600/50 transition-colors">
                    <h5 className="font-semibold text-cyan-600 dark:text-cyan-300">{chapter.name}</h5>
                    {chapter.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{chapter.description}</p>
                    )}
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
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-4 rounded-full shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-50"
        title="Take a tour of the platform"
      >
        <FaQuestionCircle className="text-xl" />
      </motion.button>
    </div>
  );
};

export default Dashboard;