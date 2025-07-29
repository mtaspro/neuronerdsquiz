import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CHAPTERS = [
  'Chapter-1',
  'Chapter-2',
  'Chapter-3',
  'Chapter-4',
];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedChapter, setSelectedChapter] = useState('');

  // Mock user data - in real app, this would come from authentication context/API
  const mockUser = {
    username: 'NeuroNerd123',
    email: 'user@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
    joinDate: '2024-01-15',
    quizzesTaken: 12,
    bestScore: 95,
    totalPoints: 1250
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      // Use mock data as fallback
      setUser(mockUser);
    }
    
    setIsLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    // Clear user session/token
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Navigate to login page
    navigate('/login');
  };

  const handleStartQuiz = () => {
    if (!selectedChapter) {
      alert('Please select a chapter to start the quiz.');
      return;
    }
    navigate('/quiz', { state: { chapter: selectedChapter } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-white border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-black/20 backdrop-blur-sm border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Neuronerds Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* User Profile Card */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-center">
                <motion.img
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  src={user.avatar}
                  alt={user.username}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white/20"
                />
                <h2 className="text-2xl font-bold text-white mb-2">{user.username}</h2>
                <p className="text-gray-300 mb-4">{user.email}</p>
                
                {/* User Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Quizzes Taken:</span>
                    <span className="text-white font-semibold">{user.quizzesTaken}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Best Score:</span>
                    <span className="text-green-400 font-semibold">{user.bestScore}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Points:</span>
                    <span className="text-yellow-400 font-semibold">{user.totalPoints}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Member Since:</span>
                    <span className="text-white font-semibold">{new Date(user.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Dashboard Content */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Welcome Message */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-2">
                Welcome back, {user.username}! 🧠
              </h3>
              <p className="text-gray-300">
                Ready to challenge your mind with some brain-teasing questions? 
                Your neurons are waiting for their next workout!
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h4 className="text-lg font-semibold text-white mb-4">Quick Actions</h4>
              {/* Chapter Dropdown */}
              <div className="mb-4">
                <label htmlFor="chapter-select" className="text-cyan-300 font-semibold mb-1 block">Select Chapter</label>
                <select
                  id="chapter-select"
                  className="px-4 py-2 rounded bg-gray-800 text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  value={selectedChapter}
                  onChange={e => setSelectedChapter(e.target.value)}
                >
                  <option value="">-- Choose a chapter --</option>
                  {CHAPTERS.map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>
              {/* Start Quiz Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartQuiz}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">🚀</span>
                  <span>Start Quiz</span>
                </div>
              </motion.button>

                {/* View Leaderboard */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/leaderboard')}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">🏆</span>
                    <span>Leaderboard</span>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h4 className="text-lg font-semibold text-white mb-4">Recent Activity</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <span className="text-green-400 text-xl">✅</span>
                  <div>
                    <p className="text-white font-medium">Completed "Science Quiz #5"</p>
                    <p className="text-gray-400 text-sm">Score: 88% • 2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <span className="text-yellow-400 text-xl">🎯</span>
                  <div>
                    <p className="text-white font-medium">New personal best!</p>
                    <p className="text-gray-400 text-sm">95% on "Math Challenge" • 1 week ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <span className="text-blue-400 text-xl">🏅</span>
                  <div>
                    <p className="text-white font-medium">Reached 1000 total points</p>
                    <p className="text-gray-400 text-sm">Milestone achieved • 2 weeks ago</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Particles Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
