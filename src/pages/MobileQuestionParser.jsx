import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaMobile, FaCopy, FaPlus } from 'react-icons/fa';
import { secureStorage } from '../utils/secureStorage.js';

const MobileQuestionParser = () => {
  const [url, setUrl] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const extractFromUrl = async () => {
    if (!url.trim()) {
      setErrorMessage('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      const response = await axios.post(`${apiUrl}/api/admin/extract-questions`, {
        url: url.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setExtractedText(response.data.text);
        setSuccessMessage('Questions extracted! Now parse them below.');
      } else {
        setErrorMessage('Failed to extract questions from URL');
      }
    } catch (error) {
      setErrorMessage('Failed to extract questions. Make sure the URL is accessible.');
    } finally {
      setIsLoading(false);
    }
  };

  const parseQuestions = () => {
    if (!extractedText.trim()) {
      setErrorMessage('No text to parse');
      return;
    }

    try {
      // Simple question parsing logic
      const lines = extractedText.split('\n').filter(line => line.trim());
      const questions = [];
      let currentQuestion = null;

      for (let line of lines) {
        line = line.trim();
        
        // Question pattern (starts with number)
        if (/^\d+\./.test(line)) {
          if (currentQuestion) {
            questions.push(currentQuestion);
          }
          currentQuestion = {
            question: line.replace(/^\d+\.\s*/, ''),
            options: [],
            correctAnswer: '',
            explanation: ''
          };
        }
        // Option pattern (A, B, C, D)
        else if (/^[A-D][\.\)]\s*/.test(line) && currentQuestion) {
          const option = line.replace(/^[A-D][\.\)]\s*/, '');
          currentQuestion.options.push(option);
        }
        // Answer pattern
        else if (/^(Answer|Ans):\s*[A-D]/i.test(line) && currentQuestion) {
          const match = line.match(/[A-D]/);
          if (match) {
            currentQuestion.correctAnswer = match[0];
          }
        }
      }

      if (currentQuestion) {
        questions.push(currentQuestion);
      }

      setParsedQuestions(questions);
      setSuccessMessage(`Parsed ${questions.length} questions successfully!`);
    } catch (error) {
      setErrorMessage('Failed to parse questions. Check the text format.');
    }
  };

  const addQuestions = async () => {
    if (parsedQuestions.length === 0) {
      setErrorMessage('No questions to add');
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      const response = await axios.post(`${apiUrl}/api/admin/add-parsed-questions`, {
        questions: parsedQuestions,
        chapter: 'Mobile Parsed Questions'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccessMessage(`Added ${parsedQuestions.length} questions successfully!`);
        setParsedQuestions([]);
        setExtractedText('');
        setUrl('');
      }
    } catch (error) {
      setErrorMessage('Failed to add questions to database');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <FaMobile className="text-3xl text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Mobile Question Parser</h1>
              <p className="text-blue-200">Extract questions from any webpage - mobile friendly!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Status Messages */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-md mb-6">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md mb-6">
            {errorMessage}
          </div>
        )}

        {/* URL Input */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Step 1: Extract from URL</h3>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter webpage URL (e.g., https://example.com/questions)"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
            />
            <button
              onClick={extractFromUrl}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Extract
            </button>
          </div>
        </div>

        {/* Extracted Text */}
        {extractedText && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Step 2: Review Extracted Text</h3>
            <textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 font-mono text-sm"
            />
            <button
              onClick={parseQuestions}
              className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Parse Questions
            </button>
          </div>
        )}

        {/* Parsed Questions */}
        {parsedQuestions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Step 3: Parsed Questions ({parsedQuestions.length})</h3>
              <button
                onClick={addQuestions}
                disabled={isLoading}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <FaPlus />
                <span>Add to Database</span>
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {parsedQuestions.map((q, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Q{index + 1}: {q.question}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    {q.options.map((option, i) => (
                      <div key={i} className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {String.fromCharCode(65 + i)}: {option}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Answer: {q.correctAnswer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileQuestionParser;