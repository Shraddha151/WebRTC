const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  roomName: { type: String, required: true },
  roomId: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // References User schema
});

module.exports = mongoose.model("Room", RoomSchema);
