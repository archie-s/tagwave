import api from './api';

/**
 * Scan service
 */
const scanService = {
  // Log a scan
  logScan: async (tagId) => {
    const response = await api.post('/scans', { tagId });
    return response.data;
  },

  // Get all scans
  getAllScans: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/scans?${params}`);
    return response.data;
  },

  // Get analytics
  getAnalytics: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/scans/analytics?${params}`);
    return response.data;
  },

  // Get statistics
  getStats: async () => {
    const response = await api.get('/scans/stats');
    return response.data;
  },
};

export default scanService;
