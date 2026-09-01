const Blog = require("../model/blog");
const mongoose = require("mongoose");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// 1. Create Blog
const createBlog = async (req, res) => {
  try {
    const { title, slug, description, image, pagetitle, pageDescription, keywords } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!slug) {
      return res.status(400).json({ success: false, message: "Slug is required" });
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        success: false,
        message: "Slug can only contain lowercase letters, numbers, and hyphens (e.g. my-blog-title)"
      });
    }
    if (!description) {
      return res.status(400).json({ success: false, message: "Description is required" });
    }
    if (!image) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    if (typeof image === 'string' && !image.startsWith("data:image/")) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid image format. Must be a valid base64 string" 
      });
    }

    // Check duplicate slug
    const existingSlug = await Blog.findOne({ slug });
    if (existingSlug) {
      return res.status(400).json({ success: false, message: "This slug is already in use, please choose another" });
    }

    const blog = await Blog.create({
      title,
      slug,
      description,
      image,
      pagetitle,
      pageDescription: pageDescription || null,
      keywords: keywords || null,
    });

    res.status(201).json({ success: true, message: "Blog created successfully", blog });
  } catch (err) {
    console.error("CREATE BLOG ERROR:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 2. Update Blog
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid Blog ID" });

    const { title, slug, description, image, pagetitle, pageDescription, keywords } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    if (slug && slug !== blog.slug) {
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({
          success: false,
          message: "Slug can only contain lowercase letters, numbers, and hyphens (e.g. my-blog-title)"
        });
      }
      const existingSlug = await Blog.findOne({ slug, _id: { $ne: id } });
      if (existingSlug) {
        return res.status(400).json({ success: false, message: "This slug is already in use, please choose another" });
      }
      blog.slug = slug;
    }

    if (title) blog.title = title;
    if (description) blog.description = description;
    if (pagetitle) blog.pagetitle = pagetitle;
    if (image) blog.image = image;

    blog.pageDescription = pageDescription !== undefined ? pageDescription : blog.pageDescription;
    blog.keywords = keywords !== undefined ? keywords : blog.keywords;

    await blog.save();
    res.status(200).json({ success: true, message: "Blog updated successfully", blog });
  } catch (err) {
    console.error("UPDATE BLOG ERROR:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 3. Get all blogs
const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, blogs });
  } catch (err) {
    console.error("GET BLOGS ERROR:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 4. Get single blog by ID
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid Blog ID format" });

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    
    res.status(200).json({ success: true, blog });
  } catch (err) {
    console.error("GET BLOG ERROR:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 4b. Get single blog by SLUG (frontend ke slug page ke liye)
const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ success: false, message: "Slug is required" });

    const blog = await Blog.findOne({ slug });
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    res.status(200).json({ success: true, blog });
  } catch (err) {
    console.error("GET BLOG BY SLUG ERROR:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 5. Delete blog
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid Blog ID" });

    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    res.status(200).json({ success: true, message: "Blog deleted successfully" });
  } catch (err) {
    console.error("DELETE BLOG ERROR:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 6. Get Related Blogs
const getRelatedBlogs = async (req, res) => {
  try {
    const { id } = req.params;

    const related = await Blog.find({
      _id: { $ne: id }
    })
    .limit(3)
    .sort({ createdAt: -1 });

    res.status(200).json({ success: true, blogs: related });
  } catch (err) {
    console.error("RELATED BLOGS ERROR:", err.message);
    res.status(500).json({ success: false, message: "Error fetching related blogs" });
  }
};

// ---------- GET TOTAL BLOGS COUNT ----------
const getBlogCount = async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments();

    return res.status(200).json({
      success: true,
      totalBlogs,
    });
  } catch (error) {
    console.error("GET BLOG COUNT ERROR:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createBlog,
  updateBlog,
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  deleteBlog,
  getRelatedBlogs,
  getBlogCount
};