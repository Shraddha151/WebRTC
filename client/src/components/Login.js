import React, { useState } from 'react';
import '../styles/login.css';
import Footer from './Footer';
import Header from './Header';
import { loginUser } from '../apis/authApis';
import Toast from 'light-toast';
import { Link } from 'react-router-dom';

const Login = (props) => {
  const [formData, setFormData] = useState({
      email: "",
      password: "",
    });
    const [errors, setErrors] = useState({});
  
    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
      setErrors({ ...errors, [e.target.name]: "" }); // Clear error for the field
    };
    const validateForm = () => {
      const newErrors = {};
      if (!formData.email.trim()) {
        newErrors.email = "Email is required.";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address.";
      }
      if (!formData.password.trim()) {
        newErrors.password = "Password is required.";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters long.";
      }
      return newErrors;
    };
  const handleSubmit = async (e) => {

    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    let response = await loginUser(formData.email, formData.password);
    if(response?.ticket) {
      props.history.push('/rooms');
    } else {
      Toast.fail("Please check your details", 3000, () => {});
    }
  }
  return (
    <div>
      <Header />

      {/* Login Form */}
      <section className="login-section">
        <div className="login-container">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input onChange={handleChange} type="email" id="email" name="email" placeholder="Enter your email" required />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input onChange={handleChange} type="password" id="password" name="password" placeholder="Enter your password" required />
            </div>
            <button type="submit" className="btn-login">Log In</button>
          </form>
          <p className="signup-text">Don't have an account? <Link to="/register">Sign up here</Link></p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Login;
