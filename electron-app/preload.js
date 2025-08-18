/**
 * Preload script for Electron security
 * This script runs in the renderer process before the web content loads
 * It provides a secure bridge between the main process and renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getAppVersion: () => {
    return process.env.npm_package_version || '1.0.0';
  },
  
  // Platform information
  getPlatform: () => {
    return process.platform;
  },
  
  // Check if running in Electron
  isElectron: () => {
    return true;
  },
  
  // Window controls (if needed by PWA)
  minimizeWindow: () => {
    ipcRenderer.invoke('minimize-window');
  },
  
  maximizeWindow: () => {
    ipcRenderer.invoke('maximize-window');
  },
  
  closeWindow: () => {
    ipcRenderer.invoke('close-window');
  },
  
  // Notification support
  showNotification: (title, body) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  },
  
  // Storage helpers (if PWA needs local storage info)
  getStorageInfo: () => {
    return {
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined'
    };
  }
});

// Console log for debugging (remove in production)
console.log('Preload script loaded successfully');

// Enhance PWA experience
window.addEventListener('DOMContentLoaded', () => {
  // Add Electron-specific class to body for PWA styling
  document.body.classList.add('electron-app');
  
  // Disable drag and drop for security
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => e.preventDefault());
  
  // Disable right-click context menu (optional)
  // document.addEventListener('contextmenu', (e) => e.preventDefault());
  
  // Handle keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Disable F12 (DevTools) in production
    if (e.key === 'F12') {
      e.preventDefault();
    }
    
    // Disable Ctrl+Shift+I (DevTools) in production
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
    }
    
    // Disable Ctrl+U (View Source) in production
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
    }
  });
});

// PWA Service Worker registration helper
window.addEventListener('load', () => {
  // Check if service worker is supported and register it
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  }
});