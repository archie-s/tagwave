import api from './api';

const eventService = {
  // Get all events
  getAllEvents: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/events?${params.toString()}`);
    return response.data;
  },

  // Get single event
  getEvent: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  // Create event
  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  // Update event
  updateEvent: async (id, eventData) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  // Delete event
  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  // Get tags for an event
  getEventTags: async (eventId) => {
    const response = await api.get(`/events/${eventId}/tags`);
    return response.data;
  },

  // Bulk create tags for an event
  bulkCreateTags: async (eventId, tags) => {
    const response = await api.post(`/events/${eventId}/tags/bulk`, { tags });
    return response.data;
  },

  // Get event statistics
  getEventStats: async (eventId) => {
    const response = await api.get(`/events/${eventId}/stats`);
    return response.data;
  },
};

export default eventService;
