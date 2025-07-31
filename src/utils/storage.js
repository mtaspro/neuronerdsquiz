// Local storage utilities with error handling and type safety

class StorageManager {
  constructor(prefix = 'neuronerds_') {
    this.prefix = prefix;
  }

  // Get item from localStorage with error handling
  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error getting item from localStorage: ${key}`, error);
      return defaultValue;
    }
  }

  // Set item in localStorage with error handling
  setItem(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting item in localStorage: ${key}`, error);
      return false;
    }
  }

  // Remove item from localStorage
  removeItem(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error(`Error removing item from localStorage: ${key}`, error);
      return false;
    }
  }

  // Clear all items with prefix
  clear() {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.prefix)
      );
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Error clearing localStorage', error);
      return false;
    }
  }

  // Check if localStorage is available
  isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Get all items with prefix
  getAllItems() {
    try {
      const items = {};
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.prefix)
      );
      
      keys.forEach(key => {
        const cleanKey = key.replace(this.prefix, '');
        items[cleanKey] = this.getItem(cleanKey);
      });
      
      return items;
    } catch (error) {
      console.error('Error getting all items from localStorage', error);
      return {};
    }
  }

  // Get storage size in bytes
  getStorageSize() {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith(this.prefix)) {
          total += localStorage[key].length + key.length;
        }
      }
      return total;
    } catch (error) {
      console.error('Error calculating storage size', error);
      return 0;
    }
  }
}

// Create default instance
const storage = new StorageManager();

// Specific storage utilities for the app
export const authStorage = {
  getToken: () => storage.getItem('authToken'),
  setToken: (token) => storage.setItem('authToken', token),
  removeToken: () => storage.removeItem('authToken'),
  
  getUser: () => storage.getItem('userData'),
  setUser: (user) => storage.setItem('userData', user),
  removeUser: () => storage.removeItem('userData'),
  
  clearAuth: () => {
    storage.removeItem('authToken');
    storage.removeItem('userData');
  },
  
  isAuthenticated: () => {
    const token = storage.getItem('authToken');
    const user = storage.getItem('userData');
    return !!(token && user);
  }
};

export const quizStorage = {
  getQuizProgress: (chapterId) => storage.getItem(`quiz_progress_${chapterId}`),
  setQuizProgress: (chapterId, progress) => storage.setItem(`quiz_progress_${chapterId}`, progress),
  removeQuizProgress: (chapterId) => storage.removeItem(`quiz_progress_${chapterId}`),
  
  getQuizResults: () => storage.getItem('quiz_results', []),
  addQuizResult: (result) => {
    const results = storage.getItem('quiz_results', []);
    results.push({
      ...result,
      timestamp: new Date().toISOString()
    });
    // Keep only last 50 results
    if (results.length > 50) {
      results.splice(0, results.length - 50);
    }
    storage.setItem('quiz_results', results);
  },
  
  clearQuizData: () => {
    const allItems = storage.getAllItems();
    Object.keys(allItems).forEach(key => {
      if (key.startsWith('quiz_')) {
        storage.removeItem(key);
      }
    });
  }
};

export const settingsStorage = {
  getDarkMode: () => storage.getItem('darkMode', false),
  setDarkMode: (isDark) => storage.setItem('darkMode', isDark),
  
  getNotificationSettings: () => storage.getItem('notificationSettings', {
    showSuccess: true,
    showError: true,
    showWarning: true,
    showInfo: true,
    duration: 5000
  }),
  setNotificationSettings: (settings) => storage.setItem('notificationSettings', settings),
  
  getQuizSettings: () => storage.getItem('quizSettings', {
    autoSubmit: true,
    showTimer: true,
    soundEnabled: false,
    fullscreenMode: false
  }),
  setQuizSettings: (settings) => storage.setItem('quizSettings', settings)
};

export const battleStorage = {
  getRecentRooms: () => storage.getItem('recent_battle_rooms', []),
  addRecentRoom: (roomId, roomName) => {
    const rooms = storage.getItem('recent_battle_rooms', []);
    const newRoom = { id: roomId, name: roomName, timestamp: Date.now() };
    
    // Remove if already exists
    const filtered = rooms.filter(room => room.id !== roomId);
    filtered.unshift(newRoom);
    
    // Keep only last 10 rooms
    if (filtered.length > 10) {
      filtered.splice(10);
    }
    
    storage.setItem('recent_battle_rooms', filtered);
  },
  
  removeRecentRoom: (roomId) => {
    const rooms = storage.getItem('recent_battle_rooms', []);
    const filtered = rooms.filter(room => room.id !== roomId);
    storage.setItem('recent_battle_rooms', filtered);
  },
  
  clearRecentRooms: () => storage.removeItem('recent_battle_rooms')
};

// Cache utilities
export const cacheStorage = {
  set: (key, data, ttl = 3600000) => { // Default 1 hour TTL
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    storage.setItem(`cache_${key}`, item);
  },
  
  get: (key) => {
    const item = storage.getItem(`cache_${key}`);
    if (!item) return null;
    
    const { data, timestamp, ttl } = item;
    const now = Date.now();
    
    if (now - timestamp > ttl) {
      storage.removeItem(`cache_${key}`);
      return null;
    }
    
    return data;
  },
  
  remove: (key) => storage.removeItem(`cache_${key}`),
  
  clear: () => {
    const allItems = storage.getAllItems();
    Object.keys(allItems).forEach(key => {
      if (key.startsWith('cache_')) {
        storage.removeItem(key);
      }
    });
  },
  
  // Clean expired cache items
  cleanup: () => {
    const allItems = storage.getAllItems();
    const now = Date.now();
    
    Object.keys(allItems).forEach(key => {
      if (key.startsWith('cache_')) {
        const item = allItems[key];
        if (item && item.timestamp && item.ttl) {
          if (now - item.timestamp > item.ttl) {
            storage.removeItem(key);
          }
        }
      }
    });
  }
};

// Initialize cache cleanup on app start
if (typeof window !== 'undefined') {
  cacheStorage.cleanup();
  
  // Clean cache every hour
  setInterval(() => {
    cacheStorage.cleanup();
  }, 3600000);
}

export default storage;