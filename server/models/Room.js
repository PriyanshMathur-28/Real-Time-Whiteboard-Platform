const mongoose = require("mongoose");

const elementSchema = new mongoose.Schema(
  {
    id: String,
    element: String,
    stroke: String,
    strokeWidth: Number,
    fill: String,
    offsetX: Number,
    offsetY: Number,
    endX: Number,
    endY: Number,
    width: Number,
    height: Number,
    path: [[Number]],
    text: String,
    font: String,
    eraserSize: Number,
  },
  { _id: false, strict: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    senderId: String,
    senderName: String,
    message: String,
    timestamp: Number,
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  // Human-readable board name, set by the creator
  boardName: { type: String, default: "", maxlength: 80 },
  // Account ID of the user who created this board
  ownerAccountId: { type: String, default: null, index: true },
  // All account IDs that have ever joined this board (for My Boards lookup)
  participantAccountIds: { type: [String], default: [] },
  elements: { type: [elementSchema], default: [] },
  chat: { type: [chatMessageSchema], default: [] },
  lastActive: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", roomSchema);
