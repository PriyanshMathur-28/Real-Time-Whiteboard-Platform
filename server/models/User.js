const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    // Hashed with bcrypt — never store or return the plain password.
    passwordHash: { type: String, required: true },

    // ── Forgot-password flow ────────────────────────────────────────────
    // We store a SHA-256 hash of the reset token (never the raw token) so
    // that a leaked database dump can't be used to reset anyone's password
    // — the raw token only ever exists in the emailed link.
    resetPasswordTokenHash: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

// Never leak the hash or reset-token fields if a User doc is serialized.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.resetPasswordTokenHash;
    delete ret.resetPasswordExpires;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
