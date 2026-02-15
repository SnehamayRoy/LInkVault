const mongoose = require("mongoose");

const VaultSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  type: { type: String, enum: ["text", "file"], required: true },
  content: { type: String, default: null },
  filePath: { type: String, default: null },
  fileName: { type: String, default: null },
  fileSize: { type: Number, default: null },
  mimeType: { type: String, default: null },
  passwordHash: { type: String, default: null },
  oneTime: { type: Boolean, default: false },
  consumedAt: { type: Date, default: null },
  maxViews: { type: Number, default: null },
  maxDownloads: { type: Number, default: null },
  viewCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Auto-delete expired docs
VaultSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Vault", VaultSchema);
