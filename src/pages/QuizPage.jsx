import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiHelpers } from "../utils/api";
import { useNotification } from "../components/NotificationSystem";
import LoadingSpinner from "../components/LoadingSpinner";
import useExamSecurity from "../hooks/useExamSecurity";
import SecurityWarning from "../components/SecurityWarning";
import SecurityInitModal from "../components/SecurityInitModal";
import MathText from "../components/MathText";
import soundManager from "../utils/soundUtils";
import axios from "axios";

export default function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const chapter = location.state?.chapter;
  const { error: showError, success: showSuccess } = useNotification();
  const [questions, setQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(null);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [duration, setDuration] = useState(60); // default fallback
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]); // store selected answers
  const [timer, setTimer] = useState(60);
  const [warning, setWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Practice mode states
  const [practiceMode, setPracticeMode] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [previousAttempt, setPreviousAttempt] = useState(null);
  const [checkingAttempt, setCheckingAttempt] = useState(false);

  // Security system state
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityActive, setSecurityActive] = useState(false);
  const [currentViolation, setCurrentViolation] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);

  // Define handleSubmit first to avoid circular dependency
  const handleSubmit = useCallback(async (finalAnswers = answers) => {
    try {
      // Ensure all answers have values (use -1 for unanswered)
      const processedAnswers = finalAnswers.map(answer => 
        answer !== undefined && answer !== null ? answer : -1
      );
      
      // Calculate score (handle unanswered questions)
      let score = 0;
      let correctAnswers = 0;
      
      questions.forEach((q, i) => {
        const answer = processedAnswers[i];
        const hasAnswer = answer !== -1;
        const isCorrect = hasAnswer && (
          (typeof q.correctAnswerIndex === 'number' && answer === q.correctAnswerIndex) ||
          (typeof q.correctAnswer === 'string' && q.options[answer] === q.correctAnswer)
        );
        if (isCorrect) {
          score++;
          correctAnswers++;
        }
      });

      // Calculate time spent
      const timeSpent = (duration - timer) * 1000; // Convert to milliseconds

      // Submit to backend
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('authToken');
      
      const submitData = {
        score,
        totalQuestions: questions.length,
        correctAnswers,
        timeSpent,
        chapter,
        answers: processedAnswers,
        questions // Include questions for quiz ID generation
      };

      const response = await axios.post(`${apiUrl}/api/quizzes/submit`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = response.data;
      
      // Navigate to result with additional info
      navigate("/result", { 
        state: { 
          score, 
          total: questions.length,
          practiceMode: result.practiceMode,
          isFirstAttempt: result.isFirstAttempt,
          previousBestScore: result.previousBestScore,
          improved: result.improved,
          leaderboardUpdated: result.leaderboardUpdated,
          badgesUpdated: result.badgesUpdated,
          currentBadges: result.currentBadges,
          questions: questions,
          userAnswers: processedAnswers,
          timeSpent: timeSpent,
          chapter: chapter
        } 
      });

    } catch (error) {
      console.error('Error submitting quiz:', error);
      showError('Failed to submit quiz. Please try again.');
      
      // Fallback to local result calculation (handle unanswered questions)
      const fallbackProcessedAnswers = finalAnswers.map(answer => 
        answer !== undefined && answer !== null ? answer : -1
      );
      let score = 0;
      questions.forEach((q, i) => {
        const answer = fallbackProcessedAnswers[i];
        const hasAnswer = answer !== -1;
        if (hasAnswer && (
          (typeof q.correctAnswerIndex === 'number' && answer === q.correctAnswerIndex) ||
          (typeof q.correctAnswer === 'string' && q.options[answer] === q.correctAnswer)
        )) {
          score++;
        }
      });
      navigate("/result", { 
        state: { 
          score, 
          total: questions.length, 
          error: true,
          questions: questions,
          userAnswers: fallbackProcessedAnswers,
          timeSpent: (duration - timer) * 1000,
          chapter: chapter,
          practiceMode: practiceMode
        } 
      });
    }
  }, [answers, questions, navigate, duration, timer, chapter, showError]);

  // Security system hook (full version with all features)
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

  // Check if user has already attempted this quiz
  const checkQuizAttempt = useCallback(async (quizQuestions) => {
    try {
      setCheckingAttempt(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('authToken');
      
      const response = await axios.post(`${apiUrl}/api/quizzes/check-attempt`, {
        chapter,
        questions: quizQuestions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { hasAttempted, previousAttempt, practiceMode: chapterPracticeMode } = response.data;
      
      setHasAttempted(hasAttempted);
      setPreviousAttempt(previousAttempt);
      setPracticeMode(chapterPracticeMode || hasAttempted);
      
      if (chapterPracticeMode) {
        showSuccess('Practice Mode: This chapter is set to practice mode - your stats won\'t be affected');
      } else if (hasAttempted) {
        showSuccess(`Practice Mode: You've already completed this quiz with a score of ${previousAttempt.score}/${previousAttempt.totalQuestions}`);
      }
      
    } catch (error) {
      console.error('Error checking quiz attempt:', error);
      // Continue anyway - assume first attempt and not practice mode
      setHasAttempted(false);
      setPracticeMode(false);
    } finally {
      setCheckingAttempt(false);
    }
  }, [chapter, showSuccess]);

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
          setAllQuestions(quizzes);
          setDuration(quizzes[0]?.duration || 60);
          setTimer(quizzes[0]?.duration || 60);
          
          // Show question selector if more than 5 questions available
          if (quizzes.length > 5) {
            setShowQuestionSelector(true);
          } else {
            setQuestions(quizzes);
            await checkQuizAttempt(quizzes);
          }
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
  }, [chapter, showError, checkQuizAttempt]);

  // Show security modal when quiz is loaded (only if not in practice mode or user wants security anyway)
  useEffect(() => {
    if (!loading && !checkingAttempt && questions.length > 0 && !quizStarted) {
      setShowSecurityModal(true);
    }
  }, [loading, checkingAttempt, questions, quizStarted]);

  // Timer logic - only start when quiz is actually started
  useEffect(() => {
    if (loading || questions.length === 0 || !quizStarted) return;
    if (timer === 0) {
      // Auto-move to next question when timer ends
      const updatedAnswers = [...answers];
      updatedAnswers[currentQuestionIndex] = selectedOption;
      setAnswers(updatedAnswers);
      setSelectedOption(null);
      setWarning(false);
      
      if (currentQuestionIndex === questions.length - 1) {
        soundManager.play('quizComplete');
        handleSubmit(updatedAnswers);
      } else {
        soundManager.play('questionNext');
        setCurrentQuestionIndex((i) => i + 1);
        setTimer(duration);
      }
      return;
    }
    if (timer === 10) setWarning(true);
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, loading, questions, quizStarted, answers, currentQuestionIndex, selectedOption, duration, handleSubmit]);

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
      
      // Initialize security system (this will automatically attempt fullscreen)
      const success = await initializeSecurity();
      
      console.log('🔒 Security initialization result:', success);
      
      // Security system is designed to always succeed, even if fullscreen fails
      console.log('✅ Security system initialized, starting quiz');
      setQuizStarted(true);
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

  // Handle question count selection
  const handleQuestionCountSelect = async (count) => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, count);
    setQuestions(selectedQuestions);
    setSelectedQuestionCount(count);
    setShowQuestionSelector(false);
    await checkQuizAttempt(selectedQuestions);
  };

  // Handle violation dismissal
  const handleViolationDismiss = () => {
    setCurrentViolation(null);
  };

  const handleOptionSelect = useCallback((idx) => {
    soundManager.play('click');
    setSelectedOption(idx);
  }, []);

  const handleNext = useCallback(() => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = selectedOption;
    setAnswers(updatedAnswers);
    setSelectedOption(null);
    setWarning(false);
    
    if (currentQuestionIndex === questions.length - 1) {
      // Submit quiz when on last question
      soundManager.play('quizComplete');
      setTimeout(() => handleSubmit(updatedAnswers), 0);
      return;
    }
    
    soundManager.play('questionNext');
    setCurrentQuestionIndex((i) => i + 1);
    setTimer(duration);
  }, [answers, currentQuestionIndex, selectedOption, questions.length, duration]);

  if (loading || checkingAttempt) {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        text={checkingAttempt ? "Checking quiz status..." : "Loading quiz questions..."} 
        size="large" 
        color="cyan" 
      />
    );
  }

  // Question Count Selector
  if (showQuestionSelector) {
    const questionOptions = [5, 10, 15, 20, Math.min(30, allQuestions.length), allQuestions.length]
      .filter((count, index, arr) => count <= allQuestions.length && arr.indexOf(count) === index)
      .sort((a, b) => a - b);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
            Select Question Count
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
            Choose how many questions you want to solve from {allQuestions.length} available questions in <strong>{chapter}</strong>
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {questionOptions.map(count => (
              <motion.button
                key={count}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuestionCountSelect(count)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all"
              >
                {count} Questions
              </motion.button>
            ))}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
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
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            🔒 Secure Mode {warnings > 0 && `(${remainingWarnings} warnings left)`}
          </div>
        </div>
      )}

      {/* Practice Mode Indicator */}
      {practiceMode && (
        <div className="fixed top-4 left-4 z-40">
          <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            🔄 Practice Mode
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Quiz: {chapter}
              </h1>
              {practiceMode && (
                <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                  Practice Mode - Results won't affect your stats, leaderboard, or badges
                </div>
              )}
              {previousAttempt && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Previous best: {previousAttempt.score}/{previousAttempt.totalQuestions} on {new Date(previousAttempt.submittedAt).toLocaleDateString()}
                </div>
              )}
            </div>
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
              className={`h-2 rounded-full ${
                practiceMode 
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-600' 
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600'
              }`}
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
                <MathText>{currentQuestion.question}</MathText>
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
                      ? practiceMode
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200'
                        : 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-200'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 text-gray-800 dark:text-white'
                  }`}
                >
                  <div className="flex items-center">
                      {selectedOption === index && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                      <span className="font-medium">
                        <MathText>{option}</MathText>
                      </span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-end items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={selectedOption === null}
                className={`px-6 py-2 text-white rounded-lg transition-colors disabled:cursor-not-allowed ${
                  practiceMode
                    ? 'bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500'
                }`}
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