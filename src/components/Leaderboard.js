import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Leaderboard = () => {
  // State management
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    avatar: '',
    score: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || '';

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/leaderboard`);
        setLeaderboard(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch leaderboard');
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/score`, {
        username: formData.username,
        avatar: formData.avatar,
        score: Number(formData.score)
      });
      // Refresh leaderboard after submission
      const response = await axios.get(`${API_URL}/api/leaderboard`);
      setLeaderboard(response.data);
      // Reset form
      setFormData({ username: '', avatar: '', score: '' });
    } catch (err) {
      setError('Failed to submit score');
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
      
      {/* Submit Score Form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            className="border p-2 rounded w-full"
            required
          />
        </div>
        <div>
          <input
            type="url"
            name="avatar"
            value={formData.avatar}
            onChange={handleChange}
            placeholder="Avatar URL"
            className="border p-2 rounded w-full"
            required
          />
        </div>
        <div>
          <input
            type="number"
            name="score"
            value={formData.score}
            onChange={handleChange}
            placeholder="Score"
            className="border p-2 rounded w-full"
            required
          />
        </div>
        <button 
          type="submit" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Submit Score
        </button>
      </form>

      {/* Leaderboard List */}
      <div className="space-y-4">
        {leaderboard.map((user, index) => (
          <div 
            key={index}
            className="flex items-center space-x-4 p-4 border rounded"
          >
            <img 
              src={user.avatar} 
              alt={user.username}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <h3 className="font-bold">{user.username}</h3>
              <p>Score: {user.score}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;