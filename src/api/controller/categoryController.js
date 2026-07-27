const CommunityCategory = require("../model/communityCategory");
const CommunityPost = require("../model/communitypost");
const cloudinary = require("../utils/cloudinary");

// ------------------ GET ALL CATEGORIES ------------------
const getCategories = async (req, res) => {
  try {
    const categories = await CommunityCategory.find().sort({ createdAt: 1 });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error("GET CATEGORIES ERROR 👉", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ------------------ CREATE CATEGORY ------------------
const createCategory = async (req, res) => {
  try {
    const { title, description, image } = req.body;

    if (!title || !description || !image) {
      return res.status(400).json({ success: false, message: "All fields (title, description, image) are required" });
    }

    const cleanTitle = title.trim();
    const existingCategory = await CommunityCategory.findOne({ 
      title: { $regex: new RegExp(`^${cleanTitle}$`, "i") } 
    });

    if (existingCategory) {
      return res.status(400).json({ success: false, message: "Category with this title already exists" });
    }

    let imageUrl = image;
    if (image.startsWith("data:image")) {
      const uploadResult = await cloudinary.uploader.upload(image, { folder: "community-categories" });
      imageUrl = uploadResult.secure_url;
    }

    const category = await CommunityCategory.create({
      title: cleanTitle,
      description: description.trim(),
      image: imageUrl,
    });

    return res.status(201).json({ 
      success: true, 
      message: "Category created successfully", 
      category 
    });
  } catch (error) {
    console.error("CREATE CATEGORY ERROR 👉", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------ UPDATE CATEGORY ------------------
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image } = req.body;

    const category = await CommunityCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    let isUpdated = false;

    if (title !== undefined) {
      const cleanTitle = title.trim();
      const duplicate = await CommunityCategory.findOne({ title: cleanTitle, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ success: false, message: "Category title already exists" });
      }
      if (cleanTitle !== category.title) {
        category.title = cleanTitle;
        isUpdated = true;
      }
    }

    if (description !== undefined && description.trim() !== category.description) {
      category.description = description.trim();
      isUpdated = true;
    }

    if (image !== undefined) {
      if (image.startsWith("data:image")) {
        const uploadResult = await cloudinary.uploader.upload(image, { folder: "community-categories" });
        category.image = uploadResult.secure_url;
        isUpdated = true;
      } else if (image.startsWith("http") && image !== category.image) {
        category.image = image;
        isUpdated = true;
      }
    }

    if (!isUpdated) {
      return res.status(400).json({ success: false, message: "Nothing changed" });
    }

    await category.save();
    return res.status(200).json({ success: true, message: "Category updated successfully", category });
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR 👉", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ------------------ DELETE CATEGORY ------------------
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CommunityCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const postsCount = await CommunityPost.countDocuments({ categoryId: id });
    if (postsCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category. There are ${postsCount} posts associated with it.` 
      });
    }

    await CommunityCategory.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("DELETE CATEGORY ERROR 👉", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};