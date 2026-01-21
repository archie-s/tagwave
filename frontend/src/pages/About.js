import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="container">
        <section className="about-hero">
          <h1>About TagWave</h1>
          <p className="lead">
            Empowering businesses with intelligent NFC tag management and analytics
          </p>
        </section>

        <section className="about-section">
          <h2>What is TagWave?</h2>
          <p>
            TagWave is a comprehensive NFC tag management platform that enables
            businesses to create, deploy, and analyze NFC tag campaigns with ease.
            Our platform provides real-time analytics, detailed insights, and
            powerful tools to help you understand how users interact with your
            NFC tags.
          </p>
          <p>
            Whether you're running marketing campaigns, managing inventory, or
            creating interactive experiences, TagWave gives you the data and
            tools you need to succeed.
          </p>
        </section>

        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            Our mission is to make NFC technology accessible and actionable for
            businesses of all sizes. We believe that every scan tells a story,
            and our goal is to help you understand and leverage those stories
            to drive better outcomes.
          </p>
        </section>

        <section className="about-section">
          <h2>Who We Serve</h2>
          <div className="target-users">
            <div className="user-card">
              <h3>🏢 Enterprises</h3>
              <p>
                Large organizations managing thousands of NFC tags across multiple
                locations and campaigns
              </p>
            </div>

            <div className="user-card">
              <h3>🏪 Retailers</h3>
              <p>
                Retail businesses using NFC tags for product information,
                promotions, and customer engagement
              </p>
            </div>

            <div className="user-card">
              <h3>📢 Marketing Agencies</h3>
              <p>
                Marketing teams creating interactive campaigns and tracking
                engagement metrics
              </p>
            </div>

            <div className="user-card">
              <h3>🎨 Event Organizers</h3>
              <p>
                Event planners using NFC tags for ticketing, information sharing,
                and attendee tracking
              </p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Why Choose Us?</h2>
          <ul className="benefits-list">
            <li>
              <strong>Intuitive Interface:</strong> Easy-to-use dashboard that
              requires no technical expertise
            </li>
            <li>
              <strong>Real-Time Data:</strong> Instant insights as soon as tags
              are scanned
            </li>
            <li>
              <strong>Scalable Solution:</strong> Grows with your business from
              10 to 10,000+ tags
            </li>
            <li>
              <strong>Secure Platform:</strong> Enterprise-grade security and
              data protection
            </li>
            <li>
              <strong>Expert Support:</strong> Dedicated customer support team
              ready to help
            </li>
            <li>
              <strong>Flexible Pricing:</strong> Plans that fit businesses of
              all sizes
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default About;
