const mongoose = require("mongoose");

// One participant's continuous stretch inside a session (a user can appear
// more than once if they disconnect and rejoin).
const participantSchema = new mongoose.Schema(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    socketId: { type: String, required: true },
    userName: { type: String, required: true },
    host: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date, default: null },
  },
  { _id: false }
);

// A Session is one continuous stretch a room had people in it — created
// when the first person joins an (in-memory) empty room and closed when
// the last person leaves. This is an attendance-style record, separate
// from the live board/chat persistence in the Room model.
const sessionSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  participants: { type: [participantSchema], default: [] },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
});

module.exports = mongoose.models.Session || mongoose.model("Session", sessionSchema);
