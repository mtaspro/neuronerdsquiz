import { useState, useEffect } from 'react';

export const useGlobalLoader = (initialLoading = true, minLoadingTime = 1500) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [startTime] = useState(Date.now());

  const setLoading = (loading) => {
    if (!loading) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadingTime - elapsed);
      
      setTimeout(() => {
        setIsLoading(false);
      }, remaining);
    } else {
      setIsLoading(true);
    }
  };

  return [isLoading, setLoading];
};