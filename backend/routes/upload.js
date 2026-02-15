const express = require("express");
const { nanoid } = require("nanoid");
const dayjs = require("dayjs");
const bcrypt = require("bcryptjs");
const Vault = require("../models/Vault");
const upload = require("../multer");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", optionalAuth, upload.single("file"), async (req, res) => {
  try {
    const rawText = req.body?.text ?? "";
    const text = typeof rawText === "string" ? rawText.trim() : "";
    const rawPassword = req.body?.password ?? "";
    const password =
      typeof rawPassword === "string" ? rawPassword.trim() : "";
    const expiryMinutes = req.body?.expiryMinutes;
    const expiresAtInput = req.body?.expiresAt;
    const oneTimeRaw = req.body?.oneTime;
    const oneTime =
      oneTimeRaw === true ||
      oneTimeRaw === "true" ||
      oneTimeRaw === "1" ||
      oneTimeRaw === 1;
    const maxViewsRaw = req.body?.maxViews;
    const maxDownloadsRaw = req.body?.maxDownloads;
    const maxViews = maxViewsRaw ? Number(maxViewsRaw) : null;
    const maxDownloads = maxDownloadsRaw ? Number(maxDownloadsRaw) : null;

    if ((!text && !req.file) || (text && req.file)) {
      return res
        .status(400)
        .json({ error: "Provide either text or file (not both)." });
    }

    if (password && password.length < 4) {
      return res
        .status(400)
        .json({ error: "Password must be at least 4 characters." });
    }

    if (maxViews !== null && (!Number.isFinite(maxViews) || maxViews <= 0)) {
      return res.status(400).json({ error: "Invalid max views." });
    }
    if (
      maxDownloads !== null &&
      (!Number.isFinite(maxDownloads) || maxDownloads <= 0)
    ) {
      return res.status(400).json({ error: "Invalid max downloads." });
    }

    const id = nanoid(10);

    let expiresAt;
    if (expiresAtInput) {
      const parsed = new Date(expiresAtInput);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ error: "Invalid expiry date/time." });
      }
      if (parsed <= new Date()) {
        return res.status(400).json({ error: "Expiry must be in the future." });
      }
      expiresAt = parsed;
    } else if (expiryMinutes) {
      const minutes = Number(expiryMinutes);
      if (!Number.isFinite(minutes) || minutes <= 0) {
        return res.status(400).json({ error: "Invalid expiry minutes." });
      }
      expiresAt = dayjs().add(minutes, "minute").toDate();
    } else {
      expiresAt = dayjs().add(10, "minute").toDate();
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    await Vault.create({
      id,
      type: req.file ? "file" : "text",
      content: text || null,
      filePath: req.file ? req.file.path : null,
      fileName: req.file ? req.file.originalname : null,
      fileSize: req.file ? req.file.size : null,
      mimeType: req.file ? req.file.mimetype : null,
      passwordHash,
      oneTime,
      maxViews,
      maxDownloads,
      ownerId: req.user?.id || null,
      expiresAt,
    });

    const apiLink = `${req.protocol}://${req.get("host")}/v/${id}`;
    res.json({ id, apiLink });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File exceeds size limit." });
    }
    if (err.code === "UNSUPPORTED_TYPE") {
      return res.status(400).json({ error: "Unsupported file type." });
    }
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
