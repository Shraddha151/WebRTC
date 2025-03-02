// routes/roomRoutes.js
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const Room = require("../models/Room");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware"); // Middleware to verify user authentication

const router = express.Router();

// Create a new room
router.post("/create", authMiddleware, async (req, res) => {
  const { roomName } = req.body;
  const userId = req.user?.id // Extracted from auth middleware

  try {
    const room = new Room({
      roomName,
      roomId: uuidv4(),
      createdBy: userId,
    });

    await room.save();
    res.status(200).json({ message: "Room created successfully", room });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error creating room", error });
  }
});

// Get all rooms with user details
router.get("/", authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({ createdBy: req.user._id }).populate("createdBy", "username email");
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms", error });
  }
});

router.get("/:roomID", authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({ roomId: req.params.roomID }).populate("createdBy", "username email");
    if(rooms.length) {
      res.status(200).json({room: rooms[0]});
    } else {
      res.status(200).json({error: "Invalid Room Id"});
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms", error });
  }
});

module.exports = router;
