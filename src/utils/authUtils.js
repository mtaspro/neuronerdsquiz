import axios from 'axios';

// Authentication utility functions
export const authUtils = {
  // Validate token with backend
  async validateToken() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return { valid: false, error: 'No token found' };
      }

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${apiUrl}/api/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      console.error('Token validation failed:', error);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return { 
        valid: false, 
        error: 'Network error during validation',
        networkError: true 
      };
    }
  },

  // Clear authentication data
  clearAuth() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.dispatchEvent(new Event('userAuthChange'));
  },

  // Check if user is authenticated (with backend validation)
  async isAuthenticated() {
    const validation = await this.validateToken();
    
    if (!validation.valid) {
      // Clear invalid auth data
      this.clearAuth();
      return false;
    }
    
    // Update user data if validation successful
    if (validation.user) {
      localStorage.setItem('userData', JSON.stringify(validation.user));
    }
    
    return true;
  },

  // Get current user data (with validation)
  async getCurrentUser() {
    const validation = await this.validateToken();
    
    if (!validation.valid) {
      this.clearAuth();
      return null;
    }
    
    return validation.user;
  },

  // Check if user is admin (with validation)
  async isAdmin() {
    const user = await this.getCurrentUser();
    return user?.isAdmin === true;
  },

  // Login with credentials
  async login(email, password) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password
      });

      const { token, user } = response.data;
      
      // Store auth data
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(user));
      window.dispatchEvent(new Event('userAuthChange'));
      
      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  },

  // Register new user
  async register(userData) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(`${apiUrl}/api/auth/register`, userData);

      const { token, user } = response.data;
      
      // Store auth data
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(user));
      window.dispatchEvent(new Event('userAuthChange'));
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  },

  // Logout
  logout() {
    this.clearAuth();
    // Redirect to login page
    window.location.href = '/login';
  }
};

// Hook for React components
export const useAuth = () => {
  return authUtils;
};