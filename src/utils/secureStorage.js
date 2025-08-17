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

  // Store user data (deprecated - now stored in MongoDB)
  setUserData(userData) {
    // Keep for backward compatibility but don't store
    console.log('User data now stored in MongoDB session');
  }

  // Get user data from server
  async getUserData() {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  // Clear all data
  clear() {
    localStorage.removeItem('sessionToken');
    // userData no longer stored in browser
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!this.getToken();
  }
}

export const secureStorage = new SecureStorage();