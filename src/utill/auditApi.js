// Audit-related API functions
import { api } from './api';

/**
 * Fetch audit logs with filtering options
 * @param {Object} filters - Filtering options
 * @param {string} filters.entityType - Filter by entity type (Product, Customer, etc.)
 * @param {number} filters.entityId - Filter by specific entity ID
 * @param {string} filters.actionBy - Filter by user who performed action
 * @param {string} filters.action - Filter by action type (CREATE, UPDATE, DELETE, etc.)
 * @param {string} filters.startDate - Filter from date (ISO string)
 * @param {string} filters.endDate - Filter to date (ISO string)
 * @param {number} filters.page - Page number (0-based)
 * @param {number} filters.size - Page size
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Paginated audit logs
 */
export const getAuditLogs = async (filters = {}, token) => {
  const queryParams = new URLSearchParams();
  
  // Add non-empty filters to query params
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      // Convert date strings to proper DateTime format for backend
      if (key === 'startDate' && value) {
        // Convert YYYY-MM-DD to YYYY-MM-DDTHH:MM:SS (start of day)
        try {
          const startDateTime = new Date(value + 'T00:00:00');
          // Format as YYYY-MM-DDTHH:MM:SS (without timezone)
          const formattedStart = startDateTime.getFullYear() + '-' +
            String(startDateTime.getMonth() + 1).padStart(2, '0') + '-' +
            String(startDateTime.getDate()).padStart(2, '0') + 'T' +
            String(startDateTime.getHours()).padStart(2, '0') + ':' +
            String(startDateTime.getMinutes()).padStart(2, '0') + ':' +
            String(startDateTime.getSeconds()).padStart(2, '0');
          queryParams.append(key, formattedStart);
        } catch (e) {
          console.error('Error formatting start date:', e);
          queryParams.append(key, value);
        }
      } else if (key === 'endDate' && value) {
        // Convert YYYY-MM-DD to YYYY-MM-DDTHH:MM:SS (end of day)
        try {
          const endDateTime = new Date(value + 'T23:59:59');
          // Format as YYYY-MM-DDTHH:MM:SS (without timezone)
          const formattedEnd = endDateTime.getFullYear() + '-' +
            String(endDateTime.getMonth() + 1).padStart(2, '0') + '-' +
            String(endDateTime.getDate()).padStart(2, '0') + 'T' +
            String(endDateTime.getHours()).padStart(2, '0') + ':' +
            String(endDateTime.getMinutes()).padStart(2, '0') + ':' +
            String(endDateTime.getSeconds()).padStart(2, '0');
          queryParams.append(key, formattedEnd);
        } catch (e) {
          console.error('Error formatting end date:', e);
          queryParams.append(key, value);
        }
      } else {
        queryParams.append(key, value);
      }
    }
  });
  
  const queryString = queryParams.toString();
  
  // Use search endpoint if filters are provided, otherwise use base endpoint
  const hasFilters = Object.values(filters).some(v => v !== null && v !== undefined && v !== '');
  const endpoint = hasFilters 
    ? `/api/audit/search${queryString ? `?${queryString}` : ''}`
    : `/api/audit${queryString ? `?${queryString}` : ''}`;
  
  return api(endpoint, { token });
};

/**
 * Get audit history for a specific entity
 * @param {string} entityType - Type of entity (Product, Customer, etc.)
 * @param {number} entityId - ID of the entity
 * @param {string} token - JWT token
 * @returns {Promise<Array>} Array of audit logs for the entity
 */
export const getEntityHistory = async (entityType, entityId, token) => {
  return api(`/api/audit/entity/${entityType}/${entityId}`, { token });
};

/**
 * Get user activity summary
 * @param {string} username - Username (optional)
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @param {string} token - JWT token
 * @returns {Promise<Array>} User activity data
 */
export const getUserActivity = async (username, startDate, endDate, token) => {
  const queryParams = new URLSearchParams();
  if (username) queryParams.append('username', username);
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  
  const queryString = queryParams.toString();
  const endpoint = `/api/audit/user-activity${queryString ? `?${queryString}` : ''}`;
  
  return api(endpoint, { token });
};

/**
 * Get audit statistics/summary
 * @param {string} period - Time period (today, week, month, year)
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Audit statistics
 */
export const getAuditStats = async (period = 'week', token) => {
  return api(`/api/audit/stats?period=${period}`, { token });
};

/**
 * Export audit logs to CSV
 * @param {Object} filters - Same filters as getAuditLogs
 * @param {string} token - JWT token
 * @returns {Promise<Blob>} CSV file as blob
 */
export const exportAuditLogs = async (filters = {}, token) => {
  const queryParams = new URLSearchParams();
  
  // Add non-empty filters to query params with same date formatting as getAuditLogs
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      // Convert date strings to proper DateTime format for backend (same as getAuditLogs)
      if (key === 'startDate' && value) {
        try {
          const startDateTime = new Date(value + 'T00:00:00');
          const formattedStart = startDateTime.getFullYear() + '-' +
            String(startDateTime.getMonth() + 1).padStart(2, '0') + '-' +
            String(startDateTime.getDate()).padStart(2, '0') + 'T' +
            String(startDateTime.getHours()).padStart(2, '0') + ':' +
            String(startDateTime.getMinutes()).padStart(2, '0') + ':' +
            String(startDateTime.getSeconds()).padStart(2, '0');
          queryParams.append(key, formattedStart);
        } catch (e) {
          console.error('Error formatting start date for export:', e);
          queryParams.append(key, value);
        }
      } else if (key === 'endDate' && value) {
        try {
          const endDateTime = new Date(value + 'T23:59:59');
          const formattedEnd = endDateTime.getFullYear() + '-' +
            String(endDateTime.getMonth() + 1).padStart(2, '0') + '-' +
            String(endDateTime.getDate()).padStart(2, '0') + 'T' +
            String(endDateTime.getHours()).padStart(2, '0') + ':' +
            String(endDateTime.getMinutes()).padStart(2, '0') + ':' +
            String(endDateTime.getSeconds()).padStart(2, '0');
          queryParams.append(key, formattedEnd);
        } catch (e) {
          console.error('Error formatting end date for export:', e);
          queryParams.append(key, value);
        }
      } else {
        queryParams.append(key, value);
      }
    }
  });
  
  const queryString = queryParams.toString();
  const endpoint = `/api/audit/export${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:8080'}${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/csv, application/octet-stream',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to export audit logs: ${response.status} - ${errorText}`);
  }
  
  return response.blob();
};