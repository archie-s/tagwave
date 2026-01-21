import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Manage Your NFC Tags with <span className="highlight">TagWave</span>
            </h1>
            <p className="hero-subtitle">
              Track, analyze, and optimize your NFC tag campaigns with powerful
              analytics and real-time insights
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started Free
              </Link>
              <Link to="/how-it-works" className="btn btn-outline btn-lg">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose TagWave?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Real-Time Analytics</h3>
              <p>
                Track every scan with detailed analytics including device type,
                location, and time-based trends
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏷️</div>
              <h3>Easy Tag Management</h3>
              <p>
                Create, update, and manage all your NFC tags from a single
                intuitive dashboard
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Reliable</h3>
              <p>
                Enterprise-grade security with role-based access control and
                data encryption
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Actionable Insights</h3>
              <p>
                Make data-driven decisions with comprehensive reports and
                visual analytics
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast & Efficient</h3>
              <p>
                Lightning-fast scan processing and instant data updates for
                real-time monitoring
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Multi-User Support</h3>
              <p>
                Collaborate with your team using role-based permissions and
                shared access
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>
              Join thousands of businesses using TagWave to manage their NFC
              tag campaigns
            </p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Your Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
