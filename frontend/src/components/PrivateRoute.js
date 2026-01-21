import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (roles && !hasRole(roles)) {
    return (
      <div className="container" style={{ marginTop: '2rem' }}>
        <div className="alert alert-error">
          <h3>Access Denied</h3>
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
