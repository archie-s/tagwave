import api from './api';

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async () => {
  const response = await api.get('/users');
  return response.data?.data || [];
};

/**
 * Get single user
 */
export const getUser = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data?.data;
};

/**
 * Update user
 */
export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data?.data;
};

/**
 * Update user role (Admin only)
 */
export const updateUserRole = async (id, role) => {
  const response = await api.put(`/users/${id}`, { role });
  return response.data?.data;
};

/**
 * Delete user
 */
export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

/**
 * User service (default export for backwards compatibility)
 */
const userService = {
  getAllUsers,
  getUser,
  updateUser,
  updateUserRole,
  deleteUser,
};

export default userService;
