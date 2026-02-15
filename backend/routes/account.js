const express = require("express");
const Vault = require("../models/Vault");
const { requireAuth } = require("../middleware/auth");
const fs = require("fs/promises");

const router = express.Router();

router.get("/vaults", requireAuth, async (req, res) => {
  try {
    const items = await Vault.find({ ownerId: req.user.id })
      .sort({ createdAt: -1 })
      .select(
        "id type createdAt expiresAt oneTime maxViews maxDownloads viewCount downloadCount"
      );
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/vaults/:id", requireAuth, async (req, res) => {
  try {
    const item = await Vault.findOne({
      id: req.params.id,
      ownerId: req.user.id,
    });
    if (!item) return res.status(403).json({ error: "Not found" });

    if (item.filePath) {
      try {
        await fs.unlink(item.filePath);
      } catch (err) {
        // ignore missing file
      }
    }

    await Vault.deleteOne({ id: item.id });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
