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
  const [insightMode, setInsightMode] = useState('hsc');
  const [showScrollButton, setShowScrollButton] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const chaptersSection = document.getElementById('chapters-section');
      if (chaptersSection) {
        const rect = chaptersSection.getBoundingClientRect();
        setShowScrollButton(rect.top > window.innerHeight);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToChapters = () => {
    document.getElementById('chapters-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const token = secureStorage.getToken();
        const examId = insightMode === 'test' && exams[0] ? exams[0]._id : null;
        const res = await axios.get(`${API_URL}/api/progress/insights?examId=${examId || ''}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInsights(res.data.insights);
      } catch (error) {
        console.error('Failed to fetch insights:', error);
      }
    };
    if (exams.length > 0) fetchInsights();
  }, [insightMode, exams]);

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

      console.log('📊 Progress History from API:', progressRes.data.progress?.progressHistory);
      console.log('📊 Latest History Entry:', progressRes.data.progress?.progressHistory?.[progressRes.data.progress.progressHistory.length - 1]);
      console.log('📊 Full History JSON:', JSON.stringify(progressRes.data.progress?.progressHistory, null, 2));

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
      
      console.log('📊 Updated Progress History:', res.data.progress?.progressHistory);
      console.log('📊 Latest Entry After Update:', res.data.progress?.progressHistory?.[res.data.progress.progressHistory.length - 1]);
      
      setProgress(res.data.progress);
      
      // Refresh insights immediately
      const examId = insightMode === 'test' && exams[0] ? exams[0]._id : null;
      const insightsRes = await axios.get(`${API_URL}/api/progress/insights?examId=${examId || ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInsights(insightsRes.data.insights);
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

  const testReminder = async () => {
    try {
      const token = secureStorage.getToken();
      await axios.post(`${API_URL}/api/progress/test-reminder`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Test reminder sent to your WhatsApp!');
    } catch (error) {
      console.error('Failed to send test reminder:', error);
      alert('Failed to send test reminder');
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

  const calculateCategoryProgress = (category, examId = null) => {
    let relevantSubjects = subjects.filter(s => s.category === category);
    
    if (examId) {
      const exam = exams.find(e => e._id === examId);
      if (exam?.syllabus?.length) {
        let totalChapters = 0;
        let completedChapters = 0;
        
        exam.syllabus.forEach(syl => {
          const subjectId = syl.subjectId?._id || syl.subjectId;
          const subject = subjects.find(s => s._id.toString() === subjectId.toString() && s.category === category);
          if (subject && syl.chapters?.length) {
            totalChapters += syl.chapters.length;
            completedChapters += progress?.completedChapters.filter(c =>
              c.subjectId._id.toString() === subjectId.toString() && syl.chapters.includes(c.chapter)
            ).length || 0;
          }
        });
        
        return totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
      }
    }
    
    if (!relevantSubjects.length) return 0;
    const totalChapters = relevantSubjects.reduce((sum, s) => sum + s.chapters.length, 0);
    const completed = progress?.completedChapters.filter(c =>
      relevantSubjects.some(s => s._id === c.subjectId._id)
    ).length || 0;
    return Math.round((completed / totalChapters) * 100);
  };

  const calculateTotalProgress = (examId = null) => {
    if (examId) {
      const exam = exams.find(e => e._id === examId);
      console.log('🔍 Calculate Total Progress for Exam:', examId);
      console.log('  - Exam found:', !!exam);
      console.log('  - Exam syllabus:', exam?.syllabus);
      
      if (exam?.syllabus?.length) {
        let totalChapters = 0;
        let completedChapters = 0;
        
        exam.syllabus.forEach(syl => {
          const subjectId = syl.subjectId?._id || syl.subjectId;
          console.log('  - Syllabus subject:', subjectId, 'chapters:', syl.chapters?.length);
          
          if (syl.chapters?.length) {
            totalChapters += syl.chapters.length;
            const completed = progress?.completedChapters.filter(c => {
              const match = c.subjectId._id.toString() === subjectId.toString() && syl.chapters.includes(c.chapter);
              return match;
            }).length || 0;
            completedChapters += completed;
            console.log('    - Completed:', completed);
          }
        });
        
        const percentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
        console.log('  - Total:', totalChapters, 'Completed:', completedChapters, 'Percentage:', percentage);
        return percentage;
      }
    }
    
    const totalChapters = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
    const completed = progress?.completedChapters.filter(c =>
      subjects.some(s => s._id === c.subjectId._id)
    ).length || 0;
    return Math.round((completed / totalChapters) * 100);
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
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Progress Tracking</h1>
          <p className="text-gray-300">Track your study progress and stay motivated</p>
        </motion.div>

        {/* Exam Timeline */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Upcoming Exams</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exams.map((exam, i) => (
              <motion.div
                key={exam._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-4 border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-cyan-400">NeuraX AI Insights</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setInsightMode('hsc')}
                      className={`px-4 py-1 rounded-lg text-sm font-semibold transition-all ${
                        insightMode === 'hsc' 
                          ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/50' 
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      HSC
                    </button>
                    <button
                      onClick={() => setInsightMode('test')}
                      className={`px-4 py-1 rounded-lg text-sm font-semibold transition-all ${
                        insightMode === 'test' 
                          ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/50' 
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      Test
                    </button>
                  </div>
                </div>
                <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-3 border border-cyan-500/30 max-h-64 overflow-y-auto">
                  <div className="space-y-1.5">
                    {insights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`text-lg flex-shrink-0 ${
                          insight.type === 'success' ? 'text-green-400' :
                          insight.type === 'warning' ? 'text-yellow-400' :
                          insight.type === 'urgent' ? 'text-red-400' :
                          'text-blue-400'
                        }`}>
                          {insight.type === 'success' ? '✓' :
                           insight.type === 'warning' ? '⚠' :
                           insight.type === 'urgent' ? '⚡' : '•'}
                        </span>
                        <p className="text-gray-200 text-xs md:text-sm leading-tight" dangerouslySetInnerHTML={{ __html: insight.text }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Overall Progress */}
            <div className={insights.length > 0 ? '' : 'lg:col-span-3'}>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">Overall Progress</h2>
              <div className="grid grid-cols-1 gap-4">
                <ProgressCard 
                  title="BEI Progress" 
                  hscProgress={calculateCategoryProgress('BEI')} 
                  testProgress={exams[0] ? calculateCategoryProgress('BEI', exams[0]._id) : null}
                  color="blue" 
                />
                <ProgressCard 
                  title="Science Progress" 
                  hscProgress={calculateCategoryProgress('Science')} 
                  testProgress={exams[0] ? calculateCategoryProgress('Science', exams[0]._id) : null}
                  color="purple" 
                />
                <ProgressCard 
                  title="Total Progress" 
                  hscProgress={calculateTotalProgress()} 
                  testProgress={exams[0] ? calculateTotalProgress(exams[0]._id) : null}
                  color="green" 
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Graph */}
        {progress?.progressHistory?.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Progress History</h2>
            <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progress.progressHistory.slice(-30).map(entry => ({
                  ...entry,
                  date: new Date(entry.date).toLocaleDateString(),
                  totalProgress: Math.round(entry.totalProgress || 0),
                  beiProgress: Math.round(entry.beiProgress || 0),
                  scienceProgress: Math.round(entry.scienceProgress || 0),
                  testProgress: Math.round(entry.testProgress || 0)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="date" stroke="#fff" />
                  <YAxis stroke="#fff" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #0ff', borderRadius: '8px' }}
                    formatter={(value) => `${value}%`}
                  />
                  <Line type="monotone" dataKey="totalProgress" stroke="#00ff88" strokeWidth={2} name="HSC Total" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="beiProgress" stroke="#00aaff" strokeWidth={2} name="HSC BEI" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="scienceProgress" stroke="#aa00ff" strokeWidth={2} name="HSC Science" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="testProgress" stroke="#ff00ff" strokeWidth={3} name="Test" strokeDasharray="5 5" dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Badges */}
        {progress?.badges?.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Achievements</h2>
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
          <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-1">WhatsApp Reminders</h3>
                <p className="text-gray-400 text-sm">Get daily progress updates via WhatsApp</p>
              </div>
              <button
                onClick={toggleReminder}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  whatsappReminder ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    whatsappReminder ? 'translate-x-8' : ''
                  }`}
                />
              </button>
            </div>
            <button
              onClick={testReminder}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-purple-600/50 transition-all"
            >
              🧪 Test Reminder
            </button>
          </div>
        </motion.div>

        {/* Subjects & Chapters */}
        <motion.div id="chapters-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Subjects & Chapters</h2>
          <div className="space-y-6">
            {subjects.map((subject, i) => (
              <motion.div
                key={subject._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
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

      {/* Floating Scroll Button */}
      {showScrollButton && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={scrollToChapters}
          className="fixed top-20 right-2 md:top-24 md:right-8 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-2 py-1.5 md:px-6 md:py-3 rounded-full shadow-2xl shadow-cyan-500/50 flex items-center gap-1 md:gap-2 text-xs md:text-base font-semibold z-50 hover:scale-110 transition-transform"
          style={{ animation: 'bounce 2s infinite' }}
        >
          <span className="hidden md:inline">Select Completed Chapters</span>
          <span className="md:hidden">Chapters</span>
          <svg className="w-3 h-3 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.button>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

function ProgressCard({ title, hscProgress, testProgress, color }) {
  const colors = {
    blue: { from: '#3b82f6', to: '#06b6d4' },
    purple: { from: '#a855f7', to: '#ec4899' },
    green: { from: '#10b981', to: '#059669' }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-4 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
      <h3 className="text-base font-semibold text-cyan-400 mb-3">{title}</h3>
      <div className="flex items-center justify-around">
        {/* HSC Progress */}
        <div className="text-center">
          <p className="text-xs text-gray-300 mb-2">HSC</p>
          <div className="relative w-20 h-20">
            <svg className="transform -rotate-90 w-20 h-20">
              <circle cx="40" cy="40" r="32" stroke="#ffffff20" strokeWidth="5" fill="none" />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke={colors[color].from}
                strokeWidth="5"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - hscProgress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white">{hscProgress}%</span>
            </div>
          </div>
        </div>
        
        {/* Test Progress */}
        {testProgress !== null && (
          <div className="text-center">
            <p className="text-xs text-gray-300 mb-2">Test</p>
            <div className="relative w-20 h-20">
              <svg className="transform -rotate-90 w-20 h-20">
                <circle cx="40" cy="40" r="32" stroke="#ffffff20" strokeWidth="5" fill="none" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke={colors[color].to}
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - testProgress / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{testProgress}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
