// Simple session storage for MongoDB-based sessions
class SecureStorage {
  // Store session token
  setToken(token) {
    sessionStorage.setItem('sessionToken', token);
  }

  // Get session token
  getToken() {
    return sessionStorage.getItem('sessionToken');
  }

  // Store user data
  setUserData(userData) {
    sessionStorage.setItem('userData', JSON.stringify(userData));
  }

  // Get user data
  getUserData() {
    const data = sessionStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  }

  // Clear all data
  clear() {
    sessionStorage.removeItem('sessionToken');
    sessionStorage.removeItem('userData');
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!this.getToken();
  }
}

export const secureStorage = new SecureStorage();