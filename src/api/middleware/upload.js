const express = require("express");
const cloudinary = require("../utils/cloudinary");
const router = express.Router();

// Body parser for JSON
router.use(express.json({ limit: "10mb" })); // increase if needed

// Upload route
router.post("/upload", async (req, res) => {
  try {
    const { image } = req.body; // expect base64 string or URL

    if (!image) return res.status(400).json({ message: "No image provided" });

    const result = await cloudinary.uploader.upload(image, {
      folder: "uploads",
    });

    res.status(200).json({
      message: "Image uploaded successfully",
      url: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

module.exports = router;
