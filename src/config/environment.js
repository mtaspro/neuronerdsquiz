// Environment configuration for the application
// This ensures proper environment variable handling across different deployment platforms

const getEnvironmentConfig = () => {
  // Detect environment
  const isDevelopment = import.meta.env.MODE === 'development';
  const isProduction = import.meta.env.MODE === 'production';
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  // Determine API and Socket URLs
  let apiUrl, socketUrl;
  
  if (isProduction || (typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || 
       window.location.hostname.includes('netlify.app') ||
       window.location.hostname.includes('neuronerdsquiz')))) {
    // Production environment
    apiUrl = 'https://neuronerdsquiz.onrender.com';
    socketUrl = 'https://neuronerdsquiz.onrender.com';
  } else {
    // Development environment
    apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socketUrl = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:5000';
  }
  
  return {
    isDevelopment,
    isProduction,
    isLocalhost,
    apiUrl,
    socketUrl,
    mode: import.meta.env.MODE,
    // Environment variables for debugging
    env: {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_SOCKET_SERVER_URL: import.meta.env.VITE_SOCKET_SERVER_URL,
      MODE: import.meta.env.MODE
    }
  };
};

export default getEnvironmentConfig;