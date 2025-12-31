import { useState, useEffect } from 'react';
import { useSocket } from '../utils/socketManager';
import { secureStorage } from '../utils/secureStorage';
import axios from 'axios';

export const useMaintenance = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [countdownData, setCountdownData] = useState(null);
  const socket = useSocket('maintenance');

  useEffect(() => {
    // Check if user is SuperAdmin
    const checkSuperAdmin = async () => {
      try {
        const userData = await secureStorage.getUserData();
        setIsSuperAdmin(userData?.isSuperAdmin === true);
      } catch (error) {
        setIsSuperAdmin(false);
      }
    };
    
    checkSuperAdmin();

    // Check maintenance status on mount
    const checkMaintenanceStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/superadmin/maintenance/status`, {
          timeout: 10000
        });
        const { isActive, countdownStartTime, countdownDuration } = response.data;
        
        if (countdownStartTime) {
          const elapsed = Date.now() - countdownStartTime;
          if (elapsed < countdownDuration) {
            // Countdown still active
            setShowNotification(true);
            setCountdownData({ countdownStartTime, countdownDuration });
          } else if (isActive) {
            // Countdown finished, show maintenance
            setIsMaintenanceMode(true);
          }
        } else if (isActive) {
          setIsMaintenanceMode(true);
        }
      } catch (error) {
        // Only show maintenance if explicitly 503 Service Unavailable
        if (error.response?.status === 503) {
          console.log('Backend in maintenance mode');
          setIsMaintenanceMode(true);
        }
        // Ignore other errors (slow load, timeout, etc.)
      }
    };
    
    checkMaintenanceStatus();

    // Listen for maintenance mode events
    socket.addListener('maintenanceEnabled', (data) => {
      setShowNotification(true);
      setCountdownData(data);
    });

    socket.addListener('maintenanceActivated', () => {
      setShowNotification(false);
      setIsMaintenanceMode(true);
    });

    socket.addListener('maintenanceDisabled', () => {
      setIsMaintenanceMode(false);
      setShowNotification(false);
      setCountdownData(null);
    });

    // Connect socket
    socket.connect();

    return () => {
      socket.removeAllListeners();
    };
  }, [socket]);

  const handleNotificationComplete = () => {
    setShowNotification(false);
    setIsMaintenanceMode(true);
  };

  return {
    isMaintenanceMode: isMaintenanceMode && !isSuperAdmin,
    showNotification: showNotification && !isSuperAdmin,
    countdownData,
    handleNotificationComplete,
    isSuperAdmin
  };
};