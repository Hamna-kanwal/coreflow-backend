require("dotenv").config();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const Blog = require("./src/api/model/blog"); // Agar model 'src/model' folder mein hai

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const migrateBase64ImagesToCloudinary = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // 2. Find only the blogs that have base64 images starting with 'data:image/'
    const blogsToMigrate = await Blog.find({
      image: { $regex: /^data:image\// },
    });

    console.log(`Found ${blogsToMigrate.length} old blogs with base64 images.`);

    if (blogsToMigrate.length === 0) {
      console.log("No base64 images found. Everything is already up to date!");
      process.exit(0);
    }

    // 3. Upload each base64 image to Cloudinary and update the database record
    for (let blog of blogsToMigrate) {
      console.log(`Uploading image for blog: "${blog.title}"...`);

      const uploadResult = await cloudinary.uploader.upload(blog.image, {
        folder: "blogs/images",
      });

      // Replace the heavy base64 string with the Cloudinary secure URL
      blog.image = uploadResult.secure_url;
      await blog.save();

      console.log(`✔ Successfully migrated: "${blog.title}" -> ${uploadResult.secure_url}`);
    }

    console.log("🎉 All old blogs have been successfully migrated to Cloudinary!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

// Run the migration script
migrateBase64ImagesToCloudinary();