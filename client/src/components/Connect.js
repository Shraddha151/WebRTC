import React, { useEffect, useContext } from 'react';
import '../styles/connect.css';
import Footer from './Footer';
import Header from './Header';

const Connect = (props) => {
  // const { setupStream } = useContext(SocketContext);
  // useEffect(() => {
  //   setupStream()
  // }, [])
  return (
    <div>
      <Header {...props}/>

      {/* Connect Section */}
      <section className="connect-section">
        <h1>Connect with Us</h1>
        <p>Learn how to connect with our services and start using WebRTC technology.</p>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Connect;
