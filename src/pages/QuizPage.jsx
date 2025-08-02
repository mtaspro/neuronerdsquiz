import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiHelpers } from "../utils/api";
import { useNotification } from "../components/NotificationSystem";
import LoadingSpinner from "../components/LoadingSpinner";
import useExamSecurity from "../hooks/useExamSecurity";
import SecurityWarning from "../components/SecurityWarning";
import SecurityInitModal from "../components/SecurityInitModal";

export default function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const chapter = location.state?.chapter;
  const { error: showError } = useNotification();
  const [questions, setQuestions] = useState([]);
  const [duration, setDuration] = useState(60); // default fallback
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]); // store selected answers
  const [timer, setTimer] = useState(60);
  const [warning, setWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Security system state
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityActive, setSecurityActive] = useState(false);
  const [currentViolation, setCurrentViolation] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);

  // Security system hook
  const {
    warnings,
    maxWarnings,
    isFullscreen,
    securityStatus,
    initializeSecurity,
    cleanupSecurity,
    remainingWarnings,
    enterFullscreen
  } = useExamSecurity({
    isActive: securityActive,
    onSecurityViolation: (violation) => {
      console.log('Security violation:', violation);
      setCurrentViolation(violation);
    },
    onAutoSubmit: (reason) => {
      console.log('Auto-submit triggered:', reason);
      showError(`Quiz auto-submitted due to security violations: ${reason.reason}`);
      handleSubmit();
    },
    maxWarnings: 3,
    enableFullscreen: true,
    enableTabSwitchDetection: true,
    enableRightClickBlock: true,
    enableDevToolsBlock: true,
    enableExitConfirmation: true
  });

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
        
        const response = await apiHelpers.getQuizByChapter(chapter);
        const quizzes = Array.isArray(response.data) ? response.data : [];
        
        if (quizzes.length === 0) {
          setError('No questions available for this chapter.');
          showError('No questions found for the selected chapter');
        } else {
          setQuestions(quizzes);
          setDuration(quizzes[0]?.duration || 60);
          setTimer(quizzes[0]?.duration || 60);
        }
      } catch (err) {
        console.error('Failed to fetch quiz:', err);
        setQuestions([]);
        setDuration(60);
        setTimer(60);
        setError('Failed to load quiz questions.');
        showError('Failed to load quiz questions. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [chapter, showError]);

  // Show security modal when quiz is loaded
  useEffect(() => {
    if (!loading && questions.length > 0 && !quizStarted) {
      setShowSecurityModal(true);
    }
  }, [loading, questions, quizStarted]);

  // Timer logic - only start when quiz is actually started
  useEffect(() => {
    if (loading || questions.length === 0 || !quizStarted) return;
    if (timer === 0) {
      handleSubmit();
      return;
    }
    if (timer === 10) setWarning(true);
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, loading, questions, quizStarted]);

  // Cleanup security on unmount
  useEffect(() => {
    return () => {
      if (securityActive) {
        cleanupSecurity();
      }
    };
  }, [securityActive, cleanupSecurity]);

  // Handle security modal acceptance
  const handleSecurityAccept = async () => {
    setShowSecurityModal(false);
    setSecurityActive(true);
    
    try {
      console.log('🔒 Starting security initialization...');
      
      // Initialize security system
      const success = await initializeSecurity();
      
      console.log('🔒 Security initialization result:', success);
      
      if (success) {
        console.log('✅ Security system initialized, starting quiz');
        setQuizStarted(true);
      } else {
        console.error('❌ Security system initialization failed');
        showError('Failed to initialize security system. The quiz will continue without full security protection.');
        // Still start the quiz even if security fails
        setQuizStarted(true);
      }
    } catch (error) {
      console.error('❌ Security initialization error:', error);
      showError('Security system error. The quiz will continue with basic protection.');
      // Still start the quiz even if security fails
      setQuizStarted(true);
    }
  };

  // Handle security modal cancellation
  const handleSecurityCancel = () => {
    setShowSecurityModal(false);
    navigate('/dashboard');
  };

  // Handle violation dismissal
  const handleViolationDismiss = () => {
    setCurrentViolation(null);
  };

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
      <LoadingSpinner 
        fullScreen={true} 
        text="Loading quiz questions..." 
        size="large" 
        color="cyan" 
      />
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
      {/* Security Initialization Modal */}
      <SecurityInitModal
        isOpen={showSecurityModal}
        onAccept={handleSecurityAccept}
        onCancel={handleSecurityCancel}
        quizType="quiz"
      />

      {/* Security Warning */}
      {currentViolation && (
        <SecurityWarning
          violation={currentViolation}
          warnings={warnings}
          maxWarnings={maxWarnings}
          onDismiss={handleViolationDismiss}
          autoHide={true}
          hideDelay={5000}
        />
      )}

      {/* Security Status Indicator */}
      {securityActive && (
        <div className="fixed top-4 right-4 z-40 flex flex-col space-y-2">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            🔒 Secure Mode {warnings > 0 && `(${remainingWarnings} warnings left)`}
          </div>
          {!isFullscreen && (
            <button
              onClick={enterFullscreen}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 transition-colors"
              title="Click to enter fullscreen mode"
            >
              <span>📺</span>
              <span>Fullscreen</span>
            </button>
          )}
        </div>
      )}
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
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-700"
          >
            {/* Question */}
            <div className="mb-6">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-4 leading-tight">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionSelect(index)}
                  className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedOption === index
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-200'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 text-gray-800 dark:text-white'
                  }`}
                >
                  <div className="flex items-center">
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