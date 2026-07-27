const cloudinary = require("../utils/cloudinary.js");

// ----------------------
// UPLOAD IMAGE OR VIDEO
// ----------------------
const uploadMedia = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ message: "No file uploaded ❌" });
    }

    // Decide whether image or video
    let file;
    let folder;
    let resourceType;

    if (req.files.image) {
      file = req.files.image;
      folder = "trainings/images";
      resourceType = "image";
    } else if (req.files.video) {
      file = req.files.video;
      folder = "trainings/videos";
      resourceType = "video";
    } else {
      return res.status(400).json({ message: "Image or Video file is required ❌" });
    }

    // Cloudinary uploader stream
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error 👉", error);
          return res.status(500).json({ message: "Cloudinary upload failed ❌" });
        }

        res.status(200).json({
          success: true,
          url: result.secure_url, // direct Cloudinary URL
        });
      }
    );

    file.data.pipe(uploadStream); // pipe file buffer to Cloudinary
  } catch (error) {
    console.error("UPLOAD ERROR 👉", error);
    res.status(500).json({ message: "Internal server error ❌" });
  }
};

module.exports = { uploadMedia };
