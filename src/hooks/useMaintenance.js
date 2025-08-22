import { useState, useEffect } from 'react';
import { useSocket } from '../utils/socketManager';
import { secureStorage } from '../utils/secureStorage';

export const useMaintenance = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
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

    // Listen for maintenance mode events
    socket.addListener('maintenanceEnabled', () => {
      setShowNotification(true);
    });

    socket.addListener('maintenanceActivated', () => {
      setShowNotification(false);
      setIsMaintenanceMode(true);
    });

    socket.addListener('maintenanceDisabled', () => {
      setIsMaintenanceMode(false);
      setShowNotification(false);
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
    isMaintenanceMode: isMaintenanceMode && !isSuperAdmin, // SuperAdmin bypasses maintenance
    showNotification: showNotification && !isSuperAdmin, // SuperAdmin doesn't see notifications
    handleNotificationComplete,
    isSuperAdmin
  };
};