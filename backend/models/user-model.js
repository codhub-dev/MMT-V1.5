const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  password: { type: String }, // For email/password authentication
  createdAt: { type: Date, default: () => new Date() },
  isSubscribed: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  // Passkey/WebAuthn fields
  passkeys: [{
    credentialID: { type: Buffer },
    credentialPublicKey: { type: Buffer },
    counter: { type: Number },
    transports: [{ type: String }],
    createdAt: { type: Date, default: () => new Date() }
  }],
  currentChallenge: { type: String }
});

module.exports = mongoose.model("User", userSchema);
