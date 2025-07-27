import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const QUESTIONS = [
  {
    question: "What is the capital of France?",
    options: ["Berlin", "London", "Paris", "Madrid"],
    correctAnswerIndex: 2,
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Venus"],
    correctAnswerIndex: 1,
  },
  {
    question: "What is the largest mammal?",
    options: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
    correctAnswerIndex: 1,
  },
  {
    question: "Who wrote 'Hamlet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswerIndex: 1,
  },
  {
    question: "What is the boiling point of water?",
    options: ["90°C", "100°C", "80°C", "120°C"],
    correctAnswerIndex: 1,
  },
];

const TOTAL_QUESTIONS = QUESTIONS.length;
const TIMER_DURATION = 30;

export default function QuizPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(TIMER_DURATION);
  const navigate = useNavigate();

  useEffect(() => {
    if (timer === 0) {
      handleNext();
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    setTimer(TIMER_DURATION);
    setSelectedOption(null);
  }, [currentQuestionIndex]);

  function handleOptionSelect(idx) {
    setSelectedOption(idx);
  }

  function handleNext() {
    if (selectedOption === QUESTIONS[currentQuestionIndex].correctAnswerIndex) {
      setScore((s) => s + 1);
    }
    if (currentQuestionIndex === TOTAL_QUESTIONS - 1) {
      setTimeout(() => {
        navigate("/result", { state: { score, total: TOTAL_QUESTIONS } });
      }, 400);
      return;
    }
    setCurrentQuestionIndex((i) => i + 1);
  }

  const q = QUESTIONS[currentQuestionIndex];

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
          Question {currentQuestionIndex + 1}/{TOTAL_QUESTIONS}
        </div>
        <div className="text-white text-lg font-mono flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>{timer}s</span>
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
          <div className="flex justify-end">
            <motion.button
              variants={itemVariants}
              className="px-8 py-3 rounded-lg bg-green-500 text-white font-bold text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={selectedOption === null}
              onClick={handleNext}
            >
              {currentQuestionIndex === TOTAL_QUESTIONS - 1 ? "Finish" : "Next"}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 