import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaWhatsapp, FaPaperPlane, FaUsers, FaUser } from 'react-icons/fa';
import { secureStorage } from '../utils/secureStorage.js';

const AdminWhatsApp = () => {
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [groupId, setGroupId] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      const response = await axios.get(`${apiUrl}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users.filter(user => user.phoneNumber));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const sendMessage = async (type) => {
    if (!message.trim()) {
      setErrorMessage('Message is required');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      let endpoint = '';
      let data = { message };

      switch (type) {
        case 'individual':
          if (!phoneNumber.trim()) {
            setErrorMessage('Phone number is required');
            setIsLoading(false);
            return;
          }
          endpoint = '/api/whatsapp/send-message';
          data.phoneNumber = phoneNumber;
          break;
        case 'broadcast':
          endpoint = '/api/whatsapp/broadcast';
          data.userIds = selectedUsers;
          break;
        case 'group':
          if (!groupId.trim()) {
            setErrorMessage('Group ID is required');
            setIsLoading(false);
            return;
          }
          endpoint = '/api/whatsapp/send-group';
          data.groupId = groupId;
          break;
      }

      const response = await axios.post(`${apiUrl}${endpoint}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success || response.data.results) {
        setSuccessMessage(response.data.message || 'Message sent successfully!');
        setMessage('');
        setPhoneNumber('');
        setGroupId('');
        setSelectedUsers([]);
      } else {
        setErrorMessage(response.data.error || 'Failed to send message');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="bg-gradient-to-r from-green-600 to-green-800 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <FaWhatsapp className="mr-3" />
            WhatsApp Admin Panel
          </h1>
          <p className="text-green-200 mt-2">Send messages to users via WhatsApp</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-md mb-6"
          >
            {successMessage}
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md mb-6"
          >
            {errorMessage}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Composition */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold mb-4">Compose Message</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700"
              />
            </div>

            {/* Individual Message */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2 flex items-center">
                <FaUser className="mr-2" />
                Send to Individual
              </h3>
              <div className="flex gap-2">
                <select
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700"
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user._id} value={user.phoneNumber}>
                      {user.username} ({user.phoneNumber})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => sendMessage('individual')}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  <FaPaperPlane className="mr-1" />
                  Send
                </button>
              </div>
            </div>

            {/* Group Message */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Send to Group</h3>
              <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>How to get Group ID:</strong><br/>
                  1. Open WhatsApp Web<br/>
                  2. Go to the group chat<br/>
                  3. Check browser URL - copy the part after "chat/" (e.g., 120363418978278612@g.us)
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  placeholder="Group ID (e.g., 120363418978278612@g.us)"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700"
                />
                <button
                  onClick={() => sendMessage('group')}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  <FaPaperPlane className="mr-1" />
                  Send
                </button>
              </div>
            </div>

            {/* Broadcast */}
            <div>
              <button
                onClick={() => sendMessage('broadcast')}
                disabled={isLoading || selectedUsers.length === 0}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                <FaUsers className="mr-2" />
                Broadcast to Selected Users ({selectedUsers.length})
              </button>
            </div>
          </motion.div>

          {/* User Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold mb-4">Select Users</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Users with phone numbers ({users.length} total)
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map(user => (
                <div
                  key={user._id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedUsers.includes(user._id)
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => toggleUserSelection(user._id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.phoneNumber}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleUserSelection(user._id)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {users.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No users with phone numbers found
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminWhatsApp;