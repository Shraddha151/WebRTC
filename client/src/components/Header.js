import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import "../styles/header.css"
import axios from "axios";

const Header = (props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [humid, setHumid] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("authTicket"); // Remove token on logout
    setUser(null);
    if(props?.history) {
      props.history.push("/login");
    } else {
      window.location.href = "/login"
    }
  };
  const fetchWeather = async () => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${user?.city || "Islamabad"}&units=metric&appid=37e78c3096e576c4b3758d158358e03b`
      );
      if (response?.data?.main) {
        setTemperature(response.data.main.temp.toFixed(1)); // Round temperature to 1 decimal place
        setHumid(response.data.main.humidity.toFixed(1)); // Round temperature to 1 decimal place
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };
  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem("authTicket");

    if (token) {
      try {
        // Decode the JWT token
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
      } catch (error) {
        console.error("Invalid token:", error);
        setUser(null);
      }
    }
  }, []);
  useEffect(() => {
    fetchWeather();
  }, [user])
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const getHeaderWeather = () => {
    let rDiv = <></>;
    if(user) {
      rDiv = <span>
              <span>{user?.city} </span>
              {temperature !== null && <span> 🌡️ {temperature}°C </span>}
              {humid !== null && <span> 💧 {humid}°C</span>}
            </span>
    }
    return rDiv;
  }

  return (
    <header>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-left">
          {getHeaderWeather()}
        </div>
        { !user && <div className="top-right">
          <Link to="#">🌐 English</Link>
          <Link to="/login">👤 Log in</Link>
        </div> }
      </div>

      {/* Navigation Bar */}
      <nav className="nav-bar">
        <Link to="/" className="logo">WebRTC</Link>
        <div className="menu-toggle" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/">Home</Link>
          {/* <Link to="/connect">Connect</Link> */}
          { user && <Link to="/rooms">Rooms</Link>}
          <Link to="/doc">Documentation</Link>
          <Link to="/aboutus">About Us</Link>
        </div>
        <div className="cta">
          { user ? <>
            <span style={{ display: "block", textAlign: "center"}}>👤 {user.username}</span>
              <button style={{minWidth: "140px" }} className="btn btn-logout" onClick={handleLogout}>Logout</button>
          </> : 
          <Link to="/register" className="btn">Registration</Link>
          }
        </div>
      </nav>
    </header>
  );
};

export default Header;
