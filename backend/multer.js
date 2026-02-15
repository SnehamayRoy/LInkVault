const multer = require("multer");
const path = require("path");

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 10);
const ALLOWED_MIME_TYPES = (process.env.ALLOWED_MIME_TYPES || "")
  .split(",")
  .map((type) => type.trim())
  .filter(Boolean);

const DEFAULT_ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowList =
      ALLOWED_MIME_TYPES.length > 0 ? ALLOWED_MIME_TYPES : DEFAULT_ALLOWED_TYPES;
    if (allowList.includes(file.mimetype)) {
      return cb(null, true);
    }
    const error = new Error("Unsupported file type.");
    error.code = "UNSUPPORTED_TYPE";
    return cb(error, false);
  },
});

module.exports = upload;
