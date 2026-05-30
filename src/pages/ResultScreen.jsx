import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaTimes, FaEye, FaArrowLeft, FaArrowRight, FaHome, FaTrophy } from "react-icons/fa";
import MathText from "../components/MathText";
import axios from "axios";
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';

export default function ResultScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract data from location state
  const {
    score = 0,
    total = 0,
    practiceMode = false,
    isFirstAttempt = true,
    previousBestScore = 0,
    improved = false,
    leaderboardUpdated = false,
    badgesUpdated = false,
    currentBadges = [],
    questions = [],
    userAnswers = [],
    correctAnswers = [],
    timeSpent = 0,
    chapter = '',
    battleResults = null
  } = location.state || {};

  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || "";

  // Auto-submit score when component mounts (only for non-practice mode)
  useEffect(() => {
    const submitScore = async () => {
      try {
        if (practiceMode) {
          console.log('Practice mode - skipping score submission');
          return;
        }

        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken || !userData.username) {
          console.log('No authenticated user found, skipping score submission');
          return;
        }

        await axios.post(`${API_URL}/api/score`, {
          userId: userData._id,
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

    if (score > 0 && !practiceMode) {
      submitScore();
    }
  }, [score, API_URL, practiceMode]);

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  
  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-500 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getScoreMessage = (percentage) => {
    if (percentage >= 90) return '🎉 Excellent! Outstanding performance!';
    if (percentage >= 80) return '👏 Great job! Well done!';
    if (percentage >= 70) return '👍 Good work! Keep it up!';
    if (percentage >= 60) return '📚 Not bad! Room for improvement.';
    return '📖 Keep studying! You can do better!';
  };

  const getBadgeColor = (percentage) => {
    if (percentage >= 90) return 'from-yellow-400 to-orange-500';
    if (percentage >= 80) return 'from-green-400 to-blue-500';
    if (percentage >= 70) return 'from-blue-400 to-purple-500';
    if (percentage >= 60) return 'from-purple-400 to-pink-500';
    return 'from-gray-400 to-gray-600';
  };

  // Prepare review data
  const reviewData = questions.map((question, index) => {
    const userAnswer = userAnswers[index];
    const correctAnswer = question.correctAnswerIndex !== undefined 
      ? question.correctAnswerIndex 
      : question.options.findIndex(opt => opt === question.correctAnswer);
    
    const isCorrect = userAnswer === correctAnswer;
    
    return {
      question: question.question,
      options: question.options,
      userAnswer,
      correctAnswer,
      isCorrect,
      explanation: question.explanation || null
    };
  });

  const wrongAnswers = reviewData.filter(item => !item.isCorrect);

  const handleReviewNavigation = (direction) => {
    if (direction === 'next' && currentReviewIndex < reviewData.length - 1) {
      setCurrentReviewIndex(currentReviewIndex + 1);
    } else if (direction === 'prev' && currentReviewIndex > 0) {
      setCurrentReviewIndex(currentReviewIndex - 1);
    }
  };

  if (showReview && reviewData.length > 0) {
    const currentItem = reviewData[currentReviewIndex];
    
    return (
      <PageShell className="min-h-[calc(100vh-3.5rem)]">
        {/* Header */}
        <div className="aura-glass p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setShowReview(false)}
              className="flex items-center gap-2"
            >
              <FaArrowLeft />
              <span>Back to Results</span>
            </Button>
            
            <div className="text-center">
              <h1 className="aura-headline text-xl">Quiz Review</h1>
              <p className="aura-subhead text-sm">
                Question {currentReviewIndex + 1} of {reviewData.length}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReviewNavigation('prev')}
                disabled={currentReviewIndex === 0}
              >
                <FaArrowLeft />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReviewNavigation('next')}
                disabled={currentReviewIndex === reviewData.length - 1}
              >
                <FaArrowRight />
              </Button>
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div className="max-w-4xl mx-auto p-6">
          <motion.div
            key={currentReviewIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="aura-glass aura-glass-card p-6"
          >
            {/* Question */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                {currentItem.isCorrect ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <FaCheck className="text-lg" />
                    <span className="font-semibold">Correct</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400">
                    <FaTimes className="text-lg" />
                    <span className="font-semibold">Incorrect</span>
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-semibold mb-4 text-slate-200">
                <MathText>{currentItem.question}</MathText>
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentItem.options.map((option, index) => {
                const isUserAnswer = index === currentItem.userAnswer;
                const isCorrectAnswer = index === currentItem.correctAnswer;
                
                let optionClass = "p-4 rounded-lg border-2 transition-all duration-200 ";
                
                if (isCorrectAnswer) {
                  optionClass += "border-green-500 bg-green-500/10 text-green-300";
                } else if (isUserAnswer && !isCorrectAnswer) {
                  optionClass += "border-red-500 bg-red-500/10 text-red-300";
                } else {
                  optionClass += "border-cyan-500/20 bg-black/20 text-slate-300";
                }
                
                return (
                  <div key={index} className={optionClass}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        <MathText>{option}</MathText>
                      </span>
                      <div className="flex items-center gap-2">
                        {isCorrectAnswer && (
                          <span className="text-green-400 text-sm font-semibold">
                            ✓ Correct Answer
                          </span>
                        )}
                        {isUserAnswer && !isCorrectAnswer && (
                          <span className="text-red-400 text-sm font-semibold">
                            ✗ Your Answer
                          </span>
                        )}
                        {isUserAnswer && isCorrectAnswer && (
                          <span className="text-green-400 text-sm font-semibold">
                            ✓ Your Answer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            {currentItem.explanation && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-300 mb-2">
                  Explanation:
                </h3>
                <p className="text-blue-200">
                  {currentItem.explanation}
                </p>
              </div>
            )}
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-center mt-6 gap-4">
            <Button
              variant="magenta"
              onClick={() => setCurrentReviewIndex(Math.max(0, wrongAnswers.findIndex(item => reviewData.indexOf(item) > currentReviewIndex)))}
              disabled={wrongAnswers.length === 0}
            >
              Next Wrong Answer
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="aura-glass aura-glass-card p-6 sm:p-8 max-w-lg w-full relative z-10"
      >
        <div className="text-center">
          {/* Header */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="aura-headline text-3xl md:text-4xl mb-6"
          >
            {battleResults ? 'Battle Complete! ⚔️' : 'Quiz Complete! 🎯'}
          </motion.h1>

          {/* Practice Mode Indicator */}
          {practiceMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="aura-chip mb-4"
              style={{ background: 'rgba(249, 115, 22, 0.15)', borderColor: 'rgba(249, 115, 22, 0.3)', color: '#f97316' }}
            >
              🔄 Practice Mode - Results don't affect your stats
            </motion.div>
          )}

          {/* Score Display */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <div className={`text-6xl font-bold ${getScoreColor(percentage)} mb-2`}> 
              {percentage}%
            </div>
            <div className="text-xl text-slate-300">
              {score} / {total} correct
            </div>
            
            {/* Time spent */}
            {timeSpent > 0 && (
              <div className="text-sm text-slate-400 mt-2">
                Time: {Math.floor(timeSpent / 60000)}:{((timeSpent % 60000) / 1000).toFixed(0).padStart(2, '0')}
              </div>
            )}
          </motion.div>

          {/* Score Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${getBadgeColor(percentage)} text-white font-semibold mb-4`}
          >
            {percentage >= 90 ? '🏆 Excellent' : 
             percentage >= 80 ? '🥇 Great' : 
             percentage >= 70 ? '🥈 Good' : 
             percentage >= 60 ? '🥉 Fair' : '📚 Study More'}
          </motion.div>

          {/* Score Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="aura-subhead text-lg mb-6"
          >
            {getScoreMessage(percentage)}
          </motion.p>

          {/* Practice Mode Results */}
          {practiceMode && previousBestScore > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="aura-glass p-4 mb-6"
            >
              <div className="text-sm text-slate-400 mb-2">
                Previous Best Score: {previousBestScore}/{total}
              </div>
              {improved && (
                <div className="text-green-400 font-semibold">
                  🎉 You improved your score!
                </div>
              )}
            </motion.div>
          )}

          {/* Score submission status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mb-6"
          >
            {!practiceMode && scoreSubmitted && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg">
                ✅ Score submitted to leaderboard!
              </div>
            )}
            {submissionError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
                ❌ {submissionError}
              </div>
            )}
            {!practiceMode && !scoreSubmitted && !submissionError && score > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded-lg">
                ⏳ Submitting score...
              </div>
            )}
          </motion.div>

          {/* Review Button */}
          {reviewData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mb-4"
            >
              <Button
                onClick={() => setShowReview(true)}
                className="w-full"
              >
                <FaEye className="mr-2" />
                <span>Review Answers ({wrongAnswers.length} wrong)</span>
              </Button>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="space-y-3"
          >
            <Button
              onClick={() => navigate("/leaderboard")}
              className="w-full"
            >
              <FaTrophy className="mr-2" />
              <span>View Leaderboard</span>
            </Button>
            
            <Button
              variant="magenta"
              onClick={() => navigate("/dashboard")}
              className="w-full"
            >
              <FaHome className="mr-2" />
              <span>Back to Dashboard</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </PageShell>
  );
}