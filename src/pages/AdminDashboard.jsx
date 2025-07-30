import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TABS = ['Users', 'Chapters', 'Questions', 'Leaderboard Reset'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Users');
  const [users, setUsers] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newQuestion, setNewQuestion] = useState({ question: '', options: ['', '', '', ''], correctAnswer: '', chapter: '', duration: 60 });
  const [newChapter, setNewChapter] = useState({ name: '', description: '', order: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null);
  const [editChapter, setEditChapter] = useState(null);
  const [resetMsg, setResetMsg] = useState('');

  function authHeader() {
    const token = localStorage.getItem('authToken');
    console.log('AdminDashboard - Token from localStorage:', token ? 'Present' : 'Missing');
    if (token) {
      console.log('AdminDashboard - Token length:', token.length);
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Load users
  useEffect(() => {
    if (tab !== 'Users') return;
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.get(`${apiUrl}/api/admin/users`, { headers: authHeader() })
      .then(res => setUsers(res.data))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, [tab]);

  // Load chapters
  useEffect(() => {
    if (tab !== 'Chapters') return;
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.get(`${apiUrl}/api/admin/chapters`, { headers: authHeader() })
      .then(res => setChapters(res.data))
      .catch(() => setError('Failed to load chapters'))
      .finally(() => setLoading(false));
  }, [tab]);

  // Load questions
  useEffect(() => {
    if (tab !== 'Questions') return;
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.get(`${apiUrl}/api/admin/questions`, { headers: authHeader() })
      .then(res => setQuestions(res.data))
      .catch(() => setError('Failed to load questions'))
      .finally(() => setLoading(false));
  }, [tab]);

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
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="flex gap-4 mb-8">
        {TABS.map(t => (
          <button
            key={t}
            className={`px-4 py-2 rounded ${tab === t ? 'bg-cyan-600' : 'bg-gray-800 hover:bg-cyan-700'}`}
            onClick={() => { setTab(t); setError(''); setResetMsg(''); }}
          >{t}</button>
        ))}
      </div>
      {error && <div className="text-pink-400 mb-4">{error}</div>}
      
      {tab === 'Users' && (
        <div>
          {loading ? 'Loading users...' : (
            <table className="w-full bg-gray-900 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-800">
                  <th className="p-2">Username</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Admin</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b border-gray-700">
                    <td className="p-2">{u.username}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.isAdmin ? '✅' : ''}</td>
                    <td className="p-2">
                      <button
                        className="px-2 py-1 bg-pink-700 rounded text-xs"
                        onClick={() => {
                          if (window.confirm('Reset this user\'s score?')) {
                            setLoading(true);
                            const apiUrl = import.meta.env.VITE_API_URL || '';
                            axios.post(`${apiUrl}/api/admin/users/${u._id}/reset-score`, {}, { headers: authHeader() })
                              .then(() => alert('Score reset!'))
                              .catch(() => setError('Failed to reset score'))
                              .finally(() => setLoading(false));
                          }
                        }}
                      >Reset Score</button>
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
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Add New Chapter</h3>
            <form onSubmit={handleAddChapter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Chapter Name</label>
                <input
                  type="text"
                  value={newChapter.name}
                  onChange={e => setNewChapter({...newChapter, name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newChapter.description}
                  onChange={e => setNewChapter({...newChapter, description: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order</label>
                <input
                  type="number"
                  value={newChapter.order}
                  onChange={e => setNewChapter({...newChapter, order: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded disabled:opacity-50">
                {loading ? 'Adding...' : 'Add Chapter'}
              </button>
            </form>
          </div>

          {/* Chapters List */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Manage Chapters</h3>
            {loading ? 'Loading chapters...' : (
              <div className="space-y-4">
                {chapters.map(chapter => (
                  <div key={chapter._id} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    {editingId === chapter._id ? (
                      <form onSubmit={handleEditChapter} className="space-y-3">
                        <input
                          type="text"
                          value={editChapter.name}
                          onChange={e => setEditChapter({...editChapter, name: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                          required
                        />
                        <textarea
                          value={editChapter.description}
                          onChange={e => setEditChapter({...editChapter, description: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                          rows="2"
                        />
                        <input
                          type="number"
                          value={editChapter.order}
                          onChange={e => setEditChapter({...editChapter, order: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm disabled:opacity-50">
                            Save
                          </button>
                          <button type="button" onClick={() => { setEditingId(null); setEditChapter(null); }} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm">
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">{chapter.name}</h4>
                            {chapter.description && <p className="text-gray-400 text-sm">{chapter.description}</p>}
                            <p className="text-gray-500 text-xs">Order: {chapter.order}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setEditingId(chapter._id); setEditChapter({...chapter}); }}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(chapter._id)}
                              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
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
          {/* Add Question Form */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Add New Question</h3>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Question</label>
                <textarea
                  value={newQuestion.question}
                  onChange={e => setNewQuestion({...newQuestion, question: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Chapter</label>
                <select
                  value={newQuestion.chapter}
                  onChange={e => setNewQuestion({...newQuestion, chapter: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                  required
                >
                  <option value="">Select Chapter</option>
                  {chapters.map(ch => (
                    <option key={ch._id} value={ch.name}>{ch.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Options</label>
                {newQuestion.options.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    value={opt}
                    onChange={e => {
                      const newOpts = [...newQuestion.options];
                      newOpts[i] = e.target.value;
                      setNewQuestion({...newQuestion, options: newOpts});
                    }}
                    className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none mb-2"
                    placeholder={`Option ${i + 1}`}
                    required
                  />
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Correct Answer</label>
                <input
                  type="text"
                  value={newQuestion.correctAnswer}
                  onChange={e => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (seconds)</label>
                <input
                  type="number"
                  value={newQuestion.duration}
                  onChange={e => setNewQuestion({...newQuestion, duration: parseInt(e.target.value) || 60})}
                  className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                  min="30"
                  max="600"
                />
              </div>
              <button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded disabled:opacity-50">
                {loading ? 'Adding...' : 'Add Question'}
              </button>
            </form>
          </div>

          {/* Questions List */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Manage Questions</h3>
            {loading ? 'Loading questions...' : (
              <div className="space-y-4">
                {questions.map(q => (
                  <div key={q._id} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    {editingId === q._id ? (
                      <form onSubmit={handleEditQuestion} className="space-y-3">
                        <textarea
                          value={editQuestion.question}
                          onChange={e => setEditQuestion({...editQuestion, question: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                          rows="3"
                          required
                        />
                        <select
                          value={editQuestion.chapter}
                          onChange={e => setEditQuestion({...editQuestion, chapter: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                          required
                        >
                          <option value="">Select Chapter</option>
                          {chapters.map(ch => (
                            <option key={ch._id} value={ch.name}>{ch.name}</option>
                          ))}
                        </select>
                        {editQuestion.options.map((opt, i) => (
                          <input
                            key={i}
                            type="text"
                            value={opt}
                            onChange={e => {
                              const newOpts = [...editQuestion.options];
                              newOpts[i] = e.target.value;
                              setEditQuestion({...editQuestion, options: newOpts});
                            }}
                            className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                            placeholder={`Option ${i + 1}`}
                            required
                          />
                        ))}
                        <input
                          type="text"
                          value={editQuestion.correctAnswer}
                          onChange={e => setEditQuestion({...editQuestion, correctAnswer: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                          placeholder="Correct Answer"
                          required
                        />
                        <input
                          type="number"
                          value={editQuestion.duration}
                          onChange={e => setEditQuestion({...editQuestion, duration: parseInt(e.target.value) || 60})}
                          className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
                          placeholder="Duration (seconds)"
                          min="30"
                          max="600"
                        />
                        <div className="flex gap-2">
                          <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm disabled:opacity-50">
                            Save
                          </button>
                          <button type="button" onClick={() => { setEditingId(null); setEditQuestion(null); }} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm">
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{q.question}</h4>
                            <p className="text-gray-400 text-sm">Chapter: {q.chapter}</p>
                            <p className="text-gray-400 text-sm">Duration: {q.duration}s</p>
                            <ul className="mt-2 space-y-1">
                              {q.options.map((opt, i) => (
                                <li key={i} className={`text-sm ${opt === q.correctAnswer ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>
                                  {String.fromCharCode(65 + i)}. {opt}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => { setEditingId(q._id); setEditQuestion({...q}); }}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q._id)}
                              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
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
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Reset Leaderboard</h3>
          <p className="text-gray-400 mb-4">This will delete all user scores from the leaderboard.</p>
          <button
            onClick={handleResetLeaderboard}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Leaderboard'}
          </button>
          {resetMsg && <p className="text-green-400 mt-2">{resetMsg}</p>}
        </div>
      )}
    </div>
  );
}