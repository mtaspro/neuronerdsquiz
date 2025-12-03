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
          timeout: 5000
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
        // If backend is unreachable (suspended), show maintenance
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
          console.log('Backend unreachable - showing maintenance mode');
          setIsMaintenanceMode(true);
        }
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