import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaCheck, FaTimes, FaUser, FaTrash, FaHistory, FaPalette, FaGraduationCap, FaPlus } from 'react-icons/fa';
import { useNotification } from '../components/NotificationSystem';
import { secureStorage } from '../utils/secureStorage.js';

const SuperAdminDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [globalTheme, setGlobalTheme] = useState('tech-bg');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [showExamManager, setShowExamManager] = useState(false);
  const [exams, setExams] = useState([]);
  const [newExam, setNewExam] = useState({ examName: '', examDate: '' });
  const { success, error: showError } = useNotification();

  const themes = [
    { id: 'tech-bg', name: 'LOONY CIRCLES' },
    { id: 'tech-bg1', name: 'CUTY KITTENS' },
    { id: 'tech-bg2', name: 'LIVING KING' },
    { id: 'tech-bg3', name: 'ALIEN ISOLATION' },
    { id: 'tech-bg4', name: 'RADIOGRAPHY DNA' },
    { id: 'tech-bg5', name: 'CRYSTAL MATRIX' },
    { id: 'tech-bg6', name: 'NEON TUNNEL' }
  ];

  useEffect(() => {
    fetchRequests();
    fetchGlobalSettings();
    loadExams();
  }, []);

  const fetchRequests = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      const [pendingRes, allRes] = await Promise.all([
        axios.get(`${apiUrl}/api/superadmin/requests`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${apiUrl}/api/superadmin/requests/all`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setPendingRequests(pendingRes.data);
      setAllRequests(allRes.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showError('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      const response = await axios.get(`${apiUrl}/api/superadmin/global-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const themeSettings = response.data.find(s => s.settingKey === 'defaultTheme');
      if (themeSettings) {
        setGlobalTheme(themeSettings.settingValue);
      }
    } catch (error) {
      console.error('Error fetching global settings:', error);
    }
  };

  const loadExams = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${apiUrl}/api/exams`);
      setExams(response.data);
    } catch (error) {
      console.error('Error loading exams:', error);
    }
  };

  const addExam = async () => {
    if (!newExam.examName || !newExam.examDate) {
      showError('Please fill in all fields');
      return;
    }
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await axios.post(`${apiUrl}/api/exams`, {
        ...newExam,
        createdBy: 'SuperAdmin'
      });
      
      setNewExam({ examName: '', examDate: '' });
      loadExams();
      success('Exam added successfully');
    } catch (error) {
      console.error('Error adding exam:', error);
      showError('Failed to add exam');
    }
  };

  const deleteExam = async (examId) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await axios.delete(`${apiUrl}/api/exams/${examId}`);
      loadExams();
      success('Exam deleted successfully');
    } catch (error) {
      console.error('Error deleting exam:', error);
      showError('Failed to delete exam');
    }
  };

  const handleSetGlobalTheme = async (theme) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      await axios.post(`${apiUrl}/api/superadmin/set-global-theme`, {
        theme
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGlobalTheme(theme);
      success(`Global theme set to ${themes.find(t => t.id === theme)?.name}`);
    } catch (error) {
      console.error('Error setting global theme:', error);
      showError('Failed to set global theme');
    }
  };

  const handleStartEvent = async () => {
    if (!eventEndDate || !eventEndTime) {
      showError('Please set both end date and time');
      return;
    }
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      const endDateTime = new Date(`${eventEndDate}T${eventEndTime}`);
      
      await axios.post(`${apiUrl}/api/superadmin/start-showdown-event`, {
        endTime: endDateTime.toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      success('Neuronerds Showdown event started!');
    } catch (error) {
      console.error('Error starting event:', error);
      showError('Failed to start event');
    }
  };

  const handleEndEvent = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      await axios.post(`${apiUrl}/api/superadmin/end-showdown-event`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      success('Neuronerds Showdown event ended!');
    } catch (error) {
      console.error('Error ending event:', error);
      showError('Failed to end event');
    }
  };

  const handleEnableMaintenance = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      await axios.post(`${apiUrl}/api/superadmin/maintenance/enable`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      success('Maintenance mode enabled! Users will receive 60s warning.');
    } catch (error) {
      console.error('Error enabling maintenance:', error);
      showError('Failed to enable maintenance mode');
    }
  };

  const handleDisableMaintenance = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      await axios.post(`${apiUrl}/api/superadmin/maintenance/disable`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      success('Maintenance mode disabled! Site is back to normal.');
    } catch (error) {
      console.error('Error disabling maintenance:', error);
      showError('Failed to disable maintenance mode');
    }
  };

  const handleReviewRequest = async (requestId, action, notes = '') => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      await axios.post(`${apiUrl}/api/superadmin/requests/${requestId}/review`, {
        action,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      success(`Request ${action.toLowerCase()}d successfully`);
      fetchRequests(); // Refresh the lists
    } catch (error) {
      console.error('Error reviewing request:', error);
      showError('Failed to review request');
    }
  };

  const getRequestTypeIcon = (type) => {
    return type === 'USER_DELETION' ? <FaUser /> : <FaTrash />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-800 dark:text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">SuperAdmin Dashboard</h1>
          <p className="text-purple-200">Manage admin requests and system operations</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Global Theme Settings */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <FaPalette className="text-purple-600 text-xl" />
            <h2 className="text-xl font-semibold">Global Theme Settings</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Set the default theme for all users. Users can still override this with their personal preference.
          </p>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSetGlobalTheme(theme.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  globalTheme === theme.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {theme.name}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Current global default: <span className="font-semibold">{themes.find(t => t.id === globalTheme)?.name}</span>
          </p>
        </div>

        {/* Maintenance Mode */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-blue-600 text-xl">🔧</div>
            <h2 className="text-xl font-semibold">Maintenance Mode</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Control site-wide maintenance mode. Users get 60s warning before activation.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={handleEnableMaintenance}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              ⚠️ Enable Maintenance Mode
            </button>
            <button
              onClick={handleDisableMaintenance}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              ✅ Disable Maintenance Mode
            </button>
          </div>
        </div>

        {/* Exam Manager */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FaGraduationCap className="text-indigo-600 text-xl" />
              <h2 className="text-xl font-semibold">Exam Manager</h2>
            </div>
            <button
              onClick={() => setShowExamManager(!showExamManager)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {showExamManager ? 'Hide' : 'Show'} Exams
            </button>
          </div>
          
          {showExamManager && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Exam Name (e.g., HSC Chemistry)"
                  value={newExam.examName}
                  onChange={(e) => setNewExam({...newExam, examName: e.target.value})}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="date"
                  value={newExam.examDate}
                  onChange={(e) => setNewExam({...newExam, examDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={addExam}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                >
                  <FaPlus />
                  <span>Add Exam</span>
                </button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {exams.map((exam) => {
                  const examDate = new Date(exam.examDate);
                  const today = new Date();
                  const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={exam._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium">{exam.examName}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {examDate.toLocaleDateString()} 
                          {daysLeft >= 0 ? ` (${daysLeft} days left)` : ' (Past)'}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteExam(exam._id)}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  );
                })}
                {exams.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No exams added yet</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Event Management */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-orange-600 text-xl">🔥</div>
            <h2 className="text-xl font-semibold">Neuronerds Showdown Event</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Set custom end date/time for the event countdown.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleStartEvent}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              🚀 Start Event
            </button>
            <button
              onClick={handleEndEvent}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              🛑 End Event
            </button>
          </div>
        </div>

        {/* Toggle Buttons */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setShowHistory(false)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              !showHistory 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Pending Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              showHistory 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FaHistory className="inline mr-2" />
            All Requests ({allRequests.length})
          </button>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {(showHistory ? allRequests : pendingRequests).map((request) => (
            <motion.div
              key={request._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-purple-600 text-xl">
                      {getRequestTypeIcon(request.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {request.type === 'USER_DELETION' ? 'User Deletion Request' : 'Leaderboard Reset Request'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Requested by: {request.requestedByUsername}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                      {request.status}
                    </div>
                  </div>

                  {request.type === 'USER_DELETION' && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Target User:</p>
                      <p className="font-medium">{request.targetUsername}</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reason:</p>
                    <p className="text-gray-800 dark:text-gray-200">{request.reason}</p>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Requested: {new Date(request.createdAt).toLocaleString()}
                  </div>

                  {request.reviewedAt && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Reviewed: {new Date(request.reviewedAt).toLocaleString()}
                      </p>
                      {request.reviewNotes && (
                        <p className="text-sm mt-1">Notes: {request.reviewNotes}</p>
                      )}
                    </div>
                  )}
                </div>

                {request.status === 'PENDING' && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleReviewRequest(request._id, 'APPROVE')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <FaCheck />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Rejection reason (optional):');
                        handleReviewRequest(request._id, 'REJECT', notes || '');
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <FaTimes />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {(showHistory ? allRequests : pendingRequests).length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                {showHistory ? 'No requests found' : 'No pending requests'}
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                {showHistory ? 'No admin requests have been made yet.' : 'All requests have been reviewed.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;