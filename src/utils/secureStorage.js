// Secure storage utility to mitigate XSS risks
class SecureStorage {
  constructor() {
    this.memoryStorage = new Map();
  }

  // Store token in memory (more secure than localStorage)
  setToken(token) {
    this.memoryStorage.set('authToken', token);
    // Also set a flag in localStorage to track login state (without sensitive data)
    localStorage.setItem('isLoggedIn', 'true');
  }

  // Get token from memory
  getToken() {
    return this.memoryStorage.get('authToken');
  }

  // Store user data (non-sensitive parts only in localStorage)
  setUserData(userData) {
    // Store non-sensitive data in localStorage
    const safeUserData = {
      id: userData.id,
      username: userData.username,
      isAdmin: userData.isAdmin,
      isSuperAdmin: userData.isSuperAdmin
    };
    localStorage.setItem('userData', JSON.stringify(safeUserData));
    
    // Store full data in memory
    this.memoryStorage.set('fullUserData', userData);
  }

  // Get user data
  getUserData() {
    return this.memoryStorage.get('fullUserData') || 
           JSON.parse(localStorage.getItem('userData') || 'null');
  }

  // Clear all auth data
  clear() {
    this.memoryStorage.clear();
    localStorage.removeItem('authToken'); // Remove any legacy tokens
    localStorage.removeItem('userData');
    localStorage.removeItem('isLoggedIn');
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.memoryStorage.has('authToken') || localStorage.getItem('isLoggedIn') === 'true';
  }
}

export const secureStorage = new SecureStorage();