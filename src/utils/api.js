import axios from 'axios';
import { secureStorage } from './secureStorage.js';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = secureStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      secureStorage.clear();
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden - show error message
      console.error('Access forbidden:', error.response.data?.error);
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data?.error);
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth endpoints
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    profile: '/api/auth/profile',
    testRegister: '/api/auth/test-register',
  },
  
  // Quiz endpoints
  quiz: {
    getByChapter: (chapter) => `/api/quizzes?chapter=${encodeURIComponent(chapter)}`,
    getAll: '/api/quizzes',
  },
  
  // Leaderboard endpoints
  leaderboard: {
    get: '/api/leaderboard',
    submit: '/api/leaderboard/submit',
    reset: '/api/admin/reset-leaderboard',
  },
  
  // Admin endpoints
  admin: {
    users: '/api/admin/users',
    chapters: '/api/admin/chapters',
    questions: '/api/admin/questions',
    resetUserScore: (userId) => `/api/admin/users/${userId}/reset-score`,
  },
  
  // Battle endpoints
  battle: {
    rooms: '/api/battle-rooms',
    room: (roomId) => `/api/battle-rooms/${roomId}`,
  },
  
  // Test endpoint
  test: '/api/test',
};

// Helper functions for common API calls
export const apiHelpers = {
  // Auth helpers
  login: (credentials) => api.post(endpoints.auth.login, credentials),
  register: (userData) => api.post(endpoints.auth.register, userData),
  getProfile: () => api.get(endpoints.auth.profile),
  
  // Quiz helpers
  getQuizByChapter: (chapter) => api.get(endpoints.quiz.getByChapter(chapter)),
  getAllQuizzes: () => api.get(endpoints.quiz.getAll),
  
  // Leaderboard helpers
  getLeaderboard: () => api.get(endpoints.leaderboard.get),
  submitScore: (scoreData) => api.post(endpoints.leaderboard.submit, scoreData),
  
  // Admin helpers
  getUsers: () => api.get(endpoints.admin.users),
  getChapters: () => api.get(endpoints.admin.chapters),
  getQuestions: () => api.get(endpoints.admin.questions),
  createChapter: (chapterData) => api.post(endpoints.admin.chapters, chapterData),
  updateChapter: (id, chapterData) => api.put(`${endpoints.admin.chapters}/${id}`, chapterData),
  deleteChapter: (id) => api.delete(`${endpoints.admin.chapters}/${id}`),
  createQuestion: (questionData) => api.post(endpoints.admin.questions, questionData),
  updateQuestion: (id, questionData) => api.put(`${endpoints.admin.questions}/${id}`, questionData),
  deleteQuestion: (id) => api.delete(`${endpoints.admin.questions}/${id}`),
  resetLeaderboard: () => api.post(endpoints.leaderboard.reset),
  resetUserScore: (userId) => api.post(endpoints.admin.resetUserScore(userId)),
  
  // Battle helpers
  getBattleRooms: () => api.get(endpoints.battle.rooms),
  getBattleRoom: (roomId) => api.get(endpoints.battle.room(roomId)),
  
  // Test helper
  testConnection: () => api.get(endpoints.test),
};

export default api;