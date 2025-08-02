import { useEffect, useRef, useState, useCallback } from 'react';

const useExamSecurity = ({
  isActive = false,
  onSecurityViolation = () => {},
  onAutoSubmit = () => {},
  maxWarnings = 3,
  enableFullscreen = true,
  enableTabSwitchDetection = true,
  enableRightClickBlock = true,
  enableDevToolsBlock = true,
  enableExitConfirmation = true
}) => {
  const [warnings, setWarnings] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [securityStatus, setSecurityStatus] = useState('inactive');
  const warningsRef = useRef(0);
  const isActiveRef = useRef(false);

  // Update refs when props change
  useEffect(() => {
    isActiveRef.current = isActive;
    warningsRef.current = warnings;
  }, [isActive, warnings]);

  // Check if currently in fullscreen (define first to avoid circular dependency)
  const checkFullscreen = useCallback(() => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement ||
      document.mozFullScreenElement
    );
  }, []);

  // Handle security violation (define early to avoid circular dependency)
  const handleViolation = useCallback((type, details = '') => {
    if (!isActiveRef.current) return;

    const newWarnings = warningsRef.current + 1;
    setWarnings(newWarnings);
    warningsRef.current = newWarnings;

    const violationData = {
      type,
      details,
      warnings: newWarnings,
      maxWarnings,
      timestamp: new Date().toISOString()
    };

    onSecurityViolation(violationData);

    if (newWarnings >= maxWarnings) {
      setSecurityStatus('violated');
      onAutoSubmit({
        reason: 'Security violations exceeded',
        totalViolations: newWarnings,
        lastViolationType: type
      });
    }
  }, [maxWarnings, onSecurityViolation, onAutoSubmit]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      }
    } catch (error) {
      console.warn('Exit fullscreen failed:', error);
    }
  }, []);

  // Fullscreen management with multiple attempts
  const enterFullscreen = useCallback(async () => {
    if (!enableFullscreen) {
      console.log('🖥️ Fullscreen disabled, skipping');
      return true;
    }
    
    // Check if fullscreen is supported
    const element = document.documentElement;
    const isFullscreenSupported = !!(
      element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.msRequestFullscreen ||
      element.mozRequestFullScreen
    );

    if (!isFullscreenSupported) {
      console.warn('⚠️ Fullscreen API not supported in this browser');
      return true; // Don't fail, just continue without fullscreen
    }

    // Check if already in fullscreen
    if (checkFullscreen()) {
      console.log('✅ Already in fullscreen mode');
      return true;
    }

    try {
      console.log('🖥️ Requesting fullscreen...');
      console.log('🔍 Browser info:', {
        userAgent: navigator.userAgent,
        protocol: window.location.protocol,
        isSecureContext: window.isSecureContext
      });
      
      // Try different fullscreen methods with options
      if (element.requestFullscreen) {
        console.log('🖥️ Using standard requestFullscreen');
        await element.requestFullscreen({ navigationUI: "hide" });
      } else if (element.webkitRequestFullscreen) {
        console.log('🖥️ Using webkit requestFullscreen');
        await element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      } else if (element.msRequestFullscreen) {
        console.log('🖥️ Using ms requestFullscreen');
        await element.msRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        console.log('🖥️ Using moz requestFullScreen');
        await element.mozRequestFullScreen();
      }
      
      // Wait a bit and check if fullscreen actually worked
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (checkFullscreen()) {
        console.log('✅ Fullscreen activated successfully');
        return true;
      } else {
        console.warn('⚠️ Fullscreen request appeared to succeed but not actually in fullscreen');
        return true; // Still don't fail the security system
      }
      
    } catch (error) {
      console.warn('⚠️ Fullscreen request failed:', error);
      console.warn('⚠️ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Common reasons for fullscreen failure:
      if (error.name === 'NotAllowedError') {
        console.warn('⚠️ Fullscreen blocked by browser policy or user settings');
        console.warn('💡 Possible solutions: Enable fullscreen in browser settings, use HTTPS, or try a different browser');
      } else if (error.name === 'TypeError') {
        console.warn('⚠️ Fullscreen API not available or not supported');
      } else if (error.name === 'InvalidStateError') {
        console.warn('⚠️ Document not in a state where fullscreen can be requested');
      }
      
      return true; // Don't fail the security system, just continue without fullscreen
    }
  }, [enableFullscreen, checkFullscreen]);

  // Fullscreen change handler
  const handleFullscreenChange = useCallback(() => {
    const isCurrentlyFullscreen = checkFullscreen();
    setIsFullscreen(isCurrentlyFullscreen);

    if (isActiveRef.current && enableFullscreen && !isCurrentlyFullscreen) {
      handleViolation('fullscreen_exit', 'User exited fullscreen mode');
    }
  }, [checkFullscreen, enableFullscreen, handleViolation]);

  // Tab switch / visibility change handler
  const handleVisibilityChange = useCallback(() => {
    if (!enableTabSwitchDetection || !isActiveRef.current) return;

    if (document.hidden || document.visibilityState === 'hidden') {
      handleViolation('tab_switch', 'User switched tabs or minimized window');
    }
  }, [enableTabSwitchDetection, handleViolation]);

  // Window blur handler (backup for tab switching)
  const handleWindowBlur = useCallback(() => {
    if (!enableTabSwitchDetection || !isActiveRef.current) return;
    
    // Small delay to avoid false positives from fullscreen transitions
    setTimeout(() => {
      if (!document.hasFocus() && isActiveRef.current) {
        handleViolation('window_blur', 'Window lost focus');
      }
    }, 100);
  }, [enableTabSwitchDetection, handleViolation]);

  // Right-click prevention
  const handleContextMenu = useCallback((e) => {
    if (enableRightClickBlock && isActiveRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, [enableRightClickBlock]);

  // Keyboard shortcuts prevention
  const handleKeyDown = useCallback((e) => {
    if (!enableDevToolsBlock || !isActiveRef.current) return;

    // Block common developer tools shortcuts
    const blockedKeys = [
      { key: 'F12' },
      { key: 'I', ctrlKey: true, shiftKey: true }, // Ctrl+Shift+I
      { key: 'J', ctrlKey: true, shiftKey: true }, // Ctrl+Shift+J
      { key: 'C', ctrlKey: true, shiftKey: true }, // Ctrl+Shift+C
      { key: 'U', ctrlKey: true }, // Ctrl+U (view source)
      { key: 'S', ctrlKey: true }, // Ctrl+S (save page)
      { key: 'A', ctrlKey: true }, // Ctrl+A (select all)
      { key: 'P', ctrlKey: true }, // Ctrl+P (print)
      { key: 'F', ctrlKey: true }, // Ctrl+F (find)
      { key: 'R', ctrlKey: true }, // Ctrl+R (refresh)
      { key: 'F5' }, // F5 (refresh)
    ];

    const isBlocked = blockedKeys.some(blocked => {
      return blocked.key === e.key &&
             (blocked.ctrlKey === undefined || blocked.ctrlKey === e.ctrlKey) &&
             (blocked.shiftKey === undefined || blocked.shiftKey === e.shiftKey) &&
             (blocked.altKey === undefined || blocked.altKey === e.altKey);
    });

    if (isBlocked) {
      e.preventDefault();
      e.stopPropagation();
      handleViolation('blocked_shortcut', `Attempted to use ${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`);
      return false;
    }
  }, [enableDevToolsBlock, handleViolation]);

  // Page unload confirmation
  const handleBeforeUnload = useCallback((e) => {
    if (enableExitConfirmation && isActiveRef.current) {
      const message = 'Are you sure you want to leave? This will end your quiz and your progress will be lost.';
      e.preventDefault();
      e.returnValue = message;
      return message;
    }
  }, [enableExitConfirmation]);

  // Initialize security system
  const initializeSecurity = useCallback(async () => {
    if (!isActive) {
      console.warn('Security system not active, skipping initialization');
      return false;
    }

    console.log('🔒 Initializing security system...');
    setSecurityStatus('initializing');
    setWarnings(0);
    warningsRef.current = 0;

    // Request fullscreen if enabled (but don't fail if it doesn't work)
    if (enableFullscreen) {
      console.log('🖥️ Attempting to enter fullscreen mode...');
      try {
        const fullscreenSuccess = await enterFullscreen();
        if (fullscreenSuccess) {
          console.log('✅ Fullscreen mode activated successfully');
        } else {
          console.warn('⚠️ Fullscreen mode failed, but continuing with security system');
        }
      } catch (error) {
        console.warn('⚠️ Fullscreen error, but continuing with security system:', error);
      }
    }

    setSecurityStatus('active');
    console.log('✅ Security system initialized successfully');
    return true; // Always return true - security system should work even without fullscreen
  }, [isActive, enableFullscreen, enterFullscreen]);

  // Cleanup security system
  const cleanupSecurity = useCallback(async () => {
    setSecurityStatus('inactive');
    
    if (enableFullscreen && checkFullscreen()) {
      await exitFullscreen();
    }
  }, [enableFullscreen, checkFullscreen, exitFullscreen]);

  // Setup event listeners
  useEffect(() => {
    if (!isActive) return;

    // Fullscreen events
    if (enableFullscreen) {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('msfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    }

    // Tab switch detection
    if (enableTabSwitchDetection) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);
    }

    // Right-click prevention
    if (enableRightClickBlock) {
      document.addEventListener('contextmenu', handleContextMenu);
    }

    // Keyboard shortcuts prevention
    if (enableDevToolsBlock) {
      document.addEventListener('keydown', handleKeyDown);
    }

    // Page unload confirmation
    if (enableExitConfirmation) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      // Cleanup event listeners
      if (enableFullscreen) {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      }

      if (enableTabSwitchDetection) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
      }

      if (enableRightClickBlock) {
        document.removeEventListener('contextmenu', handleContextMenu);
      }

      if (enableDevToolsBlock) {
        document.removeEventListener('keydown', handleKeyDown);
      }

      if (enableExitConfirmation) {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };
  }, [
    isActive,
    enableFullscreen,
    enableTabSwitchDetection,
    enableRightClickBlock,
    enableDevToolsBlock,
    enableExitConfirmation,
    handleFullscreenChange,
    handleVisibilityChange,
    handleWindowBlur,
    handleContextMenu,
    handleKeyDown,
    handleBeforeUnload
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        cleanupSecurity();
      }
    };
  }, [cleanupSecurity]);

  return {
    warnings,
    maxWarnings,
    isFullscreen,
    securityStatus,
    initializeSecurity,
    cleanupSecurity,
    enterFullscreen,
    exitFullscreen,
    remainingWarnings: Math.max(0, maxWarnings - warnings)
  };
};

export default useExamSecurity;