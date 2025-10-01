import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaClock, FaPlus, FaEdit, FaTrash, FaBell } from 'react-icons/fa';
import { useNotification } from './NotificationSystem';
import { secureStorage } from '../utils/secureStorage.js';

const BattleReminderManager = () => {
  const [reminders, setReminders] = useState([]);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [newReminder, setNewReminder] = useState({ date: '', topics: '' });
  const [editingId, setEditingId] = useState(null);
  const [editReminder, setEditReminder] = useState({ topics: '', isActive: true });
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useNotification();

  useEffect(() => {
    fetchReminders();
    fetchReminderStatus();
  }, []);

  const fetchReminders = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      const response = await axios.get(`${apiUrl}/api/admin/battle-reminders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReminders(response.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const fetchReminderStatus = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      // First try to get saved time from WhatsApp settings
      const settingsResponse = await axios.get(`${apiUrl}/api/superadmin/whatsapp-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const timeSetting = settingsResponse.data.find(s => s.settingKey === 'battleReminderTime');
      if (timeSetting?.settingValue) {
        setReminderTime(timeSetting.settingValue);
        return;
      }
      
      // Fallback to service status
      const response = await axios.get(`${apiUrl}/api/battle-reminder/status`);
      setReminderTime(response.data.reminderTime || '20:00');
    } catch (error) {
      console.error('Error fetching reminder status:', error);
      setReminderTime('20:00');
    }
  };

  const addReminder = async () => {
    if (!newReminder.date || !newReminder.topics.trim()) {
      showError('Please fill in both date and topics');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      await axios.post(`${apiUrl}/api/admin/battle-reminders`, newReminder, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewReminder({ date: '', topics: '' });
      fetchReminders();
      success('Battle reminder added successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to add reminder');
    } finally {
      setLoading(false);
    }
  };

  const updateReminder = async (id) => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      await axios.put(`${apiUrl}/api/admin/battle-reminders/${id}`, editReminder, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEditingId(null);
      setEditReminder({ topics: '', isActive: true });
      fetchReminders();
      success('Reminder updated successfully');
    } catch (error) {
      showError('Failed to update reminder');
    } finally {
      setLoading(false);
    }
  };

  const deleteReminder = async (id) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      await axios.delete(`${apiUrl}/api/admin/battle-reminders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchReminders();
      success('Reminder deleted successfully');
    } catch (error) {
      showError('Failed to delete reminder');
    }
  };

  const updateReminderTime = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      // Update service time
      await axios.put(`${apiUrl}/api/battle-reminder/time`, { time: reminderTime });
      
      // Save to WhatsApp settings for persistence
      await axios.put(`${apiUrl}/api/superadmin/whatsapp-settings`, {
        settingKey: 'battleReminderTime',
        settingValue: reminderTime
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      success(`Reminder time updated to ${reminderTime}`);
    } catch (error) {
      showError('Failed to update reminder time');
    }
  };

  const triggerManualReminder = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await axios.post(`${apiUrl}/api/battle-reminder/trigger`);
      success('Manual reminder sent successfully');
    } catch (error) {
      showError('Failed to send manual reminder');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <FaBell className="text-blue-600 text-xl" />
        <h2 className="text-xl font-semibold">Battle Reminder Management</h2>
      </div>

      {/* Reminder Time Settings */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <div className="flex items-center space-x-4">
          <FaClock className="text-blue-600" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Daily Reminder Time
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={updateReminderTime}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Update Time
          </button>
          <button
            onClick={triggerManualReminder}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Send Now
          </button>
        </div>
      </div>

      {/* Add New Reminder */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-semibold mb-3">Add New Battle Reminder</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={newReminder.date}
              onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
              min={getTodayDate()}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Battle Topics
            </label>
            <input
              type="text"
              value={newReminder.topics}
              onChange={(e) => setNewReminder({...newReminder, topics: e.target.value})}
              placeholder="e.g., বিলাসী + সোনার তরী"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addReminder}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <FaPlus />
              <span>{loading ? 'Adding...' : 'Add Reminder'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <h3 className="font-semibold">Scheduled Reminders ({reminders.length})</h3>
        {reminders.map((reminder) => (
          <motion.div
            key={reminder._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border ${
              reminder.isActive 
                ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600' 
                : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-500 opacity-60'
            }`}
          >
            {editingId === reminder._id ? (
              <div className="space-y-3">
                <textarea
                  value={editReminder.topics}
                  onChange={(e) => setEditReminder({...editReminder, topics: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="2"
                />
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editReminder.isActive}
                      onChange={(e) => setEditReminder({...editReminder, isActive: e.target.checked})}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateReminder(reminder._id)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-semibold text-blue-600">
                      📅 {formatDate(reminder.date)}
                    </span>
                    {!reminder.isActive && (
                      <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{reminder.topics}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created by: {reminder.createdBy?.username || 'Unknown'}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingId(reminder._id);
                      setEditReminder({ topics: reminder.topics, isActive: reminder.isActive });
                    }}
                    className="text-blue-600 hover:text-blue-800 p-2"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => deleteReminder(reminder._id)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
        
        {reminders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FaBell className="text-4xl mx-auto mb-2 opacity-50" />
            <p>No battle reminders scheduled yet</p>
            <p className="text-sm">Add reminders above to send daily battle topic notifications</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">📱 How it works:</h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• Set daily battle topics with dates</li>
          <li>• Bot automatically sends reminders at configured time</li>
          <li>• Uses the same WhatsApp group as battle notifications</li>
          <li>• You can manually trigger reminders anytime</li>
          <li>• Inactive reminders won't be sent</li>
        </ul>
      </div>
    </div>
  );
};

export default BattleReminderManager;