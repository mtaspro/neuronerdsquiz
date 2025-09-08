import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCheck, FaTimes, FaLightbulb } from 'react-icons/fa';
import MathText from '../components/MathText';

const BattleReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions = [], results = [], roomId } = location.state || {};
  const [currentQuestion, setCurrentQuestion] = useState(0);

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">No Battle Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">No battle questions to review.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            <FaArrowLeft />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold">Battle Review</h1>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Room: {roomId}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Question {currentQuestion + 1} of {questions.length}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                disabled={currentQuestion === questions.length - 1}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          {/* Question Progress */}
          <div className="flex space-x-1 mb-4">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded text-xs font-semibold transition-colors ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question Content */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          {/* Question */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">
              <MathText>{question.question}</MathText>
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {question.options?.map((option, index) => {
              const isCorrect = index === question.correctAnswer;
              
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    isCorrect
                      ? 'bg-green-100 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-300'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="font-semibold mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {isCorrect && (
                      <FaCheck className="text-green-600 dark:text-green-400 mr-2" />
                    )}
                    <MathText>{option}</MathText>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          {question.explanation && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <FaLightbulb className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Explanation</h4>
                  <div className="text-blue-700 dark:text-blue-200">
                    <MathText>{question.explanation}</MathText>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Battle Results Summary */}
        {results.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Battle Results</h3>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={result.userId}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700'
                      : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{result.username}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{result.score}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {result.correctAnswers}/{result.totalQuestions} correct
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleReview;