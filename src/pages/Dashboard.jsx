import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedChapter, setSelectedChapter] = useState('');
  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    const token = localStorage.getItem('authToken');
    
    if (userData && token) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
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

  const handleStartQuiz = () => {
    if (!selectedChapter) {
      alert('Please select a chapter to start the quiz.');
      return;
    }
    navigate('/quiz', { state: { chapter: selectedChapter } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900 to-blue-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.username || 'Student'}! 🎓</h1>
              <p className="text-cyan-200 text-lg">Ready to test your knowledge?</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-cyan-200">Logged in as</p>
                <p className="font-semibold">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h4 className="text-lg font-semibold text-white mb-4">Quick Actions</h4>
            
            {/* Chapter Dropdown */}
            <div className="mb-4">
              <label htmlFor="chapter-select" className="text-cyan-300 font-semibold mb-1 block">Select Chapter</label>
              <select 
                id="chapter-select" 
                className="px-4 py-2 rounded bg-gray-800 text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full"
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
              {chaptersLoading && <p className="text-sm text-gray-400 mt-1">Loading chapters...</p>}
            </div>

            {/* Start Quiz Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartQuiz}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 w-full"
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
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 w-full mt-4"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">🏆</span>
                <span>View Leaderboard</span>
              </div>
            </motion.button>
          </div>

          {/* Available Chapters */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h4 className="text-lg font-semibold text-white mb-4">Available Chapters</h4>
            {chaptersLoading ? (
              <div className="text-center py-8">
                <div className="text-cyan-400">Loading chapters...</div>
              </div>
            ) : (
              <div className="space-y-3">
                {chapters.map(chapter => (
                  <div key={chapter._id || chapter.name} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <h5 className="font-semibold text-cyan-300">{chapter.name}</h5>
                    {chapter.description && (
                      <p className="text-gray-300 text-sm mt-1">{chapter.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
