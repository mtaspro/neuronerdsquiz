import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export default function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const chapter = location.state?.chapter;
  const [questions, setQuestions] = useState([]);
  const [duration, setDuration] = useState(60); // default fallback
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]); // store selected answers
  const [timer, setTimer] = useState(60);
  const [warning, setWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchQuiz() {
      setLoading(true);
      setError('');
      try {
        if (!chapter) {
          setError('No chapter selected. Please go back and select a chapter.');
          setQuestions([]);
          setLoading(false);
          return;
        }
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const res = await axios.get(`${apiUrl}/api/quizzes?chapter=${encodeURIComponent(chapter)}`);
        const quizzes = Array.isArray(res.data) ? res.data : [];
        setQuestions(quizzes);
        setDuration(quizzes[0]?.duration || 60);
        setTimer(quizzes[0]?.duration || 60);
      } catch {
        setQuestions([]);
        setDuration(60);
        setTimer(60);
        setError('Failed to load quiz questions.');
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [chapter]);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-cyan-300 text-xl transition-colors duration-200">
        Loading quiz...
      </div>
    );
  }
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 text-xl mb-4">⚠️</div>
          <div className="text-gray-800 dark:text-white text-xl mb-4">
            {error || 'No questions available for this chapter.'}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Quiz: {chapter}
            </h1>
            <div className="text-right">
              <div className={`text-2xl font-bold ${warning ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </div>
              {warning && (
                <div className="text-sm text-red-500 dark:text-red-400 font-semibold">
                  Time's running out!
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700"
          >
            {/* Question */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-4 mb-8">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionSelect(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedOption === index
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-200'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 text-gray-800 dark:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedOption === index
                        ? 'border-cyan-500 bg-cyan-500'
                        : 'border-gray-300 dark:border-gray-500'
                    }`}>
                      {selectedOption === index && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Previous
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={selectedOption === null}
                className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next'}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
} 