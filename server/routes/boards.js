const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Room = require("../models/Room");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";

// ── Auth middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

// ── DB guard ─────────────────────────────────────────────────────────────────
router.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected." });
  }
  next();
});

// ── GET /api/boards ──────────────────────────────────────────────────────────
// Returns boards the logged-in user owns or has participated in,
// sorted by lastActive desc, limited to 50.
router.get("/", requireAuth, async (req, res) => {
  try {
    const accountId = req.user.sub;
    const boards = await Room.find({
      $or: [
        { ownerAccountId: accountId },
        { participantAccountIds: accountId },
      ],
    })
      .sort({ lastActive: -1 })
      .limit(50)
      .select("roomId boardName ownerAccountId participantAccountIds lastActive elements")
      .lean();

    // Return a slimmed-down shape — element count only, not the full payload
    const result = boards.map((b) => ({
      roomId: b.roomId,
      boardName: b.boardName || b.roomId,
      isOwner: b.ownerAccountId === accountId,
      participantCount: (b.participantAccountIds || []).length,
      elementCount: (b.elements || []).length,
      lastActive: b.lastActive,
    }));

    res.json({ boards: result });
  } catch (err) {
    console.error("GET /api/boards error:", err.message);
    res.status(500).json({ error: "Could not fetch boards." });
  }
});

// ── DELETE /api/boards/:roomId ───────────────────────────────────────────────
// Delete board if owner (or unowned), or remove from participant list if participant.
router.delete("/:roomId", requireAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const accountId = req.user.sub;
    const board = await Room.findOne({ roomId });
    if (!board) {
      return res.status(404).json({ error: "Board not found." });
    }

    // If this user is the owner (or no owner is recorded), delete the board completely
    if (!board.ownerAccountId || board.ownerAccountId.toString() === accountId.toString()) {
      await Room.deleteOne({ roomId });
    } else {
      // Participant: remove from their saved boards
      await Room.updateOne(
        { roomId },
        { $pull: { participantAccountIds: accountId } }
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/boards/:roomId error:", err.message);
    res.status(500).json({ error: "Could not delete board." });
  }
});

module.exports = router;
