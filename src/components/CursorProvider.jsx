import React, { useEffect } from 'react';
import '../styles/custom-cursors.css';

/**
 * CursorProvider Component
 * Initializes custom cursors and provides context for cursor management
 */
const CursorProvider = ({ children }) => {
  useEffect(() => {
    // Test APNG support and apply cursors
    const testAPNGSupport = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        // APNG supported, cursors will work
        document.body.classList.add('apng-supported');
      };
      
      img.onerror = () => {
        // APNG not supported, fallback to standard cursors
        document.body.classList.add('apng-not-supported');
      };
      
      // Test with a small APNG data URL
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    };

    testAPNGSupport();

    // Auto-apply cursor classes to common elements
    const applyAutoCursors = () => {
      // Links and buttons
      document.querySelectorAll('a, button, [role="button"]').forEach(el => {
        if (!el.classList.contains('cursor-')) {
          el.classList.add('cursor-link');
        }
      });

      // Text inputs
      document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea').forEach(el => {
        if (!el.classList.contains('cursor-')) {
          el.classList.add('cursor-text');
        }
      });

      // Help elements
      document.querySelectorAll('[title]').forEach(el => {
        if (!el.classList.contains('cursor-')) {
          el.classList.add('cursor-help');
        }
      });

      // Disabled elements
      document.querySelectorAll('[disabled], .disabled').forEach(el => {
        if (!el.classList.contains('cursor-')) {
          el.classList.add('cursor-not-allowed');
        }
      });
    };

    // Apply on mount and when DOM changes
    applyAutoCursors();
    
    const observer = new MutationObserver(applyAutoCursors);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
};

export default CursorProvider;