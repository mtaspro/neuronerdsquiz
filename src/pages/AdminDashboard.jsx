import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MathText from '../components/MathText';
import AILatexGenerator from '../components/AILatexGenerator';
import axios from 'axios';

const TABS = ['Users', 'Chapters', 'Questions', 'Leaderboard Reset'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Users');
  const [users, setUsers] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check admin access on mount
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/auth/validate`, { 
          headers: authHeader() 
        });
        
        if (!response.data.valid || !response.data.user?.isAdmin) {
          navigate('/login');
        }
        setLoading(false);
      } catch (err) {
        console.error('AdminDashboard - Access Check Error:', err);
        navigate('/login');
      }
    };

    checkAdminAccess();
  }, [navigate]);
  const [newQuestion, setNewQuestion] = useState({ question: '', options: ['', '', '', ''], correctAnswer: '', chapter: '', duration: 60 });
  const [newChapter, setNewChapter] = useState({ name: '', description: '', order: 0, visible: true });
  const [editingId, setEditingId] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null);
  const [editChapter, setEditChapter] = useState(null);
  const [resetMsg, setResetMsg] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  function authHeader() {
    const token = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    console.log('AdminDashboard - Token from localStorage:', token ? 'Present' : 'Missing');
    console.log('AdminDashboard - User Data:', userData);
    console.log('AdminDashboard - Is Admin:', userData.isAdmin);
    
    if (token) {
      console.log('AdminDashboard - Token length:', token.length);
      try {
        // Log the token parts (without revealing the signature)
        const [header, payload] = token.split('.');
        console.log('AdminDashboard - Token header:', atob(header));
        console.log('AdminDashboard - Token payload:', atob(payload));
      } catch (e) {
        console.error('AdminDashboard - Invalid token format');
      }
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Load users
  useEffect(() => {
    if (tab !== 'Users') return;
    
    const loadUsers = async () => {
      setLoading(true);
      setError('');
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        console.log('AdminDashboard - API URL:', apiUrl);
        
        // First validate the token
        const validationResponse = await axios.get(`${apiUrl}/api/auth/validate`, { 
          headers: authHeader() 
        });
        console.log('AdminDashboard - Token validation response:', validationResponse.data);
        
        if (!validationResponse.data.valid) {
          throw new Error('Invalid token');
        }
        
        if (!validationResponse.data.user?.isAdmin) {
          throw new Error('Not authorized as admin');
        }
        
        const response = await axios.get(`${apiUrl}/api/admin/users`, { 
          headers: authHeader() 
        });
        setUsers(response.data);
      } catch (err) {
        console.error('AdminDashboard - Error:', err.response || err);
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load users';
        setError(errorMessage);
        
        // If token is invalid, clear auth data
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [tab]);

  // Load chapters
  useEffect(() => {
    if (tab !== 'Chapters') return;
    
    const loadChapters = async () => {
      setLoading(true);
      setError('');
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/admin/chapters`, { 
          headers: authHeader() 
        });
        setChapters(response.data);
      } catch (err) {
        console.error('AdminDashboard - Chapters Error:', err.response || err);
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load chapters';
        setError(errorMessage);
        
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    loadChapters();
  }, [tab]);

  // Load questions
  useEffect(() => {
    if (tab !== 'Questions') return;
    
    const loadQuestions = async () => {
      setLoading(true);
      setError('');
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/admin/questions`, { 
          headers: authHeader() 
        });
        setQuestions(response.data);
      } catch (err) {
        console.error('AdminDashboard - Questions Error:', err.response || err);
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load questions';
        setError(errorMessage);
        
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [tab]);

  // Delete user
  function handleDeleteUser(userId, username, isAdmin) {
    if (isAdmin) {
      setError('Cannot delete admin users');
      return;
    }
    
    if (!window.confirm(`Delete user "${username}"? This will permanently remove the user and all their data. This action cannot be undone.`)) return;
    
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.delete(`${apiUrl}/api/admin/users/${userId}`, { headers: authHeader() })
      .then(() => {
        setUsers(users => users.filter(u => u._id !== userId));
        setError(''); // Clear any previous errors
      })
      .catch(err => {
        const errorMsg = err.response?.data?.error || 'Failed to delete user';
        setError(errorMsg);
      })
      .finally(() => setLoading(false));
  }

  // Reset user score
  function handleResetUserScore(userId, username) {
    if (!window.confirm(`Reset all scores for user "${username}"? This will remove them from the leaderboard.`)) return;
    
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.post(`${apiUrl}/api/admin/users/${userId}/reset-score`, {}, { headers: authHeader() })
      .then(() => {
        setError(''); // Clear any previous errors
        // You could add a success message here if needed
      })
      .catch(err => {
        const errorMsg = err.response?.data?.error || 'Failed to reset user score';
        setError(errorMsg);
      })
      .finally(() => setLoading(false));
  }

  // Add new chapter
  function handleAddChapter(e) {
    e.preventDefault();
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.post(`${apiUrl}/api/admin/chapters`, newChapter, { headers: authHeader() })
      .then(res => {
        setChapters(chs => [...chs, res.data]);
        setNewChapter({ name: '', description: '', order: 0 });
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to add chapter'))
      .finally(() => setLoading(false));
  }

  // Edit chapter
  function handleEditChapter(e) {
    e.preventDefault();
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.put(`${apiUrl}/api/admin/chapters/${editingId}`, editChapter, { headers: authHeader() })
      .then(res => {
        setChapters(chs => chs.map(ch => ch._id === editingId ? res.data : ch));
        setEditingId(null);
        setEditChapter(null);
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to edit chapter'))
      .finally(() => setLoading(false));
  }

  // Delete chapter
  function handleDeleteChapter(id) {
    if (!window.confirm('Delete this chapter? All questions in this chapter will also be deleted.')) return;
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.delete(`${apiUrl}/api/admin/chapters/${id}`, { headers: authHeader() })
      .then(() => setChapters(chs => chs.filter(ch => ch._id !== id)))
      .catch(() => setError('Failed to delete chapter'))
      .finally(() => setLoading(false));
  }

  // Add new question
  function handleAddQuestion(e) {
    e.preventDefault();
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.post(`${apiUrl}/api/admin/questions`, newQuestion, { headers: authHeader() })
      .then(res => {
        setQuestions(qs => [...qs, res.data]);
        setNewQuestion({ question: '', options: ['', '', '', ''], correctAnswer: '', chapter: '', duration: 60 });
      })
      .catch(() => setError('Failed to add question'))
      .finally(() => setLoading(false));
  }

  // Edit question
  function handleEditQuestion(e) {
    e.preventDefault();
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.put(`${apiUrl}/api/admin/questions/${editingId}`, editQuestion, { headers: authHeader() })
      .then(res => {
        setQuestions(qs => qs.map(q => q._id === editingId ? res.data : q));
        setEditingId(null);
        setEditQuestion(null);
      })
      .catch(() => setError('Failed to edit question'))
      .finally(() => setLoading(false));
  }

  // Delete question
  function handleDeleteQuestion(id) {
    if (!window.confirm('Delete this question?')) return;
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.delete(`${apiUrl}/api/admin/questions/${id}`, { headers: authHeader() })
      .then(() => setQuestions(qs => qs.filter(q => q._id !== id)))
      .catch(() => setError('Failed to delete question'))
      .finally(() => setLoading(false));
  }

  // Reset leaderboard
  function handleResetLeaderboard() {
    if (!window.confirm('Reset the leaderboard? This cannot be undone.')) return;
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.post(`${apiUrl}/api/admin/leaderboard/reset`, {}, { headers: authHeader() })
      .then(() => setResetMsg('Leaderboard reset!'))
      .catch(() => setError('Failed to reset leaderboard'))
      .finally(() => setLoading(false));
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Admin Dashboard</h1>
        
        <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button
              key={t}
              className={`flex-shrink-0 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                tab === t 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
              }`}
              onClick={() => { setTab(t); setError(''); setResetMsg(''); }}
            >
              {t}
            </button>
          ))}
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {tab === 'Users' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">Loading users...</div>
            ) : (
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="p-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Username</th>
                    <th className="p-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Email</th>
                    <th className="p-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Admin</th>
                    <th className="p-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="p-4 text-gray-800 dark:text-white">{u.username}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">{u.email}</td>
                      <td className="p-4">{u.isAdmin ? '✅' : ''}</td>
                      <td className="p-4">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleResetUserScore(u._id, u.username)}
                            disabled={loading}
                            className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm text-white transition-colors disabled:opacity-50"
                            title="Reset user's scores"
                          >
                            Reset Score
                          </button>
                          {!u.isAdmin && (
                            <button
                              onClick={() => handleDeleteUser(u._id, u.username, u.isAdmin)}
                              disabled={loading}
                              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm text-white transition-colors disabled:opacity-50"
                              title="Delete user permanently"
                            >
                              Delete User
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        
        {tab === 'Chapters' && (
          <div className="space-y-6">
            {/* Add Chapter Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add New Chapter</h3>
              <form onSubmit={handleAddChapter} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Chapter Name</label>
                  <input
                    type="text"
                    value={newChapter.name}
                    onChange={e => setNewChapter({...newChapter, name: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    value={newChapter.description}
                    onChange={e => setNewChapter({...newChapter, description: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Order</label>
                  <input
                    type="number"
                    value={newChapter.order}
                    onChange={e => setNewChapter({...newChapter, order: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={newChapter.visible !== false}
                      onChange={e => setNewChapter({...newChapter, visible: e.target.checked})}
                      className="rounded border-gray-300 dark:border-gray-600 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Visible to users</span>
                  </label>
                </div>
                <button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded disabled:opacity-50 text-white transition-colors">
                  {loading ? 'Adding...' : 'Add Chapter'}
                </button>
              </form>
            </div>

            {/* Chapters List */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Manage Chapters</h3>
              {loading ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading chapters...</div>
              ) : (
                <div className="space-y-4">
                  {chapters.map(chapter => (
                    <div key={chapter._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      {editingId === chapter._id ? (
                        <form onSubmit={handleEditChapter} className="space-y-3">
                          <input
                            type="text"
                            value={editChapter.name}
                            onChange={e => setEditChapter({...editChapter, name: e.target.value})}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                            required
                          />
                          <textarea
                            value={editChapter.description}
                            onChange={e => setEditChapter({...editChapter, description: e.target.value})}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                            rows="2"
                          />
                          <input
                            type="number"
                            value={editChapter.order}
                            onChange={e => setEditChapter({...editChapter, order: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                          />
                          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={editChapter.visible !== false}
                              onChange={e => setEditChapter({...editChapter, visible: e.target.checked})}
                              className="rounded border-gray-300 dark:border-gray-500 text-cyan-600 focus:ring-cyan-500"
                            />
                            <span>Visible to users</span>
                          </label>
                          <div className="flex gap-2">
                            <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm disabled:opacity-50 text-white transition-colors">
                              Save
                            </button>
                            <button type="button" onClick={() => { setEditingId(null); setEditChapter(null); }} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm text-white transition-colors">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-lg text-gray-800 dark:text-white">{chapter.name}</h4>
                              {chapter.description && (
                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{chapter.description}</p>
                              )}
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Order: {chapter.order}</p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">
                                Status: <span className={chapter.visible !== false ? 'text-green-600' : 'text-red-600'}>
                                  {chapter.visible !== false ? 'Visible' : 'Hidden'}
                                </span>
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setEditingId(chapter._id); setEditChapter({...chapter}); }}
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteChapter(chapter._id)}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm text-white transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'Questions' && (
          <div className="space-y-6">
            {/* AI LaTeX Generator */}
            <AILatexGenerator 
              onInsert={(latex) => setNewQuestion(prev => ({
                ...prev, 
                question: prev.question + latex
              }))}
              onInsertOption={(latex, fieldName) => {
                const optionIndex = parseInt(fieldName.replace('option', ''));
                setNewQuestion(prev => {
                  const newOptions = [...prev.options];
                  newOptions[optionIndex] = newOptions[optionIndex] + latex;
                  return { ...prev, options: newOptions };
                });
              }}
              focusedField={focusedField}
            />

            {/* Add Question Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add New Question</h3>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Question</label>
                  <textarea
                    value={newQuestion.question}
                    onChange={e => setNewQuestion({...newQuestion, question: e.target.value})}
                    onFocus={() => setFocusedField('question')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    rows="3"
                    placeholder="Enter question text. Use LaTeX: $x^2$ for inline math, $$\frac{a}{b}$$ for display math"
                    required
                  />
                  {newQuestion.question && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-600 rounded border">
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Preview:</div>
                      <div className="text-gray-800 dark:text-white">
                        <MathText>{newQuestion.question}</MathText>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Chapter</label>
                  <select
                    value={newQuestion.chapter}
                    onChange={e => setNewQuestion({...newQuestion, chapter: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    required
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map(ch => (
                      <option key={ch._id} value={ch.name}>{ch.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Options</label>
                  {newQuestion.options.map((opt, i) => (
                    <div key={i} className="mb-3">
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...newQuestion.options];
                          newOpts[i] = e.target.value;
                          setNewQuestion({...newQuestion, options: newOpts});
                        }}
                        onFocus={() => setFocusedField(`option${i}`)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                        placeholder={`Option ${i + 1} (LaTeX supported: $x^2$, $$\frac{a}{b}$$)`}
                        required
                      />
                      {opt && (
                        <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-600 rounded text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Preview: </span>
                          <MathText>{opt}</MathText>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Correct Answer</label>
                  <input
                    type="text"
                    value={newQuestion.correctAnswer}
                    onChange={e => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Duration (seconds)</label>
                  <input
                    type="number"
                    value={newQuestion.duration}
                    onChange={e => setNewQuestion({...newQuestion, duration: parseInt(e.target.value) || 60})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    min="30"
                    max="600"
                  />
                </div>
                <button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded disabled:opacity-50 text-white transition-colors">
                  {loading ? 'Adding...' : 'Add Question'}
                </button>
              </form>
            </div>

            {/* Questions List */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Manage Questions</h3>
              {loading ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading questions...</div>
              ) : (
                <div className="space-y-4">
                  {questions.map(q => (
                    <div key={q._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      {editingId === q._id ? (
                        <form onSubmit={handleEditQuestion} className="space-y-3">
                          <div>
                            <textarea
                              value={editQuestion.question}
                              onChange={e => setEditQuestion({...editQuestion, question: e.target.value})}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                              rows="3"
                              placeholder="Enter question text. Use LaTeX: $x^2$ for inline math, $$\frac{a}{b}$$ for display math"
                              required
                            />
                            {editQuestion.question && (
                              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-500 rounded border">
                                <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Preview:</div>
                                <div className="text-gray-800 dark:text-white">
                                  <MathText>{editQuestion.question}</MathText>
                                </div>
                              </div>
                            )}
                          </div>
                          <select
                            value={editQuestion.chapter}
                            onChange={e => setEditQuestion({...editQuestion, chapter: e.target.value})}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                            required
                          >
                            <option value="">Select Chapter</option>
                            {chapters.map(ch => (
                              <option key={ch._id} value={ch.name}>{ch.name}</option>
                            ))}
                          </select>
                          {editQuestion.options.map((opt, i) => (
                            <div key={i} className="space-y-1">
                              <input
                                type="text"
                                value={opt}
                                onChange={e => {
                                  const newOpts = [...editQuestion.options];
                                  newOpts[i] = e.target.value;
                                  setEditQuestion({...editQuestion, options: newOpts});
                                }}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                                placeholder={`Option ${i + 1} (LaTeX supported: $x^2$, $$\frac{a}{b}$$)`}
                                required
                              />
                              {opt && (
                                <div className="p-2 bg-gray-100 dark:bg-gray-500 rounded text-sm">
                                  <span className="text-gray-600 dark:text-gray-300">Preview: </span>
                                  <MathText>{opt}</MathText>
                                </div>
                              )}
                            </div>
                          ))}
                          <input
                            type="text"
                            value={editQuestion.correctAnswer}
                            onChange={e => setEditQuestion({...editQuestion, correctAnswer: e.target.value})}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                            placeholder="Correct Answer"
                            required
                          />
                          <input
                            type="number"
                            value={editQuestion.duration}
                            onChange={e => setEditQuestion({...editQuestion, duration: parseInt(e.target.value) || 60})}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                            placeholder="Duration (seconds)"
                            min="30"
                            max="600"
                          />
                          <div className="flex gap-2">
                            <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm disabled:opacity-50 text-white transition-colors">
                              Save
                            </button>
                            <button type="button" onClick={() => { setEditingId(null); setEditQuestion(null); }} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm text-white transition-colors">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800 dark:text-white">
                                <MathText>{q.question}</MathText>
                              </h4>
                              <p className="text-gray-600 dark:text-gray-300 text-sm">Chapter: {q.chapter}</p>
                              <p className="text-gray-600 dark:text-gray-300 text-sm">Duration: {q.duration}s</p>
                              <ul className="mt-2 space-y-1">
                                {q.options.map((opt, i) => (
                                  <li key={i} className={`text-sm ${opt === q.correctAnswer ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {String.fromCharCode(65 + i)}. <MathText>{opt}</MathText>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => { setEditingId(q._id); setEditQuestion({...q}); }}
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q._id)}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm text-white transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'Leaderboard Reset' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Reset Leaderboard</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">This will delete all user scores from the leaderboard.</p>
            <button
              onClick={handleResetLeaderboard}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded disabled:opacity-50 text-white transition-colors"
            >
              {loading ? 'Resetting...' : 'Reset Leaderboard'}
            </button>
            {resetMsg && <p className="text-green-600 dark:text-green-400 mt-2">{resetMsg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}