import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return ( <footer className="footer">
        <div className="footer-container">
          <div className="footer-column">
            <h3>WebRTC</h3>
            <p>Empowering real-time communication with seamless video, audio, and data sharing.</p>
          </div>
          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul>
              <li><Link
               to="/">Home</Link></li>
              <li><Link
               to="/connect">Connect</Link></li>
              <li><Link
               to="/doc">Documentation</Link></li>
              <li><Link
               to="/aboutus">About Us</Link></li>
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
      </footer>)}

      export default Footer;