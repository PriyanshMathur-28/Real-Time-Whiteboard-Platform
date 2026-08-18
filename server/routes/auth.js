const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { sendPasswordResetEmail } = require("../utils/email");

const router = express.Router();

// Set a real secret in production via env var. This fallback only exists so
// local dev doesn't crash if you forget to set one — replace it before
// deploying, or every token becomes forgeable.
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";
const TOKEN_EXPIRY = "7d";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// Every route here needs the DB — fail with a clear, actionable message
// instead of hanging (mongoose buffers commands until a timeout by default)
// if Atlas isn't actually connected yet.
router.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Account storage is unavailable right now (database not connected). Please try again shortly.",
    });
  }
  next();
});

// ── POST /api/auth/signup ───────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required." });
    }
    if (!email || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: "A valid email is required." });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const token = issueToken(user);
    res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ error: "Could not create account. Please try again." });
  }
});

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    // Same generic message whether the email or password was wrong, so we
    // don't leak which emails have accounts.
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = issueToken(user);
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Could not log in. Please try again." });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
// Lets the frontend verify a stored token is still valid on app load.
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token provided." });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "User no longer exists." });
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
});

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
// Always responds with the same generic message whether or not the email
// is registered, so this endpoint can't be used to enumerate accounts.
router.post("/forgot-password", async (req, res) => {
  const GENERIC_OK = {
    message: "If an account exists for that email, a password reset link has been sent.",
  };

  try {
    const { email } = req.body || {};
    if (!email || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordTokenHash = hashToken(rawToken);
      user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").split(",")[0].trim();
      const resetUrl = `${clientUrl}/?resetToken=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

      try {
        await sendPasswordResetEmail({ to: normalizedEmail, resetUrl });
      } catch (mailErr) {
        // Don't leak mail-provider failures to the client — log it, but
        // still return the generic success message.
        console.error("Failed to send password reset email:", mailErr.message);
      }
    }

    res.json(GENERIC_OK);
  } catch (err) {
    console.error("Forgot-password error:", err.message);
    // Still return the generic message — never reveal server-side detail here.
    res.json(GENERIC_OK);
  }
});

// ── POST /api/auth/reset-password ───────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { token, email, password } = req.body || {};
    if (!token || !email) {
      return res.status(400).json({ error: "Missing or invalid reset link." });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordTokenHash +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ error: "This reset link is invalid or has expired. Please request a new one." });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Auto-login after a successful reset so the person doesn't have to
    // immediately re-enter the password they just set.
    const authToken = issueToken(user);
    res.json({ message: "Password reset successful.", token: authToken, user: user.toJSON() });
  } catch (err) {
    console.error("Reset-password error:", err.message);
    res.status(500).json({ error: "Could not reset password. Please try again." });
  }
});

module.exports = router;
