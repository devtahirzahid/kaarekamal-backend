// routes/blogRoutes.js
const express = require("express");
const {
  getAllBlogs,
  getPublishedBlogs,
  getBlogById,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogStats,
  uploadBlogImage,
  toggleBlogLike
} = require("../controllers/blogController");

const { uploadCourseFiles, handleUploadError } = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.get("/published", getPublishedBlogs);
router.get("/slug/:slug", getBlogBySlug);
router.post("/:blogId/like", toggleBlogLike);

router.get("/", getAllBlogs);
router.get("/stats", getBlogStats);
router.get("/:id", getBlogById);
router.post("/", createBlog);
router.put("/:id", updateBlog);
router.delete("/:id", deleteBlog);

router.post(
  "/upload-image",
  uploadCourseFiles.single("image"),
  handleUploadError,
  uploadBlogImage
);

module.exports = router;
