import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export default function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Quiz data can be passed via navigation state or fetched by ID
  const quizData = location.state?.quizData || null;
  const [questions, setQuestions] = useState([]);
  const [duration, setDuration] = useState(60); // default fallback
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]); // store selected answers
  const [timer, setTimer] = useState(60);
  const [warning, setWarning] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch quiz data if not passed via navigation
  useEffect(() => {
    async function fetchQuiz() {
      setLoading(true);
      try {
        // Example: fetch quizzes for a chapter (customize as needed)
        // You may want to fetch by quiz ID or chapter from location.state
        const chapter = location.state?.chapter;
        const res = await axios.get(`/api/quizzes${chapter ? `?chapter=${encodeURIComponent(chapter)}` : ''}`);
        const quizzes = Array.isArray(res.data) ? res.data : [];
        setQuestions(quizzes);
        // Use the first quiz's duration or fallback
        setDuration(quizzes[0]?.duration || 60);
        setTimer(quizzes[0]?.duration || 60);
      } catch {
        setQuestions([]);
        setDuration(60);
        setTimer(60);
      } finally {
        setLoading(false);
      }
    }
    if (quizData) {
      setQuestions(quizData.questions);
      setDuration(quizData.duration || 60);
      setTimer(quizData.duration || 60);
      setLoading(false);
    } else {
      fetchQuiz();
    }
  }, [quizData, location.state]);

  // Timer logic
  useEffect(() => {
    if (loading || questions.length === 0) return;
    if (timer === 0) {
      handleSubmit();
      return;
    }
    if (timer === 10) setWarning(true);
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, loading, questions]);

  function handleOptionSelect(idx) {
    setSelectedOption(idx);
  }

  function handleNext() {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = selectedOption;
    setAnswers(updatedAnswers);
    setSelectedOption(null);
    setWarning(false);
    if (currentQuestionIndex === questions.length - 1) {
      handleSubmit(updatedAnswers);
      return;
    }
    setCurrentQuestionIndex((i) => i + 1);
    setTimer(duration); // reset timer for next question if per-question timer, else keep running
  }

  function handleSubmit(finalAnswers = answers) {
    // Calculate score
    let score = 0;
    questions.forEach((q, i) => {
      // Support both correctAnswer (string) and correctAnswerIndex (number)
      if (
        (typeof q.correctAnswerIndex === 'number' && finalAnswers[i] === q.correctAnswerIndex) ||
        (typeof q.correctAnswer === 'string' && q.options[finalAnswers[i]] === q.correctAnswer)
      ) {
        score++;
      }
    });
    navigate("/result", { state: { score, total: questions.length } });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-cyan-300 text-xl">Loading quiz...</div>
    );
  }
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-pink-400 text-xl">No quiz found.</div>
    );
  }

  const q = questions[currentQuestionIndex];

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
    exit: { opacity: 0, y: -30 },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 px-4 py-8">
      <div className="w-full max-w-2xl flex justify-between items-center mb-8">
        <div className="text-white text-lg font-semibold">
          Question {currentQuestionIndex + 1}/{questions.length}
        </div>
        <div className={`text-lg font-mono flex items-center gap-2 px-4 py-2 rounded-lg ${warning ? 'bg-pink-700 text-white animate-pulse' : 'bg-gray-800 text-cyan-300'}`}
             aria-live="polite">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>{timer}s</span>
          {warning && <span className="ml-2 text-yellow-300 font-bold">Hurry up! 10s left</span>}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-xl p-8 flex flex-col"
        >
          <motion.h2
            variants={itemVariants}
            className="text-2xl md:text-3xl font-bold text-white mb-8 text-center"
          >
            {q.question}
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {q.options.map((opt, idx) => (
              <motion.button
                key={idx}
                variants={itemVariants}
                whileTap={{ scale: 0.97 }}
                className={`py-4 px-6 rounded-xl font-semibold text-lg border-2 transition-colors focus:outline-none
                  ${selectedOption === idx
                    ? "bg-blue-600 text-white border-blue-400 shadow-lg"
                    : "bg-gray-700 text-gray-200 border-gray-600 hover:bg-blue-700 hover:text-white"}
                `}
                onClick={() => handleOptionSelect(idx)}
                disabled={selectedOption !== null}
              >
                {opt}
              </motion.button>
            ))}
          </div>
          <div className="flex justify-between">
            <motion.button
              variants={itemVariants}
              className="px-8 py-3 rounded-lg bg-gray-500 text-white font-bold text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={currentQuestionIndex === 0}
              onClick={() => {
                setCurrentQuestionIndex((i) => i - 1);
                setSelectedOption(answers[currentQuestionIndex - 1] ?? null);
                setWarning(false);
                setTimer(duration);
              }}
            >
              Previous
            </motion.button>
            <motion.button
              variants={itemVariants}
              className="px-8 py-3 rounded-lg bg-green-500 text-white font-bold text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={selectedOption === null}
              onClick={handleNext}
            >
              {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
      <button
        className="mt-8 px-6 py-2 rounded bg-pink-600 text-white font-semibold shadow hover:bg-pink-700 transition-all"
        onClick={() => handleSubmit([...answers.slice(0, currentQuestionIndex), selectedOption])}
      >
        Submit Now
      </button>
    </div>
  );
} 