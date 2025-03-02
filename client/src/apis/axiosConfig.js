import axios from "axios";

const API = axios.create({
  baseURL: "/api/", // Your server's base URL
});

// Attach the token to every request automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authTicket"); // Fetch the token from localStorage
    if (token) {
      config.headers.Authorization = token; // Attach the token to Authorization header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
