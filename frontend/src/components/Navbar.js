import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <img src="/tagwave_logo.jpeg" alt="TagWave Logo" className="brand-icon" />
          TagWave
        </Link>

        <div className="navbar-menu">
          <Link to="/" className="navbar-link">Home</Link>
          <Link to="/about" className="navbar-link">About</Link>
          <Link to="/how-it-works" className="navbar-link">How It Works</Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="navbar-link">Dashboard</Link>
              {(user?.role === 'staff' || user?.role === 'admin') && (
                <Link to="/tags" className="navbar-link">Manage Tags</Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/users" className="navbar-link">Users</Link>
              )}
              <div className="navbar-user">
                <span className="user-name">{user?.name}</span>
                <button onClick={handleLogout} className="btn btn-sm btn-outline">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-outline">Login</Link>
              <Link to="/register" className="btn btn-sm btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
