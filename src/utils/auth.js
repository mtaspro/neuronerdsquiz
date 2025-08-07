// Auth utility function
export function authHeader() {
  const token = localStorage.getItem('authToken');
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  
  console.log('AdminDashboard - Token from localStorage:', token ? 'Present' : 'Missing');
  console.log('AdminDashboard - User Data:', userData);
  console.log('AdminDashboard - Is Admin:', userData.isAdmin);
  
  if (token) {
    console.log('AdminDashboard - Token length:', token.length);
    try {
      // Log the token parts (without revealing the signature)
      const [header, payload] = token.split('.');
      console.log('AdminDashboard - Token header:', atob(header));
      console.log('AdminDashboard - Token payload:', atob(payload));
    } catch (e) {
      console.error('AdminDashboard - Invalid token format');
    }
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}