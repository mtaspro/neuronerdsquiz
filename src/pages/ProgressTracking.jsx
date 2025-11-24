import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import getEnvironmentConfig from '../config/environment';
import { secureStorage } from '../utils/secureStorage';

const { apiUrl: API_URL } = getEnvironmentConfig();

export default function ProgressTracking() {
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [progress, setProgress] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [whatsappReminder, setWhatsappReminder] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = secureStorage.getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      const [subjectsRes, examsRes, progressRes, insightsRes] = await Promise.all([
        axios.get(`${API_URL}/api/progress/subjects`, { headers }),
        axios.get(`${API_URL}/api/progress/exams`, { headers }),
        axios.get(`${API_URL}/api/progress/user`, { headers }),
        axios.get(`${API_URL}/api/progress/insights`, { headers })
      ]);

      setSubjects(subjectsRes.data.subjects);
      setExams(examsRes.data.exams);
      setProgress(progressRes.data.progress);
      setInsights(insightsRes.data.insights);
      setWhatsappReminder(progressRes.data.progress?.whatsappReminder || false);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoading(false);
    }
  };

  const toggleChapter = async (subjectId, chapter) => {
    const isCompleted = progress.completedChapters.some(
      c => c.subjectId._id === subjectId && c.chapter === chapter
    );

    try {
      const token = secureStorage.getToken();
      const res = await axios.post(`${API_URL}/api/progress/update`, 
        { subjectId, chapter, completed: !isCompleted },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setProgress(res.data.progress);
      if (res.data.newBadges?.length > 0) {
        fetchData(); // Refresh insights
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const toggleReminder = async () => {
    try {
      const token = secureStorage.getToken();
      await axios.post(`${API_URL}/api/progress/reminder-toggle`, 
        { enabled: !whatsappReminder },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWhatsappReminder(!whatsappReminder);
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
    }
  };

  const calculateProgress = (subjectId) => {
    const subject = subjects.find(s => s._id === subjectId);
    if (!subject) return 0;
    const completed = progress?.completedChapters.filter(
      c => c.subjectId._id === subjectId
    ).length || 0;
    return Math.round((completed / subject.chapters.length) * 100);
  };

  const calculateCategoryProgress = (category) => {
    const categorySubjects = subjects.filter(s => s.category === category);
    const totalChapters = categorySubjects.reduce((sum, s) => sum + s.chapters.length, 0);
    const completed = progress?.completedChapters.filter(c =>
      categorySubjects.some(s => s._id === c.subjectId._id)
    ).length || 0;
    return Math.round((completed / totalChapters) * 100);
  };

  const calculateTotalProgress = () => {
    const totalChapters = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
    return Math.round(((progress?.completedChapters.length || 0) / totalChapters) * 100);
  };

  const getCountdown = (examDate) => {
    const days = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days left` : 'Exam passed';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Progress Tracking</h1>
          <p className="text-gray-300">Track your study progress and stay motivated</p>
        </motion.div>

        {/* Exam Timeline */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Upcoming Exams</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exams.map((exam, i) => (
              <motion.div
                key={exam._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
              >
                <h3 className="text-xl font-bold text-white mb-2">{exam.name}</h3>
                <p className="text-blue-300 text-sm mb-2">{new Date(exam.date).toLocaleDateString()}</p>
                <p className="text-yellow-400 font-semibold">{getCountdown(exam.date)}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Insights & Overall Progress */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Insights */}
            {insights.length > 0 && (
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-white mb-4">NeuraX AI Insights</h2>
                <div className="space-y-2">
                  {insights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-3 rounded-lg text-sm ${
                        insight.type === 'success' ? 'bg-green-500/20 border-green-500' :
                        insight.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500' :
                        insight.type === 'urgent' ? 'bg-red-500/20 border-red-500' :
                        'bg-blue-500/20 border-blue-500'
                      } border`}
                    >
                      <p className="text-white">{insight.text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Overall Progress */}
            <div className={insights.length > 0 ? '' : 'lg:col-span-3'}>
              <h2 className="text-2xl font-bold text-white mb-4">Overall Progress</h2>
              <div className="grid grid-cols-1 gap-4">
                <ProgressCard title="BEI Progress" progress={calculateCategoryProgress('BEI')} color="blue" />
                <ProgressCard title="Science Progress" progress={calculateCategoryProgress('Science')} color="purple" />
                <ProgressCard title="Total Progress" progress={calculateTotalProgress()} color="green" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Graph */}
        {progress?.progressHistory?.length > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Progress History</h2>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progress.progressHistory.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="date" stroke="#fff" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                  <YAxis stroke="#fff" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: 'none' }} />
                  <Line type="monotone" dataKey="totalProgress" stroke="#00ff88" strokeWidth={2} name="Total" />
                  <Line type="monotone" dataKey="beiProgress" stroke="#00aaff" strokeWidth={2} name="BEI" />
                  <Line type="monotone" dataKey="scienceProgress" stroke="#aa00ff" strokeWidth={2} name="Science" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Badges */}
        {progress?.badges?.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Achievements</h2>
            <div className="flex flex-wrap gap-3">
              {progress.badges.map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-semibold"
                >
                  {badge.includes('50_complete') ? '🏅 50% Complete' :
                   badge.includes('streak') ? '🔥 7 Day Streak' :
                   badge.includes('master') ? '🏆 Subject Master' : badge}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* WhatsApp Reminder Toggle */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">WhatsApp Reminders</h3>
              <p className="text-gray-300 text-sm">Get daily progress updates via WhatsApp</p>
            </div>
            <button
              onClick={toggleReminder}
              className={`relative w-16 h-8 rounded-full transition-colors ${
                whatsappReminder ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  whatsappReminder ? 'translate-x-8' : ''
                }`}
              />
            </button>
          </div>
        </motion.div>

        {/* Subjects & Chapters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-2xl font-bold text-white mb-4">Subjects & Chapters</h2>
          <div className="space-y-6">
            {subjects.map((subject, i) => (
              <motion.div
                key={subject._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">{subject.name}</h3>
                  <span className="text-blue-300 font-semibold">{calculateProgress(subject._id)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${calculateProgress(subject._id)}%` }}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {subject.chapters.map((chapter, j) => {
                    const isCompleted = progress?.completedChapters.some(
                      c => c.subjectId._id === subject._id && c.chapter === chapter
                    );
                    return (
                      <label key={j} className="flex items-center space-x-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => toggleChapter(subject._id, chapter)}
                          className="w-5 h-5 rounded border-2 border-blue-500 cursor-pointer accent-blue-500"
                        />
                        <span className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-white'} group-hover:text-blue-300 transition-colors`}>
                          {chapter}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ProgressCard({ title, progress, color }) {
  const colors = {
    blue: { from: '#3b82f6', to: '#06b6d4' },
    purple: { from: '#a855f7', to: '#ec4899' },
    green: { from: '#10b981', to: '#059669' }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <div className="relative w-24 h-24 mx-auto">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle cx="48" cy="48" r="40" stroke="#ffffff20" strokeWidth="6" fill="none" />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke={colors[color].from}
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
