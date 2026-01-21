import React from 'react';
import './HowItWorks.css';

const HowItWorks = () => {
  return (
    <div className="how-it-works-page">
      <div className="container">
        <section className="page-hero">
          <h1>How TagWave Works</h1>
          <p className="lead">
            A simple 4-step process to manage and analyze your NFC tags
          </p>
        </section>

        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h2>Program Your Tag</h2>
              <p>
                Log into your TagWave dashboard and create a new NFC tag. Assign
                a unique tag ID and set the destination URL where users will be
                redirected when they scan the tag.
              </p>
              <div className="step-details">
                <h4>What you can configure:</h4>
                <ul>
                  <li>Tag name and description</li>
                  <li>Destination URL</li>
                  <li>Tag location</li>
                  <li>Active/inactive status</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h2>Deploy Your Tag</h2>
              <p>
                Write the tag ID to your physical NFC tag using any standard NFC
                writing app. Place your NFC tags at strategic locations where
                your target audience can easily access them.
              </p>
              <div className="step-details">
                <h4>Best practices:</h4>
                <ul>
                  <li>Use high-quality NFC tags</li>
                  <li>Place tags at eye level when possible</li>
                  <li>Ensure tags are easily accessible</li>
                  <li>Add visual cues to encourage scanning</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h2>Users Tap the Tag</h2>
              <p>
                When someone taps their NFC-enabled smartphone on your tag, they
                are instantly redirected to your specified URL. The scan is
                automatically logged in the TagWave system.
              </p>
              <div className="step-details">
                <h4>What gets captured:</h4>
                <ul>
                  <li>Date and time of scan</li>
                  <li>Device type (mobile, tablet, desktop)</li>
                  <li>Browser and operating system</li>
                  <li>Geographic location (if available)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h2>View Analytics</h2>
              <p>
                Access your comprehensive dashboard to view real-time analytics
                and insights. Track total scans, unique users, scan patterns over
                time, and much more.
              </p>
              <div className="step-details">
                <h4>Analytics features:</h4>
                <ul>
                  <li>Total and unique scan counts</li>
                  <li>Time-series charts and trends</li>
                  <li>Device and browser breakdowns</li>
                  <li>Tag performance comparisons</li>
                  <li>Exportable reports</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <section className="technical-info">
          <h2>Technical Requirements</h2>
          <div className="tech-grid">
            <div className="tech-card">
              <h3>NFC Tags</h3>
              <p>
                Any NFC tag compatible with NFC Forum Type 1-4 standards. We
                recommend NTAG213 or NTAG216 chips for best performance.
              </p>
            </div>

            <div className="tech-card">
              <h3>User Devices</h3>
              <p>
                Users need an NFC-enabled smartphone (iPhone 7+ or Android devices
                with NFC). No app installation required.
              </p>
            </div>

            <div className="tech-card">
              <h3>Internet Connection</h3>
              <p>
                Both tag programming and scanning require an active internet
                connection for logging and redirection.
              </p>
            </div>
          </div>
        </section>

        <section className="cta">
          <h2>Ready to Get Started?</h2>
          <p>Create your account and start managing NFC tags today</p>
          <a href="/register" className="btn btn-primary btn-lg">
            Create Free Account
          </a>
        </section>
      </div>
    </div>
  );
};

export default HowItWorks;
