import React, { useState } from 'react';
import '../styles/doc.css';
import Footer from './Footer';
import Header from './Header';

const Doc = (props) => {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleAccordion = (index) => {
      setActiveIndex(activeIndex === index ? null : index);
    };

    const sections = [
        {
          title: "1. Introduction to WebRTC",
          content: "WebRTC (Web Real-Time Communication) enables peer-to-peer audio, video, and data sharing in modern browsers without the need for plugins.",
        },
        {
          title: "2. Project Setup",
          content: (
            <ol>
              <li>Install Node.js and npm.</li>
              <li>Install dependencies with <code>npm install</code>.</li>
              <li>Run the server using <code>node server.js</code>.</li>
            </ol>
          ),
        },
        {
          title: "3. Starting a Video Call",
          content: "Create a unique room ID and share it to initiate a real-time video call.",
        },
        {
          title: "4. Troubleshooting",
          content: "Ensure camera and microphone permissions are enabled. Clear browser cache if the issue persists.",
        },
      ];

  return (
    <div>
       <Header {...props} />

      {/* Documentation Section */}
      <section id="start" className="documentation">
      <div className="doc-container">
        <h2>Documentation Overview</h2>

        <div className="accordion">
          {sections.map((section, index) => (
            <div key={index} className="accordion-item">
              <button className={`accordion-btn ${activeIndex === index ? "active" : ""}`} onClick={() => toggleAccordion(index)}>
                {section.title}
              </button>
              <div className="accordion-content" style={{ maxHeight: activeIndex === index ? "100px" : "0" }}>
                <p>{section.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Doc;