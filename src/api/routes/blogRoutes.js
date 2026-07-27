const express = require("express");
const router = express.Router();
const {
  createBlog,
  updateBlog,
  getAllBlogs,
  getBlogById,
  deleteBlog,
  getBlogCount
} = require("../controller/blogController");
const { isAuthenticated, verifyAdmin } = require("../middleware/isAuthenticated");

// ✅ Create a new blog
router.post("/create", isAuthenticated, verifyAdmin, createBlog);

// ✅ Update an existing blog
router.put("/update/:id", isAuthenticated, verifyAdmin, updateBlog);

// ✅ Get all blogs
router.get("/",getAllBlogs);
router.get("/count", isAuthenticated, verifyAdmin, getBlogCount);

// ✅ Get a single blog by ID
router.get("/:id", getBlogById);

// ✅ Delete a blog
router.delete("/delete/:id", isAuthenticated, verifyAdmin, deleteBlog);

module.exports = router;
