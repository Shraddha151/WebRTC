import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Room from "./routes/Room";
import WebRTC from './components/WebRTC';
import Login from './components/Login';
import Reg from './components/Reg';
import AboutUs from './components/AboutUs';
import Connect from './components/Connect';
import Doc from './components/Doc';
import Demo from './components/Demo';
import './App.css';
import Rooms from './components/Rooms';
import ProtectedRoute from './utils/ProtectedRoute';
import RoomCopy from './routes/RoomCopy';

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Reg} />
        <Route path="/aboutus" component={AboutUs} />
        <Route path="/connect" component={Connect} />
        <Route path="/doc" component={Doc} />
        <Route path="/demo" component={Demo} />
        <ProtectedRoute path="/room/:roomID" component={RoomCopy} />
        <ProtectedRoute path="/rooms" component={Rooms} />
        <Route path="/" component={WebRTC} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
