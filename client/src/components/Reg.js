import React, { useState } from "react";
import { createUser } from "../apis/authApis";
import "../styles/Reg.css";
import Header from "./Header";
import Footer from "./Footer";
import { Link } from "react-router-dom";
import Toast from 'light-toast';

const Reg = (props) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    city: ""
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // Clear error for the field
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!formData.city.trim()) {
      newErrors.password = "Password is required.";
    } else if (formData.city.length < 3) {
      newErrors.password = "City must be at least 3 characters long.";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    console.log("======== submitting =========")
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    console.log("Form submitted:", formData);
    const response = await createUser(formData.username, formData.email, formData.password, formData.city);
    if(response?.status == 200) {
      Toast.success("User registered Successfully", 3000, () => {});
      props.history.push("/login")
    } else {
      Toast.success("User register failed", 3000, () => {});
    }
  };

  return (
    <div>
    <Header />
    <section className="register-section">
      <div className="register-container">
        <h2>Create Your Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">User Name</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">City Name</label>
            <input
              type="text"
              id="city"
              name="city"
              placeholder="Enter your city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              type="password"
              id="confirm-password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn-register">Register</button>
        </form>
        <p className="login-text">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </div>
    </section>
    <Footer />
    </div>
  );
};

export default Reg;