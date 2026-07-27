const Training = require("../model/admintraining");
const Exercise = require("../model/mainexercise");
const cloudinary = require("../utils/cloudinary.js");

// ---------- CREATE TRAINING ----------
const createTraining = async (req, res) => {
  try {
    const { title, image, description, isContentOnly } = req.body;

    if (!title || !title.trim())
      return res.status(400).json({ success: false, message: "Title is required" });

    if (!description || !description.trim())
      return res.status(400).json({ success: false, message: "Description is required" });

    // ❗ conditional image validation
    if (!isContentOnly && !image)
      return res.status(400).json({
        success: false,
        message: "Training image is required for full flow",
      });

    const cleanTitle = title.trim().replace(/\s+/g, " ");
    const cleanDescription = description.trim();

    const existingTraining = await Training.findOne({
      title: { $regex: new RegExp(`^${cleanTitle}$`, "i") },
    });

    if (existingTraining)
      return res.status(400).json({ success: false, message: "Title already exists" });

    let imageUrl = "";

    // upload only if image exists
    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "trainings/images",
      });
      imageUrl = result.secure_url;
    }

    const training = await Training.create({
      title: cleanTitle,
      description: cleanDescription,
      trainingImage: imageUrl,
      isContentOnly: isContentOnly || false,
    });

    return res.status(201).json({
      success: true,
      message: "Training created successfully",
      training,
    });

  } catch (error) {
    console.error("CREATE TRAINING ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------- GET ALL TRAININGS ----------
const getAllTrainings = async (req, res) => {
  try {
    const trainings = await Training.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      trainings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------- UPDATE TRAINING ----------
const updateTraining = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image, isContentOnly } = req.body;

    const training = await Training.findById(id);
    if (!training)
      return res.status(404).json({ success: false, message: "Training not found" });

    let isUpdated = false;

    if (title && title.trim()) {
      const cleanTitle = title.trim().replace(/\s+/g, " ");

      if (cleanTitle !== training.title) {
        const existingTraining = await Training.findOne({
          title: { $regex: new RegExp(`^${cleanTitle}$`, "i") },
          _id: { $ne: id },
        });

        if (existingTraining)
          return res.status(400).json({ success: false, message: "Title already exists" });

        training.title = cleanTitle;
        isUpdated = true;
      }
    }

    if (description && description.trim()) {
      const cleanDescription = description.trim();

      if (cleanDescription !== training.description) {
        training.description = cleanDescription;
        isUpdated = true;
      }
    }

    // image update
    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "trainings/images",
      });

      training.trainingImage = result.secure_url;
      isUpdated = true;
    }

    // isContentOnly update
    if (typeof isContentOnly !== "undefined") {
      training.isContentOnly = isContentOnly;
      isUpdated = true;
    }

    if (!isUpdated)
      return res.status(400).json({ success: false, message: "Nothing changed" });

    await training.save();

    return res.status(200).json({
      success: true,
      message: "Training updated successfully",
      training,
    });

  } catch (error) {
    console.error("UPDATE TRAINING ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------- DELETE TRAINING ----------
const deleteTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);

    if (!training)
      return res.status(404).json({ success: false, message: "Training not found" });

    await Training.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Training deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------- GET TRAINING BY ID ----------
const getTrainingById = async (req, res) => {
  try {
    const { id } = req.params;

    const training = await Training.findById(id);

    if (!training)
      return res.status(404).json({ success: false, message: "Training not found" });

    const exercises = await Exercise.find({ trainingId: id }).select(
      "title image"
    );

    return res.status(200).json({
      success: true,
      training: { ...training._doc, exercises },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------- COUNT ----------
const getTrainingCount = async (req, res) => {
  try {
    const totalTrainings = await Training.countDocuments();

    res.status(200).json({
      success: true,
      totalTrainings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  createTraining,
  getAllTrainings,
  updateTraining,
  deleteTraining,
  getTrainingById,
  getTrainingCount,
};