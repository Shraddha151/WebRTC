import React from 'react';
import Footer from './Footer';
import Header from './Header';
import RoomList from './RoomList';

const Rooms = (props) => {
  return (
    <div>
     <Header {...props} />
        <RoomList {...props} />
      <Footer />
    </div>
  );
};

export default Rooms;
