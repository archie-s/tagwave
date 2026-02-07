import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <img src="/tagwave_logo.jpeg" alt="TagWave Logo" className="brand-icon" />
          <span className="brand-text">TagWave</span>
        </Link>

        <button 
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className="navbar-link" onClick={closeMobileMenu}>Home</Link>
          <Link to="/about" className="navbar-link" onClick={closeMobileMenu}>About</Link>
          <Link to="/how-it-works" className="navbar-link" onClick={closeMobileMenu}>How It Works</Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="navbar-link" onClick={closeMobileMenu}>Dashboard</Link>
              {(user?.role === 'staff' || user?.role === 'admin') && (
                <Link to="/tags" className="navbar-link" onClick={closeMobileMenu}>Events</Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/users" className="navbar-link" onClick={closeMobileMenu}>Users</Link>
              )}
              <div className="navbar-user">
                <span className="user-name">{user?.name}</span>
                <button onClick={handleLogout} className="btn btn-sm btn-outline">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="navbar-auth-buttons">
              <Link to="/login" className="btn btn-sm btn-outline" onClick={closeMobileMenu}>Login</Link>
              <Link to="/register" className="btn btn-sm btn-primary" onClick={closeMobileMenu}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
