const express = require("express");
const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const {
  signCloudFrontUrlIfConfigured,
  resolveCloudFrontPublicBaseUrl,
  resolveCloudFrontDomain,
} = require("../utils/cdn");

const router = express.Router();

const s3Region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
const s3Bucket = process.env.S3_BUCKET || process.env.AWS_BUCKET;
const s3Prefix = (process.env.S3_EVENT_IMAGE_PREFIX || "events").replace(/^\/+|\/+$/g, "");

const s3Client =
  s3Region && s3Bucket
    ? new S3Client({
        region: s3Region,
      })
    : null;

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype || "")) {
      cb(null, true);
    } else {
      cb(new Error("Only image uploads are allowed"));
    }
  },
});

function buildObjectKey(originalName) {
  const ext = path.extname(originalName || "").toLowerCase();
  const safeExt = ext && ext.length <= 8 ? ext : "";
  const id = crypto.randomBytes(16).toString("hex");
  return `${s3Prefix}/${id}${safeExt || ""}`;
}

function buildPublicCloudFrontUrlForKey(key) {
  const publicBaseUrl = resolveCloudFrontPublicBaseUrl();
  const domain = resolveCloudFrontDomain();

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;
  }

  if (domain) {
    return `https://${domain.replace(/^\/+|\/+$/g, "")}/${key}`;
  }

  // Fallback: S3 URL (works if bucket is public; not recommended)
  if (s3Bucket && s3Region) {
    return `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${key}`;
  }

  return null;
}

// POST /api/uploads/event-image
// form-data: file=<image>
router.post("/event-image", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ message: err.message || "Upload failed" });
    }
    if (!req.file) return res.status(400).json({ message: "Missing file" });

    if (!s3Client || !s3Bucket) {
      return res.status(500).json({
        message:
          "S3 is not configured. Set AWS_REGION (or AWS_DEFAULT_REGION) and S3_BUCKET (or AWS_BUCKET) on the backend.",
      });
    }

    try {
      const key = buildObjectKey(req.file.originalname);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype || "application/octet-stream",
          CacheControl: process.env.S3_CACHE_CONTROL || "public, max-age=31536000, immutable",
        })
      );

      const publicUrl = buildPublicCloudFrontUrlForKey(key);
      if (!publicUrl) {
        return res.status(500).json({
          message:
            "Upload succeeded but no public URL could be built. Set CLOUDFRONT_PUBLIC_BASE_URL (or AWS_CLOUDFRONT_PUBLIC_BASE_URL) or CLOUDFRONT_DOMAIN.",
          key,
        });
      }

      // Store `publicUrl` in Mongo (unsigned). Clients should fetch via short-lived signed URLs
      // returned from the Events API (`mapImageUrlForResponse`).
      const signedPreviewUrl = signCloudFrontUrlIfConfigured(publicUrl);

      return res.status(201).json({
        message: "Uploaded",
        // Back-compat: `url` is the stable URL to persist
        url: publicUrl,
        publicUrl,
        signedPreviewUrl,
        key,
        bucket: s3Bucket,
      });
    } catch (e) {
      return res.status(500).json({ message: e?.message || "S3 upload failed" });
    }
  });
});

module.exports = router;

