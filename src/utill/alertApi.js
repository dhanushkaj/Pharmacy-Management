import { api } from './api';

/**
 * Get alert summary for dashboard
 */
export const getAlertSummary = async (token) => {
  return await api('/api/alerts/summary', {
    method: 'GET',
    token
  });
};

/**
 * Get paginated alerts with filters
 */
export const getAlerts = async (filters, token, page = 0, size = 20) => {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.severity) params.append('severity', filters.severity);
  if (filters.alertType) params.append('alertType', filters.alertType);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  params.append('page', page);
  params.append('size', size);
  
  return await api(`/api/alerts?${params.toString()}`, {
    method: 'GET',
    token
  });
};

/**
 * Acknowledge a single alert
 */
export const acknowledgeAlert = async (alertLogId, token) => {
  return await api(`/api/alerts/${alertLogId}/acknowledge`, {
    method: 'PUT',
    token
  });
};

/**
 * Acknowledge multiple alerts
 */
export const acknowledgeMultipleAlerts = async (alertIds, token) => {
  return await api('/api/alerts/acknowledge-multiple', {
    method: 'PUT',
    body: alertIds,
    token
  });
};

/**
 * Manually trigger alert generation (Admin only)
 */
export const generateAlerts = async (token) => {
  return await api('/api/alerts/generate', {
    method: 'POST',
    token
  });
};

// ============= Alert Configuration APIs =============

/**
 * Get all alert configurations (Admin only)
 */
export const getAlertConfigurations = async (token) => {
  return await api('/api/alerts/config', {
    method: 'GET',
    token
  });
};

/**
 * Get a specific alert configuration (Admin only)
 */
export const getAlertConfiguration = async (configId, token) => {
  return await api(`/api/alerts/config/${configId}`, {
    method: 'GET',
    token
  });
};

/**
 * Create new alert configuration (Admin only)
 */
export const createAlertConfiguration = async (configData, token) => {
  return await api('/api/alerts/config', {
    method: 'POST',
    body: configData,
    token
  });
};

/**
 * Update alert configuration (Admin only)
 */
export const updateAlertConfiguration = async (configId, configData, token) => {
  return await api(`/api/alerts/config/${configId}`, {
    method: 'PUT',
    body: configData,
    token
  });
};

/**
 * Delete alert configuration (Admin only)
 */
export const deleteAlertConfiguration = async (configId, token) => {
  return await api(`/api/alerts/config/${configId}`, {
    method: 'DELETE',
    token
  });
};

/**
 * Initialize default alert configurations (Admin only)
 */
export const initializeDefaultConfigurations = async (token) => {
  return await api('/api/alerts/config/initialize-defaults', {
    method: 'POST',
    token
  });
};
