// Secure storage for MongoDB-based sessions
class SecureStorage {
  // Store session token
  setToken(token) {
    localStorage.setItem('sessionToken', token);
  }

  // Get session token
  getToken() {
    return localStorage.getItem('sessionToken');
  }

  // Store user data
  setUserData(userData) {
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  // Get user data
  getUserData() {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  }

  // Clear all data
  clear() {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userData');
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!this.getToken();
  }
}

export const secureStorage = new SecureStorage();