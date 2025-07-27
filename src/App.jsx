import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import IntroScreen from "./pages/IntroScreen";
import QuizPage from "./pages/QuizPage";
import ResultScreen from "./pages/ResultScreen";
import Leaderboard from "./pages/Leaderboard";

// Optional Navbar
function Navbar() {
  return (
    <nav className="w-full bg-gray-900 py-3 px-4 flex justify-center gap-4 shadow-md z-20">
      <Link to="/" className="text-white font-semibold hover:text-blue-400 transition">Intro</Link>
      <Link to="/quiz" className="text-white font-semibold hover:text-blue-400 transition">Quiz</Link>
      <Link to="/result" className="text-white font-semibold hover:text-blue-400 transition">Result</Link>
      <Link to="/leaderboard" className="text-white font-semibold hover:text-blue-400 transition">Leaderboard</Link>
    </nav>
  );
}

// Animated route transitions
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 min-h-0"
      >
        <Routes location={location}>
          <Route path="/" element={<IntroScreen />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/result" element={<ResultScreen />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      <Navbar />
      <AnimatedRoutes />
    </div>
  );
}
