const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const router = express.Router();

// Stores uploaded images directly into the kaarekamal-web repo folder so the web app
// can serve them as static assets in local/dev workflows.
//
// NOTE: This is not suitable for Vercel/serverless deployments (filesystem is ephemeral).
// Override with absolute path if backend repo is not next to kaarekamal-web:
// EVENT_UPLOAD_DIR=/full/path/to/kaarekamal-web/public/images/event/uploads
const uploadsDir = process.env.EVENT_UPLOAD_DIR
  ? path.resolve(process.env.EVENT_UPLOAD_DIR)
  : path.resolve(
      __dirname,
      "..",
      "..",
      "kaarekamal-web",
      "public",
      "images",
      "event",
      "uploads"
    );

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      ensureDir(uploadsDir);
      cb(null, uploadsDir);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeBase = path
      .basename(file.originalname || "upload", ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase || "upload"}-${unique}${ext || ".jpg"}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype || "")) {
      cb(null, true);
    } else {
      cb(new Error("Only image uploads are allowed"));
    }
  },
});

// POST /api/uploads/event-image
// form-data: file=<image>
router.post("/event-image", (req, res) => {
  // Hosted on Vercel: no persistent disk and no sibling kaarekamal-web folder in the bundle.
  // Repo-local uploads only work when this API runs on your machine (or a VPS with a writable path).
  if (process.env.VERCEL) {
    return res.status(503).json({
      code: "UPLOAD_NOT_SUPPORTED",
      message:
        "Image upload into the website repo is not available on the hosted API (Vercel). Run kaarekamal-backend locally, then in kaarekamal-admin-dashboard create .env.local with NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api (or your PORT) and upload again. For production, use object storage (e.g. S3 / Cloudinary) and store the returned URL on the event.",
    });
  }

  upload.single("file")(req, res, (err) => {
    if (err) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ message: err.message || "Upload failed" });
    }
    if (!req.file) return res.status(400).json({ message: "Missing file" });

    const publicPath = `/images/event/uploads/${req.file.filename}`;

    return res.status(201).json({
      message: "Uploaded",
      path: publicPath,
      filename: req.file.filename,
    });
  });
});

module.exports = router;

