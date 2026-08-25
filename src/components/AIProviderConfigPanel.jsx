import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { secureStorage } from '../utils/secureStorage.js';

const PROVIDERS = [
  { id: 'openrouter', label: 'OpenRouter' },
  { id: 'groq', label: 'Groq' },
  { id: 'gemini', label: 'Gemini API' },
  { id: 'hcn', label: 'HCN API' }
];

const INTEGRATIONS = [
  {
    key: 'neurax',
    title: 'NeuraX Web Chat',
    description: 'Used by the /ai-chat page. Turn on override to ignore the in-chat model picker.',
    showOverride: true,
    examples: {
      openrouter: 'openrouter/free  or  meta-llama/llama-3.3-70b-instruct:free',
      groq: 'llama-3.3-70b-versatile  or  qwen/qwen3-32b',
      gemini: 'gemini-2.5-flash-lite  or  gemini-2.5-flash',
      hcn: 'step-3.5-flash  or  step-3.7-flash  or  DeepSeek-V4-Pro'
    }
  },
  {
    key: 'daily_calendar',
    title: 'Daily Calendar Message',
    description: 'Midnight WhatsApp calendar / motivation message.',
    showOverride: false,
    examples: {
      openrouter: 'openrouter/free',
      groq: 'llama-3.3-70b-versatile',
      gemini: 'gemini-2.5-flash',
      hcn: 'step-3.5-flash'
    }
  },
  {
    key: 'whatsapp_bot',
    title: 'WhatsApp Bot (@n)',
    description: 'Group replies when someone mentions @n.',
    showOverride: false,
    examples: {
      openrouter: 'openrouter/free',
      groq: 'llama-3.3-70b-versatile',
      gemini: 'gemini-2.0-flash-lite',
      hcn: 'step-3.5-flash'
    }
  }
];

const emptyConfig = {
  neurax: {
    enabled: true,
    provider: 'hcn',
    modelId: 'step-3.5-flash',
    overrideClientModel: false,
    fallbackEnabled: true,
    fallbackProvider: 'openrouter',
    fallbackModelId: 'openrouter/free'
  },
  daily_calendar: {
    enabled: true,
    provider: 'gemini',
    modelId: 'gemini-2.5-flash',
    overrideClientModel: true,
    fallbackEnabled: true,
    fallbackProvider: 'openrouter',
    fallbackModelId: 'openrouter/free'
  },
  whatsapp_bot: {
    enabled: true,
    provider: 'hcn',
    modelId: 'step-3.5-flash',
    overrideClientModel: true,
    fallbackEnabled: true,
    fallbackProvider: 'openrouter',
    fallbackModelId: 'openrouter/free'
  }
};

const AIProviderConfigPanel = () => {
  const [config, setConfig] = useState(emptyConfig);
  const [providerKeys, setProviderKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const authHeaders = () => ({ Authorization: `Bearer ${secureStorage.getToken()}` });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/api/superadmin/ai-integrations`, {
        headers: authHeaders()
      });
      setConfig(response.data.integrations || emptyConfig);
      setProviderKeys(response.data.providerKeys || {});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load AI integration settings');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.put(
        `${apiUrl}/api/superadmin/ai-integrations`,
        { integrations: config },
        { headers: authHeaders() }
      );
      setConfig(response.data.integrations);
      setProviderKeys(response.data.providerKeys || providerKeys);
      setSuccess('AI provider settings saved. New chats use them immediately.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save AI integration settings');
    } finally {
      setSaving(false);
    }
  };

  const updateIntegration = (key, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-gray-600 dark:text-gray-400">Loading AI provider settings...</div>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3 mb-2">
        <div className="text-indigo-500 text-xl">🤖</div>
        <h2 className="text-xl font-semibold">AI Provider Routing</h2>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Switch OpenRouter, Groq, Gemini, or HCN per integration and type the exact model ID.
        No code deploy is needed after you save.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {PROVIDERS.map((provider) => (
          <span
            key={provider.id}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              providerKeys[provider.id]
                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
            }`}
          >
            {provider.label}: {providerKeys[provider.id] ? 'key set' : 'missing key'}
          </span>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 text-sm">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {INTEGRATIONS.map((item) => {
          const row = config[item.key] || emptyConfig[item.key];
          return (
            <div
              key={item.key}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={row.enabled !== false}
                    onChange={(e) => updateIntegration(item.key, 'enabled', e.target.checked)}
                  />
                  Enabled
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Provider</label>
                  <select
                    value={row.provider}
                    onChange={(e) => updateIntegration(item.key, 'provider', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  >
                    {PROVIDERS.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Model ID</label>
                  <input
                    type="text"
                    value={row.modelId || ''}
                    onChange={(e) => updateIntegration(item.key, 'modelId', e.target.value)}
                    placeholder="Paste the exact model id"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: {item.examples[row.provider]}
                  </p>
                </div>
              </div>

              {item.showOverride && (
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(row.overrideClientModel)}
                    onChange={(e) => updateIntegration(item.key, 'overrideClientModel', e.target.checked)}
                  />
                  Force this provider/model (ignore the NeuraX chat model selector)
                </label>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <input
                    type="checkbox"
                    checked={row.fallbackEnabled !== false}
                    onChange={(e) => updateIntegration(item.key, 'fallbackEnabled', e.target.checked)}
                  />
                  Fallback if primary fails / rate-limits
                </label>
                {row.fallbackEnabled !== false && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Fallback provider</label>
                      <select
                        value={row.fallbackProvider}
                        onChange={(e) => updateIntegration(item.key, 'fallbackProvider', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      >
                        {PROVIDERS.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Fallback model ID</label>
                      <input
                        type="text"
                        value={row.fallbackModelId || ''}
                        onChange={(e) => updateIntegration(item.key, 'fallbackModelId', e.target.value)}
                        placeholder="Fallback model id"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-mono text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={saveConfig}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save AI routing'}
        </button>
        <button
          type="button"
          onClick={loadConfig}
          disabled={saving}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Reload
        </button>
      </div>
    </div>
  );
};

export default AIProviderConfigPanel;
