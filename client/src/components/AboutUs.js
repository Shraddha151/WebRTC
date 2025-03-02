import React from 'react';
import '../styles/aboutus.css';
import Footer from './Footer';
import Header from './Header';

const AboutUs = (props) => {
  return (
    <div>
     <Header {...props} />

      {/* About Us Section */}
      <section id="about" className="about-section">
      <div className="about-container">
        <h2>About Us</h2>
        <p>
          At <strong>WebRTC</strong>, we are committed to providing seamless real-time communication solutions for
          video, audio, and data sharing. Our mission is to empower developers and businesses with cutting-edge
          technology to build secure and scalable applications.
        </p>

        <div className="about-content">
          <div className="about-card">
            <h3>🚀 Our Mission</h3>
            <p>To simplify real-time communication technology and make it accessible to everyone across the globe.</p>
          </div>
          <div className="about-card">
            <h3>💡 Our Vision</h3>
            <p>Innovating and delivering secure, high-performance communication solutions for modern applications.</p>
          </div>
          <div className="about-card">
            <h3>🤝 Our Values</h3>
            <p>Integrity, Innovation, and Inclusivity drive everything we do at WebRTC.</p>
          </div>
        </div>
      </div>
    </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutUs;
