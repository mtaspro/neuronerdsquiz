import { useState, useCallback } from 'react';
import axios from 'axios';
import { authHeader } from '../utils/auth';
import { sanitizeObject } from '../utils/sanitizer';

export const useCRUD = (entityType, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const baseUrl = `${apiUrl}/api/admin/${entityType}`;
  
  // Generic API call with abort controller
  const apiCall = useCallback(async (method, url, data = null, signal = null) => {
    try {
      const config = {
        method,
        url: url.startsWith('http') ? url : `${baseUrl}${url}`,
        headers: authHeader(),
        ...(signal && { signal }),
        ...(data && { data: sanitizeObject(data) })
      };
      
      const response = await axios(config);
      return response.data;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request aborted');
        return null;
      }
      throw err;
    }
  }, [baseUrl]);

  // Create entity
  const create = useCallback(async (data, customUrl = '') => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    
    try {
      const result = await apiCall('POST', customUrl, data, controller.signal);
      if (options.onSuccess) options.onSuccess('create', result);
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.error || `Failed to create ${entityType}`;
      setError(errorMsg);
      if (options.onError) options.onError('create', errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, entityType, options]);

  // Read/Fetch entities
  const read = useCallback(async (id = '', customUrl = '') => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    
    try {
      const url = customUrl || (id ? `/${id}` : '');
      const result = await apiCall('GET', url, null, controller.signal);
      if (options.onSuccess) options.onSuccess('read', result);
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.error || `Failed to fetch ${entityType}`;
      setError(errorMsg);
      if (options.onError) options.onError('read', errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, entityType, options]);

  // Update entity
  const update = useCallback(async (id, data, customUrl = '') => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    
    try {
      const url = customUrl || `/${id}`;
      const result = await apiCall('PUT', url, data, controller.signal);
      if (options.onSuccess) options.onSuccess('update', result);
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.error || `Failed to update ${entityType}`;
      setError(errorMsg);
      if (options.onError) options.onError('update', errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, entityType, options]);

  // Delete entity
  const remove = useCallback(async (id, customUrl = '') => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    
    try {
      const url = customUrl || `/${id}`;
      const result = await apiCall('DELETE', url, null, controller.signal);
      if (options.onSuccess) options.onSuccess('delete', result);
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.error || `Failed to delete ${entityType}`;
      setError(errorMsg);
      if (options.onError) options.onError('delete', errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, entityType, options]);

  // Bulk operations
  const bulkCreate = useCallback(async (dataArray, customUrl = '/bulk') => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    
    try {
      const result = await apiCall('POST', customUrl, { [entityType]: dataArray }, controller.signal);
      if (options.onSuccess) options.onSuccess('bulkCreate', result);
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.error || `Failed to bulk create ${entityType}`;
      setError(errorMsg);
      if (options.onError) options.onError('bulkCreate', errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, entityType, options]);

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    loading,
    error,
    create,
    read,
    update,
    remove,
    bulkCreate,
    clearError,
    // Direct API call for custom operations
    apiCall
  };
};

export default useCRUD;