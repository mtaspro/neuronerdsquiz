import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ResultScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const score = location.state?.score ?? 0;
  const total = location.state?.total ?? 0;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 px-4">
      <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 text-center drop-shadow-lg">
        Quiz Complete!
      </h1>
      <p className="text-lg md:text-2xl text-gray-200 mb-8 text-center">
        Your Score: <span className="font-bold text-white">{score} / {total}</span>
      </p>
      <button
        className="px-8 py-3 bg-blue-600 text-white font-bold rounded shadow-lg hover:bg-blue-700 transition-colors text-lg md:text-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        onClick={() => navigate("/leaderboard")}
      >
        View Leaderboard
      </button>
    </div>
  );
} 