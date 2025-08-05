import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaCopy, FaArrowDown, FaQuestionCircle, FaTimes } from 'react-icons/fa';
import MathText from './MathText';
import axios from 'axios';

const AILatexGenerator = ({ onInsert, onInsertOption, focusedField }) => {
  const [inputText, setInputText] = useState('');
  const [generatedLatex, setGeneratedLatex] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const generateLatex = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to convert');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedLatex('');
    setShowPreview(false);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(`${apiUrl}/api/latex/generate`, {
        text: inputText.trim()
      });

      if (response.data.latex) {
        setGeneratedLatex(response.data.latex);
        setShowPreview(true);
      } else {
        setError('No LaTeX generated');
      }
    } catch (err) {
      console.error('LaTeX generation error:', err);
      setError(err.response?.data?.error || 'Failed to generate LaTeX');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLatex);
  };

  const handleInsert = () => {
    if (generatedLatex) {
      if (focusedField?.startsWith('option') && onInsertOption) {
        onInsertOption(generatedLatex, focusedField);
      } else if (onInsert) {
        onInsert(generatedLatex);
      }
    }
  };

  const getInsertButtonText = () => {
    if (focusedField?.startsWith('option')) {
      return 'Insert into Option';
    }
    return 'Insert into Question';
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center space-x-2 mb-4">
        <FaRobot className="text-purple-600 dark:text-purple-400 text-xl" />
        <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">
          AI LaTeX Generator
        </h3>
      </div>

      {/* Input Field */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Describe your math formula in plain text:
          </label>
          <button
            type="button"
            onClick={() => setShowInstructions(true)}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-colors"
            title="Show instructions"
          >
            <FaQuestionCircle className="text-lg" />
          </button>
        </div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
          rows="3"
          placeholder="e.g., quadratic formula, integral of x squared, matrix with 2 rows and 3 columns..."
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={generateLatex}
        disabled={isLoading || !inputText.trim()}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <FaRobot />
            <span>Generate LaTeX</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Generated LaTeX Preview */}
      {showPreview && generatedLatex && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-4"
        >
          {/* LaTeX Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Generated LaTeX Code:
            </label>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-sm text-gray-800 dark:text-gray-200 border">
              {generatedLatex}
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Live Preview:
            </label>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 text-center">
              <MathText>{generatedLatex}</MathText>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <FaCopy />
              <span>Copy Code</span>
            </button>
            {(onInsert || onInsertOption) && (
              <button
                onClick={handleInsert}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <FaArrowDown />
                <span>{getInsertButtonText()}</span>
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center space-x-2">
                  <FaRobot className="text-purple-600" />
                  <span>AI LaTeX Generator - How to Use</span>
                </h3>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div>
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">📝 How It Works:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Type your math formula description in plain English</li>
                    <li>Click "Generate LaTeX" to convert it using AI</li>
                    <li>Preview the rendered formula</li>
                    <li>Copy the code or insert it directly into your question</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">💡 Example Inputs:</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm space-y-2">
                    <div><strong>"quadratic formula"</strong> → quadratic formula LaTeX</div>
                    <div><strong>"integral of x squared"</strong> → integral LaTeX</div>
                    <div><strong>"2x2 matrix with a, b, c, d"</strong> → matrix LaTeX</div>
                    <div><strong>"square root of x plus y"</strong> → square root LaTeX</div>
                    <div><strong>"derivative of sine x"</strong> → derivative LaTeX</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">✨ Tips for Better Results:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Be specific: "quadratic formula" vs "solve equation"</li>
                    <li>Use math terms: "integral", "derivative", "matrix", "fraction"</li>
                    <li>Specify dimensions: "3x3 matrix", "from 0 to infinity"</li>
                    <li>Include variables: "with respect to x", "where a, b, c"</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">🎯 What You Can Generate:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Equations & Formulas</div>
                    <div>• Fractions & Ratios</div>
                    <div>• Integrals & Derivatives</div>
                    <div>• Matrices & Vectors</div>
                    <div>• Greek Letters</div>
                    <div>• Mathematical Symbols</div>
                    <div>• Subscripts & Superscripts</div>
                    <div>• Complex Expressions</div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>💡 Pro Tip:</strong> The AI generates clean LaTeX code only. You can copy it and use it anywhere that supports LaTeX rendering!
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowInstructions(false)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AILatexGenerator;