const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
require("./db");
const Vault = require("./models/Vault");

const uploadRoute = require("./routes/upload");
const viewRoute = require("./routes/view");
const authRoute = require("./routes/auth");
const accountRoute = require("./routes/account");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("LinkVault backend is running 🚀");
});

app.use("/upload", uploadRoute);
app.use("/v", viewRoute);
app.use("/auth", authRoute);
app.use("/me", accountRoute);

const cleanupExpired = async () => {
  const now = new Date();
  const expiredItems = await Vault.find({ expiresAt: { $lt: now } });
  for (const item of expiredItems) {
    if (item.filePath) {
      try {
        await fs.unlink(item.filePath);
      } catch (err) {
        // Ignore if file is already gone
      }
    }
  }
  await Vault.deleteMany({ expiresAt: { $lt: now } });
};

setInterval(() => {
  cleanupExpired().catch((err) => console.error("Cleanup error:", err));
}, 60 * 1000);

cleanupExpired().catch((err) => console.error("Cleanup error:", err));

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});
