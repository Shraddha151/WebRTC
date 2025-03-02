// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "No token provided. Access denied." });
  }

  try {
    const decoded = jwt.verify(token, "mongodb://127.0.0.1/local");
    req.user = await User.findById(decoded.id).select("-password"); // Attach user info to the request
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token. Access denied." });
  }
};

module.exports = authMiddleware;
