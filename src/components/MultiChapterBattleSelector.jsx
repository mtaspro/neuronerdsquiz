import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaMinus, FaTrash } from 'react-icons/fa';

const MultiChapterBattleSelector = ({ chapters, onSelectionChange, disabled }) => {
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [showSelector, setShowSelector] = useState(false);

  const addChapter = () => {
    const newChapter = { chapter: '', questions: 5 };
    const updated = [...selectedChapters, newChapter];
    setSelectedChapters(updated);
    onSelectionChange(updated);
  };

  const removeChapter = (index) => {
    const updated = selectedChapters.filter((_, i) => i !== index);
    setSelectedChapters(updated);
    onSelectionChange(updated);
  };

  const updateChapter = (index, field, value) => {
    const updated = selectedChapters.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setSelectedChapters(updated);
    onSelectionChange(updated);
  };

  const getTotalQuestions = () => {
    return selectedChapters.reduce((total, item) => total + (parseInt(item.questions) || 0), 0);
  };

  const isValid = () => {
    return selectedChapters.length > 0 && 
           selectedChapters.every(item => item.chapter && item.questions > 0) &&
           getTotalQuestions() >= 5;
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-orange-600 dark:text-orange-300 font-semibold text-sm">
          Multi-Chapter Battle Setup
        </label>
        <button
          type="button"
          onClick={() => setShowSelector(!showSelector)}
          className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded transition-colors"
          disabled={disabled}
        >
          {showSelector ? 'Hide' : 'Setup'}
        </button>
      </div>

      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-orange-200 dark:border-orange-700"
          >
            <div className="space-y-3">
              {selectedChapters.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-50 dark:bg-gray-600 p-3 rounded space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <select
                      value={item.chapter}
                      onChange={(e) => updateChapter(index, 'chapter', e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 text-sm rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500"
                      disabled={disabled}
                    >
                      <option value="">Select Chapter</option>
                      {chapters.map(chapter => (
                        <option key={chapter._id || chapter.name} value={chapter.name}>
                          {chapter.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeChapter(index)}
                      className="text-red-500 hover:text-red-700 p-2 flex-shrink-0"
                      disabled={disabled}
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 dark:text-gray-300 flex-shrink-0">Questions:</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={item.questions}
                      onChange={(e) => updateChapter(index, 'questions', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 text-sm rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500"
                      placeholder="Qs"
                      disabled={disabled}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={addChapter}
                className="flex items-center space-x-1 text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors"
                disabled={disabled || selectedChapters.length >= 5}
              >
                <FaPlus className="text-xs" />
                <span>Add Chapter</span>
              </button>
              
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Total: {getTotalQuestions()} questions
                {getTotalQuestions() < 5 && (
                  <span className="text-red-500 ml-2">(Min: 5)</span>
                )}
              </div>
            </div>

            {selectedChapters.length > 0 && (
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                <strong>Preview:</strong> {selectedChapters.map((item, i) => 
                  `${item.questions} from ${item.chapter || 'Unknown'}`
                ).join(', ')}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation Status */}
      {showSelector && selectedChapters.length > 0 && (
        <div className={`mt-2 text-xs ${isValid() ? 'text-green-600' : 'text-red-600'}`}>
          {isValid() ? '✓ Ready to create battle' : '⚠ Complete setup to create battle'}
        </div>
      )}
    </div>
  );
};

export default MultiChapterBattleSelector;