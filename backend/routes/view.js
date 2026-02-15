const express = require("express");
const Vault = require("../models/Vault");
const fs = require("fs/promises");
const path = require("path");
const bcrypt = require("bcryptjs");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

async function handleExpired(res, item) {
  if (item?.filePath) {
    try {
      await fs.unlink(item.filePath);
    } catch (err) {
      // Ignore missing file errors
    }
  }
  await Vault.deleteOne({ id: item.id });
  return res.status(410).send("Link expired");
}

async function verifyPassword(req, res, item) {
  if (!item.passwordHash) return true;

  const provided =
    req.headers["x-linkvault-password"] || req.query.password || "";
  if (!provided) {
    res.status(401).json({ error: "Password required" });
    return false;
  }

  const ok = await bcrypt.compare(String(provided), item.passwordHash);
  if (!ok) {
    res.status(403).json({ error: "Invalid password" });
    return false;
  }
  return true;
}

router.get("/:id", async (req, res) => {
  try {
    const item = await Vault.findOne({ id: req.params.id });

    if (!item) return res.status(403).send("Invalid link");

    if (new Date() > item.expiresAt) {
      return handleExpired(res, item);
    }

  if (item.oneTime && item.consumedAt) {
    return res.status(410).send("Link already used");
  }

  if (item.maxViews !== null && item.viewCount >= item.maxViews) {
    return res.status(410).send("View limit reached");
  }

  if (!(await verifyPassword(req, res, item))) return;

  let updatedItem = item;
    if (item.type === "text") {
      const update = { $inc: { viewCount: 1 } };
      if (item.oneTime && !item.consumedAt) {
        update.$set = { consumedAt: new Date() };
      }
    updatedItem = await Vault.findOneAndUpdate({ id: item.id }, update, {
      new: true,
    });
      res.json({
        type: "text",
        content: updatedItem.content,
        expiresAt: updatedItem.expiresAt,
        requiresPassword: Boolean(updatedItem.passwordHash),
        oneTime: updatedItem.oneTime,
        maxViews: updatedItem.maxViews,
        viewCount: updatedItem.viewCount,
        ownerId: updatedItem.ownerId || null,
      });
    } else {
    updatedItem = await Vault.findOneAndUpdate(
      { id: item.id },
      { $inc: { viewCount: 1 } },
      { new: true }
    );
      res.json({
        type: "file",
        fileName:
          updatedItem.fileName || path.basename(updatedItem.filePath || "file"),
        fileSize: updatedItem.fileSize,
        mimeType: updatedItem.mimeType,
        expiresAt: updatedItem.expiresAt,
        downloadUrl: `/v/${updatedItem.id}/download`,
        requiresPassword: Boolean(updatedItem.passwordHash),
        oneTime: updatedItem.oneTime,
        maxViews: updatedItem.maxViews,
        viewCount: updatedItem.viewCount,
        maxDownloads: updatedItem.maxDownloads,
        downloadCount: updatedItem.downloadCount,
        ownerId: updatedItem.ownerId || null,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.get("/:id/download", async (req, res) => {
  try {
    const item = await Vault.findOne({ id: req.params.id });

    if (!item) return res.status(403).send("Invalid link");

    if (new Date() > item.expiresAt) {
      return handleExpired(res, item);
    }

  if (item.oneTime && item.consumedAt) {
    return res.status(410).send("Link already used");
  }

  if (
    item.maxDownloads !== null &&
    item.downloadCount >= item.maxDownloads
  ) {
    return res.status(410).send("Download limit reached");
  }

  if (!(await verifyPassword(req, res, item))) return;

    if (item.type !== "file" || !item.filePath) {
      return res.status(400).send("No file available");
    }

  const downloadUpdate = { $inc: { downloadCount: 1 } };
  if (item.oneTime && !item.consumedAt) {
    downloadUpdate.$set = { consumedAt: new Date() };
  }
  await Vault.updateOne({ id: item.id }, downloadUpdate);

  const fileName = item.fileName || path.basename(item.filePath);
  res.download(item.filePath, fileName);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.delete("/:id", optionalAuth, async (req, res) => {
  try {
    const item = await Vault.findOne({ id: req.params.id });

    if (!item) return res.status(403).send("Invalid link");

    if (!item.ownerId) {
      return res.status(401).json({
        error: "Owner authentication required for this link.",
      });
    }

    if (!req.user || String(item.ownerId) !== String(req.user.id)) {
      return res.status(401).json({
        error: "Owner authentication required for this link.",
      });
    }

    if (item.filePath) {
      try {
        await fs.unlink(item.filePath);
      } catch (err) {
        // Ignore if file is already gone
      }
    }

    await Vault.deleteOne({ id: item.id });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
