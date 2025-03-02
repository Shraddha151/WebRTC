const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


router.get("/users", async (req, res) => {
  const users = await User.find({});
  return res.status(200).json({ users });

})

// Register Route
router.post("/register", async (req, res) => {
  const { username, email, password, city } = req.body;
  if (!username || !email || !password || !city) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    console.log(existingUser)
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save new user
    const user = new User({ username, email, password: hashedPassword , city});
    await user.save();

    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, username: user.username, email: user.email, city: user.city }, "mongodb+srv://shraddhabhat151@gmail.com:<Spbhat151@>@cluster0.3erwj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", { expiresIn: "1h" });

    res.status(200).json({ message: "Login successful", ticket: token });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server error", error });
  }
});

router.post("/validate-ticket", authMiddleware, async (req, res) => {
  res.json({ message: "Ticket is valid", userId: req.user.userId });
})

module.exports = router;
