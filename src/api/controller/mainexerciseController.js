const Exercise = require("../model/mainexercise");
const Training = require("../model/admintraining");
const SubExercise = require("../model/subexercises");
const cloudinary = require("../utils/cloudinary.js");
const mongoose = require("mongoose");
const { triggerNotification } = require("./notificationController");



// ----------------------
// Create Exercise      
// ----------------------
const createExercise = async (req, res) => {
  try {
    const { trainingId, title, image, description } = req.body;


   
    if (!trainingId || !title?.trim() || !description?.trim() || !image) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const cleanTitle = title.trim().replace(/\s+/g, " ");
    const cleanDescription = description.trim();

    const duplicate = await Exercise.findOne({
      trainingId,
      
      title: { $regex: new RegExp(`^${cleanTitle}$`, "i") }
    });

    if (duplicate) {
      return res.status(400).json({ 
        success: false, 
        message: `Exercise "${cleanTitle}" already exists.` 
      });
    }

    // 3. Image Handling & Cloudinary
    const base64ImageRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/;
    if (!base64ImageRegex.test(image)) {
      return res.status(400).json({ success: false, message: "Invalid image format" });
    }

    const uploadResult = await cloudinary.uploader.upload(image, { folder: "exercises/images" });

    // 4. Save to DB
    const exercise = new Exercise({
      trainingId,
      title: cleanTitle,
      description: cleanDescription,
      image: uploadResult.secure_url,
     
    });
    
    await exercise.save();

    // 5. Notification
    await triggerNotification({
      title: "New Exercise Added! 💪",
    
      type: "exercise",
      referenceId: exercise._id,
      parentReferenceId: trainingId,
      image: uploadResult.secure_url 
    });

    return res.status(201).json({ success: true, message: "Exercise created successfully", exercise });

  } catch (error) {
    console.error("CREATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ----------------------
// Update Exercise
// ----------------------
const updateExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, image, description } = req.body;

    const exercise = await Exercise.findById(id);
    if (!exercise) return res.status(404).json({ success: false, message: "Exercise not found" });

    // 1. Combined Title + Level Update Check (Only if title or level is being changed)
    if (title ) {
      const finalTitle = title ? title.trim().replace(/\s+/g, " ") : exercise.title;
      

      const duplicate = await Exercise.findOne({
        trainingId: exercise.trainingId,
       
        title: { $regex: new RegExp(`^${finalTitle}$`, "i") },
        _id: { $ne: exercise._id }
      });

      if (duplicate) {
        return res.status(400).json({ 
          success: false, 
          message: `Exercise "${finalTitle}" already exists for ${finalLevel} level.` 
        });
      }

      exercise.title = finalTitle;

    }

    // 2. Description Update
    if (description) exercise.description = description.trim();

    // 3. Image Update
    if (image && typeof image === "string" && image.startsWith("data:image")) {
      const result = await cloudinary.uploader.upload(image, { folder: "exercises/images" });
      exercise.image = result.secure_url;
    }

    await exercise.save();
    return res.status(200).json({ success: true, message: "Exercise updated successfully", exercise });

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ----------------------
// Remaining Functions
// ----------------------
const getExercises = async (req, res) => {
  try {
    // Dropdown ke liye 'level' lazmi select karein
    const exercises = await Exercise.find().populate("trainingId", "title").select("title  image description trainingId");
    return res.status(200).json(exercises);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getExercisesByTraining = async (req, res) => {
  try {
    const { trainingId } = req.params;

    // 1. Training Details nikaalein
    const trainingDetails = await Training.findById(trainingId).lean();
    if (!trainingDetails) {
      return res.status(404).json({ success: false, message: "Training not found" });
    }

    // 2. RAW SEARCH (Yeh Mongoose ki auto-conversion ko bypass karta hai)
    // Hum direct collection ko hit kar rahe hain
    const exercises = await mongoose.connection.db.collection('exercises').find({
      $or: [
        { trainingId: trainingId }, 
        { trainingId: new mongoose.Types.ObjectId(trainingId) }
      ]
    }).project({ title: 1, image: 1 }).toArray();

    // 3. Response
    return res.status(200).json({
      success: true,
      data: {
        training: {
          title: trainingDetails.title,
          image: trainingDetails.image,
          description: trainingDetails.description
        },
        totalExercises: exercises.length,
        exercises: exercises // Ab yeh empty nahi aayega
      }
    });

  } catch (error) {
    console.error("DEBUG ERROR:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
const deleteExercise = async (req, res) => {
  try {
    await Exercise.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Exercise deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getTotalExercises = async (req, res) => {
  try {
    const total = await Exercise.countDocuments();
    return res.status(200).json({ totalExercises: total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const getExerciseWithSubExercises = async (req, res) => {
  try {
    const { id } = req.params; // main exercise id

    // ---------- VALIDATE ID ----------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid exercise ID" });
    }

    // ---------- FIND MAIN EXERCISE ----------
const mainExercise = await Exercise.findById(id).select("title");
    if (!mainExercise) {
      return res.status(404).json({ success: false, message: "Main exercise not found" });
    }

    // ---------- FIND SUB-EXERCISES ----------
    const subExercisesRaw = await SubExercise.find({ mainExerciseId: id }).select("title video count");

    // ---------- REMOVE _id FROM SUB-EXERCISES ----------
    const subExercises = subExercisesRaw.map(sub => ({
      title: sub.title,
      video: sub.video,
      count: sub.count, // optional, keep if needed
    }));

    // ---------- GET SUB-EXERCISE COUNT ----------
    const subExerciseCount = subExercisesRaw.length;

    return res.status(200).json({
      success: true,
      mainExercise: {
        title: mainExercise.title,
        subExerciseCount,  // ✅ number of sub-exercises
        subExercises,      // array without any _id
      },
    });
  } catch (error) {
    console.error("GET EXERCISE WITH SUB-EXERCISES NO IDS ERROR 👉", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};



const getSubExercisesSelectiveOnly = async (req, res) => {
  try {
    const { id } = req.params; // main exercise id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid exercise ID" });
    }

    const subExercisesAll = await SubExercise.find({ mainExerciseId: id }).select(
      "title description videoPlaybackId count"
    );

    if (!subExercisesAll || subExercisesAll.length === 0) {
      return res.status(404).json({ success: false, message: "No sub-exercises found" });
    }

    const subExercises = subExercisesAll.map((sub, index) => {
      const videoUrl = sub.videoPlaybackId
        ? `https://stream.mux.com/${sub.videoPlaybackId}.m3u8`
        : null;

      if (index === 0) {
        return {
          _id: sub._id,
          title: sub.title,
          description: sub.description,
          videoUrl,
        };
      }

      return {
        _id: sub._id,
        title: sub.title,
        videoUrl,
      };
    });

    return res.status(200).json({
      success: true,
      subExercises,
    });
  } catch (error) {
    console.error("GET SUB-EXERCISES SELECTIVE ERROR 👉", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};





module.exports = {
  createExercise,
  updateExercise,
  deleteExercise,
  getExercises,
  getExercisesByTraining,
  getTotalExercises,
  getExerciseWithSubExercises,
  getSubExercisesSelectiveOnly,
};
