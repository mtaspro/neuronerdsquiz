import { useContext } from 'react';
import { NotificationContext } from '../components/NotificationSystem';

export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    // Fallback if NotificationContext is not available
    return {
      showNotification: (config) => {
        console.log('Notification:', config);
      }
    };
  }
  
  return context;
};
