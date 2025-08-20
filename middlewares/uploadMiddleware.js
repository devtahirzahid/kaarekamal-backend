// middleware/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Define allowed extensions
const allowedImageTypes = /jpeg|jpg|png|gif/;
const allowedVideoTypes = /mp4|mov|avi|mkv/;
const allowedDocTypes = /pdf|doc|docx/;
const allowedNotesTypes = /pdf|doc|docx|txt|ppt|pptx|xls|xlsx/;

// Ensure directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;

    if (["image", "img", "pic", "images"].includes(file.fieldname)) {
      uploadPath = "uploads/images";
    } else if (file.fieldname === "documents") {
      uploadPath = "uploads/documents";
    } else if (file.fieldname === "receipt") {
      uploadPath = "uploads/receipts";
    } else if (file.fieldname === "video") {
      uploadPath = "uploads/videos";
    } else if (file.fieldname === "resume") {
      uploadPath = "uploads/resumes";
    } else if (file.fieldname === "file") {
      uploadPath = "uploads/notes";
    } else {
      return cb(new Error("Invalid fieldname"));
    }

    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const filename = `${Date.now()}-${file.originalname}`;
    cb(null, filename);
  },
});

// File filter
function fileFilter(req, file, cb) {
  console.log("Incoming file field:", file.fieldname);

  if (!file) return cb(null, true);

  const extname = path.extname(file.originalname).toLowerCase().substring(1);

  if (
    (["image", "img", "pic", "images"].includes(file.fieldname) &&
      allowedImageTypes.test(extname)) ||
    (file.fieldname === "documents" && allowedDocTypes.test(extname)) ||
    (file.fieldname === "receipt" &&
      (allowedImageTypes.test(extname) || allowedDocTypes.test(extname))) ||
    (file.fieldname === "video" && allowedVideoTypes.test(extname)) ||
    (file.fieldname === "resume" && allowedDocTypes.test(extname)) ||
    (file.fieldname === "file" && allowedNotesTypes.test(extname))
  ) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
  }
}

// Copy to company folder
const copyToCompanyFolder = (filePath, filename) => {
  return new Promise((resolve, reject) => {
    const companyNgoDir = "uploads/company_ngo";
    ensureDirectoryExists(companyNgoDir);

    const sourcePath = filePath;
    const destPath = path.join(companyNgoDir, filename);

    fs.copyFile(sourcePath, destPath, (err) => {
      if (err) {
        console.error("Error copying file to company_ngo folder:", err);
        reject(err);
      } else {
        console.log(`File copied to company_ngo folder: ${destPath}`);
        resolve(destPath);
      }
    });
  });
};

// Error handler
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files uploaded.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: `Unexpected field: ${err.field}`,
      });
    }
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  }

  next();
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Export in CommonJS
module.exports = {
  uploadReceipt: upload.single("receipt"),
  uploadMultiple: upload.fields([{ name: "documents", maxCount: 5 }]),
  uploadTeacherFiles: upload,
  uploadCourseFiles: upload,
  uploadVideo: upload.single("video"),
  uploadNotes: upload.single("file"),
  copyToCompanyFolder,
  handleUploadError,
  upload,
};
