const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "linkvault_dev_secret";

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.replace("Bearer ", "").trim();
};

const requireAuth = (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const optionalAuth = (req, _res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
  } catch (err) {
    req.user = null;
  }
  return next();
};

module.exports = { requireAuth, optionalAuth, JWT_SECRET };
