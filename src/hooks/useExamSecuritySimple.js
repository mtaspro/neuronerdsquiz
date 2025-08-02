import { useState, useCallback } from 'react';

const useExamSecuritySimple = ({
  isActive = false,
  onSecurityViolation = () => {},
  onAutoSubmit = () => {},
  maxWarnings = 3,
}) => {
  const [warnings, setWarnings] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [securityStatus, setSecurityStatus] = useState('inactive');

  // Simple initialization that always succeeds
  const initializeSecurity = useCallback(async () => {
    if (!isActive) return false;
    setSecurityStatus('active');
    return true;
  }, [isActive]);

  // Simple cleanup
  const cleanupSecurity = useCallback(async () => {
    setSecurityStatus('inactive');
  }, []);

  // Simple fullscreen enter (no-op for now)
  const enterFullscreen = useCallback(async () => {
    return true;
  }, []);

  // Simple fullscreen exit (no-op for now)
  const exitFullscreen = useCallback(async () => {
    return true;
  }, []);

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

export default useExamSecuritySimple;