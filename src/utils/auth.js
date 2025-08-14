import { secureStorage } from './secureStorage.js';

// Auth utility function
export function authHeader() {
  const token = secureStorage.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}