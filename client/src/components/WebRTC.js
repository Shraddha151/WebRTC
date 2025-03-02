import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/websitecss.css'
import Footer from './Footer';
import Header from './Header';

const WebRTC = (props) => {
  const handleMenuToggle = () => {
    const navLinks = document.getElementById('navLinks');
    const menuToggle = document.getElementById('menuToggle');
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('open');
  };

  return (
    <div>
      <Header {...props} />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Real-Time Communication with WebRTC</h1>
          <p>Empowering your applications with seamless video, audio, and data sharing. Experience the future of connectivity and collaboration.</p>
          <Link to="/login" className="cta-btn">Get Started</Link>
        </div>
        <div className="hero-image">
          <img src="hero-image.png" alt="WebRTC Connectivity" />
        </div>
      </section>

      {/* Main Section */}
      <section id="features" className="main-section">
        <h2>Why Choose WebRTC?</h2>
        <p className="main-description">Discover the powerful features of WebRTC that enable real-time and secure communication.</p>
        <div className="features-container">
          <div className="feature-box">
            <img src="videocall.png" alt="Video Call" />
            <h3>High-Quality Video Calls</h3>
            <p>Experience ultra-clear, low-latency video and audio calls directly in your browser.</p>
          </div>
          <div className="feature-box">
            <img src="core.png" alt="Data Transfer" />
            <h3>Secure Data Transfer</h3>
            <p>Safely exchange data with end-to-end encryption and advanced security protocols.</p>
          </div>
          <div className="feature-box">
            <img src="scalability.png" alt="Scalability" />
            <h3>Highly Scalable</h3>
            <p>Built for scale, WebRTC can handle large user bases with efficient bandwidth usage.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      {/* <footer className="footer">
        <div className="footer-container">
          <div className="footer-column">
            <h3>WebRTC</h3>
            <p>Empowering real-time communication with seamless video, audio, and data sharing.</p>
          </div>
          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="WebRTC.html">Home</a></li>
              <li><a href="connect.html">Connect</a></li>
              <li><a href="doc.html">Documentation</a></li>
              <li><a href="aboutus.html">About Us</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Contact Us</h4>
            <p>📞 <a href="tel:+18556722788">1-855-672-2788</a></p>
            <p>📧 <a href="mailto:support@webrtc.com">support@webrtc.com</a></p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 WebRTC. All Rights Reserved.</p>
        </div>
      </footer> */}
    </div>
  );
};

export default WebRTC;
