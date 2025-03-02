import React from 'react';
import '../styles/demo.css';
import Footer from './Footer';
import Header from './Header';

const Demo = (props) => {
  return (
    <div>
      <Header {...props} />

      {/* Demo Section */}
      <section className="demo-section">
        <h1>Demo</h1>
        <p>Watch our demo to see WebRTC in action!</p>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Demo;
