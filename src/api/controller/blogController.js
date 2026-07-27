const Blog = require("../model/blog");
const mongoose = require("mongoose");

// Helper function to validate MongoDB ID
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// 1. Create Blog
const createBlog = async (req, res) => {
  try {
    const { title, description, image, pagetitle, pageDescription, keywords, tag } = req.body;

    // Har field ka alag check
    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!description) {
      return res.status(400).json({ success: false, message: "Description is required" });
    }
    if (!image) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }
  
    if (!tag) {
      return res.status(400).json({ success: false, message: "Tag is required" });
    }

    // Base64 format validation
    if (typeof image === 'string' && !image.startsWith("data:image/")) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid image format. Must be a valid base64 string" 
      });
    }

    const blog = await Blog.create({
      title,
      description,
      image,
      pagetitle,
      pageDescription: pageDescription || null,
      keywords: keywords || null,
      tag
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

    const { title, description, image, pagetitle, pageDescription, keywords, tag } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    // Updating fields only if they are provided
    if (title) blog.title = title;
    if (description) blog.description = description;
    if (pagetitle) blog.pagetitle = pagetitle;
    if (tag) blog.tag = tag;
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
    const { tag } = req.query;

    if (!tag) return res.status(400).json({ success: false, message: "Tag is required" });

    const related = await Blog.find({
      tag: tag,
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
  deleteBlog,
  getRelatedBlogs,
  getBlogCount
};