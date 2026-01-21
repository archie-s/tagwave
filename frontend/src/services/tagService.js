import api from './api';

/**
 * NFC Tag service
 */
const tagService = {
  // Get all tags
  getAllTags: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/tags?${params}`);
    return response.data;
  },

  // Get single tag
  getTag: async (id) => {
    const response = await api.get(`/tags/${id}`);
    return response.data;
  },

  // Get tag by tagId (for scanning)
  getTagByTagId: async (tagId) => {
    const response = await api.get(`/tags/scan/${tagId}`);
    return response.data;
  },

  // Create tag
  createTag: async (tagData) => {
    const response = await api.post('/tags', tagData);
    return response.data;
  },

  // Update tag
  updateTag: async (id, tagData) => {
    const response = await api.put(`/tags/${id}`, tagData);
    return response.data;
  },

  // Delete tag
  deleteTag: async (id) => {
    const response = await api.delete(`/tags/${id}`);
    return response.data;
  },

  // Get tag statistics
  getTagStats: async (id) => {
    const response = await api.get(`/tags/${id}/stats`);
    return response.data;
  },

  // Assign attendee to a tag
  assignAttendee: async (tagId, attendeeData) => {
    const response = await api.put(`/tags/${tagId}/assign-attendee`, attendeeData);
    return response.data;
  },

  // Bulk assign attendees to tags
  bulkAssignAttendees: async (assignments, groupId = '') => {
    const response = await api.post('/tags/bulk-assign', {
      assignments,
      groupId,
    });
    return response.data;
  },

  // Get tags by bulk group
  getTagsByGroup: async (groupId) => {
    const response = await api.get(`/tags/group/${groupId}`);
    return response.data;
  },
};

export default tagService;
