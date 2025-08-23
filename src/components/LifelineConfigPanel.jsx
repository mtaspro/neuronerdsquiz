import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { authHeader } from '../utils/auth';

const LifelineConfigPanel = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${apiUrl}/api/superadmin/lifeline-config`, {
        headers: authHeader()
      });
      setConfig(response.data);
    } catch (err) {
      setError('Failed to load lifeline configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await axios.put(`${apiUrl}/api/superadmin/lifeline-config`, config, {
        headers: authHeader()
      });
      setSuccess('Lifeline configuration saved successfully!');
    } catch (err) {
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateTool = (toolName, field, value) => {
    setConfig(prev => ({
      ...prev,
      [toolName]: {
        ...prev[toolName],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading lifeline configuration...</div>
      </div>
    );
  }

  const tools = [
    {
      key: 'skip',
      name: 'Skip Question',
      description: 'Skip current question without penalty',
      icon: '⏭️'
    },
    {
      key: 'help',
      name: 'Show Answer',
      description: 'Show correct answer with score penalty',
      icon: '💡'
    },
    {
      key: 'fiftyFifty',
      name: '50-50',
      description: 'Remove 2 wrong options',
      icon: '👁️'
    },
    {
      key: 'extraTime',
      name: 'Extra Time',
      description: 'Add extra seconds to timer',
      icon: '⏰'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Lifeline Tools Configuration</h3>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50 text-white transition-colors"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {tools.map(tool => {
          const toolConfig = config?.[tool.key] || {};
          
          return (
            <div key={tool.key} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">{tool.icon}</span>
                <div>
                  <h4 className="font-semibold text-lg text-gray-800 dark:text-white">{tool.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{tool.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={toolConfig.enabled || false}
                      onChange={(e) => updateTool(tool.key, 'enabled', e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
                    />
                    <span>Enabled</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Max Uses</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={toolConfig.maxUses || 0}
                    onChange={(e) => updateTool(tool.key, 'maxUses', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={toolConfig.availableInBattle || false}
                      onChange={(e) => updateTool(tool.key, 'availableInBattle', e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Available in Battles</span>
                  </label>
                </div>

                {tool.key === 'help' && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Penalty %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={toolConfig.penaltyPercentage || 50}
                      onChange={(e) => updateTool(tool.key, 'penaltyPercentage', parseInt(e.target.value) || 50)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    />
                  </div>
                )}

                {tool.key === 'extraTime' && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Extra Seconds</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={toolConfig.extraSeconds || 10}
                      onChange={(e) => updateTool(tool.key, 'extraSeconds', parseInt(e.target.value) || 10)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Status:</strong> {toolConfig.enabled ? '✅ Enabled' : '❌ Disabled'} | 
                  <strong> Max Uses:</strong> {toolConfig.maxUses || 0} | 
                  <strong> Battle Mode:</strong> {toolConfig.availableInBattle ? '✅ Available' : '❌ Not Available'}
                  {tool.key === 'help' && <span> | <strong>Penalty:</strong> {toolConfig.penaltyPercentage || 50}%</span>}
                  {tool.key === 'extraTime' && <span> | <strong>Extra Time:</strong> {toolConfig.extraSeconds || 10}s</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">💡 Configuration Tips:</h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• <strong>Skip:</strong> No penalty, question won't appear again</li>
          <li>• <strong>Help:</strong> Shows answer but reduces score by penalty percentage</li>
          <li>• <strong>50-50:</strong> Removes 2 wrong options, keeps correct + 1 wrong</li>
          <li>• <strong>Extra Time:</strong> Only available in normal quizzes, not battles</li>
          <li>• Players can only use each tool up to the max uses limit</li>
        </ul>
      </div>
    </div>
  );
};

export default LifelineConfigPanel;