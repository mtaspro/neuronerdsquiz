import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TABS = ['Users', 'Questions', 'Leaderboard Reset'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Users');
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    chapter: '',
    duration: 60,
  });
  const [editingId, setEditingId] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null);
  const [resetMsg, setResetMsg] = useState('');

  // Fetch users
  useEffect(() => {
    if (tab !== 'Users') return;
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.get(`${apiUrl}/api/admin/users`, { headers: authHeader() })
      .then(res => setUsers(res.data))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, [tab]);

  // Fetch questions
  useEffect(() => {
    if (tab !== 'Questions') return;
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.get(`${apiUrl}/api/admin/questions`, { headers: authHeader() })
      .then(res => setQuestions(res.data))
      .catch(() => setError('Failed to load questions'))
      .finally(() => setLoading(false));
  }, [tab]);

  function authHeader() {
    const token = localStorage.getItem('authToken');
    console.log('AdminDashboard - Token from localStorage:', token ? 'Present' : 'Missing');
    if (token) {
      console.log('AdminDashboard - Token length:', token.length);
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
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
      {tab === 'Questions' && (
        <div>
          <form onSubmit={editingId ? handleEditQuestion : handleAddQuestion} className="mb-8 bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-2">{editingId ? 'Edit Question' : 'Add New Question'}</h2>
            <input
              className="block w-full mb-2 p-2 rounded bg-gray-800"
              placeholder="Question"
              value={editingId ? editQuestion?.question : newQuestion.question}
              onChange={e => editingId ? setEditQuestion({ ...editQuestion, question: e.target.value }) : setNewQuestion({ ...newQuestion, question: e.target.value })}
              required
            />
            {[0,1,2,3].map(i => (
              <input
                key={i}
                className="block w-full mb-2 p-2 rounded bg-gray-800"
                placeholder={`Option ${i+1}`}
                value={editingId ? editQuestion?.options[i] : newQuestion.options[i]}
                onChange={e => {
                  if (editingId) {
                    const opts = [...editQuestion.options]; opts[i] = e.target.value;
                    setEditQuestion({ ...editQuestion, options: opts });
                  } else {
                    const opts = [...newQuestion.options]; opts[i] = e.target.value;
                    setNewQuestion({ ...newQuestion, options: opts });
                  }
                }}
                required
              />
            ))}
            <input
              className="block w-full mb-2 p-2 rounded bg-gray-800"
              placeholder="Correct Answer (must match one option exactly)"
              value={editingId ? editQuestion?.correctAnswer : newQuestion.correctAnswer}
              onChange={e => editingId ? setEditQuestion({ ...editQuestion, correctAnswer: e.target.value }) : setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
              required
            />
            <input
              className="block w-full mb-2 p-2 rounded bg-gray-800"
              placeholder="Chapter"
              value={editingId ? editQuestion?.chapter : newQuestion.chapter}
              onChange={e => editingId ? setEditQuestion({ ...editQuestion, chapter: e.target.value }) : setNewQuestion({ ...newQuestion, chapter: e.target.value })}
              required
            />
            <input
              type="number"
              className="block w-full mb-2 p-2 rounded bg-gray-800"
              placeholder="Duration (seconds)"
              value={editingId ? editQuestion?.duration : newQuestion.duration}
              onChange={e => editingId ? setEditQuestion({ ...editQuestion, duration: Number(e.target.value) }) : setNewQuestion({ ...newQuestion, duration: Number(e.target.value) })}
              required
            />
            <button type="submit" className="px-4 py-2 bg-cyan-600 rounded mt-2">
              {editingId ? 'Save Changes' : 'Add Question'}
            </button>
            {editingId && (
              <button type="button" className="ml-4 px-4 py-2 bg-gray-700 rounded" onClick={() => { setEditingId(null); setEditQuestion(null); }}>
                Cancel
              </button>
            )}
          </form>
          <div>
            {loading ? 'Loading questions...' : (
              <table className="w-full bg-gray-900 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="p-2">Question</th>
                    <th className="p-2">Chapter</th>
                    <th className="p-2">Duration</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map(q => (
                    <tr key={q._id} className="border-b border-gray-700">
                      <td className="p-2">{q.question}</td>
                      <td className="p-2">{q.chapter}</td>
                      <td className="p-2">{q.duration}s</td>
                      <td className="p-2 flex gap-2">
                        <button className="px-2 py-1 bg-yellow-600 rounded text-xs" onClick={() => { setEditingId(q._id); setEditQuestion({ ...q }); }}>Edit</button>
                        <button className="px-2 py-1 bg-pink-700 rounded text-xs" onClick={() => handleDeleteQuestion(q._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {tab === 'Leaderboard Reset' && (
        <div>
          <button className="px-6 py-3 bg-pink-700 rounded-lg" onClick={handleResetLeaderboard} disabled={loading}>
            Reset Leaderboard
          </button>
          {resetMsg && <div className="text-green-400 mt-4">{resetMsg}</div>}
        </div>
      )}
    </div>
  );
}