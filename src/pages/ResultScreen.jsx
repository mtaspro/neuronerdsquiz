import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResultScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const score = location.state?.score ?? 0;
  const total = location.state?.total ?? 0;
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "";

  // Auto-submit score when component mounts
  useEffect(() => {
    const submitScore = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken || !userData.username) {
          console.log('No authenticated user found, skipping score submission');
          return;
        }

        await axios.post(`${API_URL}/api/score`, {
          username: userData.username,
          avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=random`,
          score: score
        });
        
        setScoreSubmitted(true);
        console.log('Score submitted successfully');
      } catch (error) {
        console.error('Failed to submit score:', error);
        setSubmissionError('Failed to submit score to leaderboard');
      }
    };

    if (score > 0) {
      submitScore();
    }
  }, [score, API_URL]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 px-4">
      <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 text-center drop-shadow-lg">
        Quiz Complete!
      </h1>
      <p className="text-lg md:text-2xl text-gray-200 mb-4 text-center">
        Your Score: <span className="font-bold text-white">{score} / {total}</span>
      </p>
      
      {/* Score submission status */}
      {scoreSubmitted && (
        <p className="text-green-400 mb-4 text-center">
          Score submitted to leaderboard!
        </p>
      )}
      {submissionError && (
        <p className="text-red-400 mb-4 text-center">
          {submissionError}
        </p>
      )}
      {!scoreSubmitted && !submissionError && score > 0 && (
        <p className="text-yellow-400 mb-4 text-center">
          Submitting score...
        </p>
      )}
      <button
        className="px-8 py-3 bg-blue-600 text-white font-bold rounded shadow-lg hover:bg-blue-700 transition-colors text-lg md:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        onClick={() => navigate("/leaderboard")}
      >
        View Leaderboard
      </button>
    </div>
  );
} 