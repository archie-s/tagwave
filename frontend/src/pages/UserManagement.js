import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, deleteUser, updateUserRole } from '../services/userService';
import './UserManagement.css';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (userId === user._id) {
      setError("You cannot change your own role");
      return;
    }

    try {
      await updateUserRole(userId, newRole);
      setSuccessMessage('User role updated successfully');
      fetchUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === user._id) {
      setError("You cannot delete your own account");
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        setSuccessMessage('User deleted successfully');
        fetchUsers();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const usersList = Array.isArray(users) ? users : [];

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '2rem' }}>
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="container user-management">
      <div className="user-management-header">
        <h1>User Management</h1>
        <p>Manage user accounts and roles</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
          <button onClick={() => setSuccessMessage('')} className="alert-close">×</button>
        </div>
      )}

      <div className="user-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <label>Role:</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card">
          <h3>{usersList.length}</h3>
          <p>Total Users</p>
        </div>
        <div className="stat-card">
          <h3>{usersList.filter(u => u.role === 'admin').length}</h3>
          <p>Admins</p>
        </div>
        <div className="stat-card">
          <h3>{usersList.filter(u => u.role === 'staff').length}</h3>
          <p>Staff</p>
        </div>
        <div className="stat-card">
          <h3>{usersList.filter(u => u.role === 'user').length}</h3>
          <p>Users</p>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u._id}>
                  <td>
                    {u.name}
                    {u._id === user._id && <span className="badge-you">You</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      disabled={u._id === user._id}
                      className={`role-select role-${u.role}`}
                    >
                      <option value="user">User</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      disabled={u._id === user._id}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
