import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaUser, FaUsers, FaPaperPlane } from 'react-icons/fa';
import { secureStorage } from '../utils/secureStorage.js';

const UserWhatsApp = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userData = secureStorage.getUserData();
    setCurrentUser(userData);
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      const response = await axios.get(`${apiUrl}/api/user/whatsapp-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      const response = await axios.get(`${apiUrl}/api/user/whatsapp-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setGroups(response.data.groups || []);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const sendMessage = async (type) => {
    if (!message.trim()) {
      setErrorMessage('Please enter a message');
      return;
    }

    if (type === 'individual' && !selectedUser) {
      setErrorMessage('Please select a user');
      return;
    }

    if (type === 'group' && !selectedGroup) {
      setErrorMessage('Please select a group');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      const endpoint = type === 'individual' 
        ? '/api/user/send-whatsapp-message'
        : '/api/user/send-whatsapp-group-message';

      const data = type === 'individual'
        ? { recipientId: selectedUser, message: message.trim() }
        : { groupId: selectedGroup, message: message.trim() };

      const response = await axios.post(`${apiUrl}${endpoint}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccessMessage('Message sent successfully!');
        setMessage('');
        setSelectedUser('');
        setSelectedGroup('');
      } else {
        setErrorMessage(response.data.error || 'Failed to send message');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900 to-teal-900 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">WhatsApp Messenger</h1>
          <p className="text-green-200">Send messages to other users through WhatsApp</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        {/* Status Messages */}
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

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          {/* Message Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Your Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 resize-none"
            />
          </div>

          {/* Send to Individual User */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2 flex items-center">
              <FaUser className="mr-2" />
              Send to User
            </h3>
            <div className="flex gap-2">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700"
              >
                <option value="">Select User</option>
                {users.filter(user => user._id !== currentUser?._id).map(user => (
                  <option key={user._id} value={user._id}>
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
            {users.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                No users with WhatsApp found
              </p>
            )}
          </div>

          {/* Send to Group */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2 flex items-center">
              <FaUsers className="mr-2" />
              Send to Group
            </h3>
            <div className="flex gap-2">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700"
              >
                <option value="">Select Group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.participants} members)
                  </option>
                ))}
              </select>
              <button
                onClick={() => sendMessage('group')}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                <FaPaperPlane className="mr-1" />
                Send
              </button>
            </div>
            {groups.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                No groups available
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Messages are sent from our WhatsApp bot</li>
              <li>• Recipients will see your name in the message</li>
              <li>• You can only message registered users with WhatsApp numbers</li>
              <li>• Group messages require the bot to be in the group</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserWhatsApp;