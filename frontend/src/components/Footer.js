import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>TagWave</h3>
            <p>Advanced NFC tag management and analytics platform</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/how-it-works">How It Works</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: info@tagwave.com</p>
            <p>Phone: +1 (555) 123-4567</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} TagWave. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
