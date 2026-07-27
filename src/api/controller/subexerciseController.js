const mongoose = require("mongoose");
const SubExercise = require("../model/subexercises");
const Training = require("../model/admintraining");
const mux = require("../utils/mux");
const User = require("../model/user"); 
const VideoProgress = require("../model/videoprogress");


// ----------------------
// CREATE SUBEXERCISE
const createSubExercise = async (req, res, next) => {
  try {
    let { title, description, isLiked, isMuted, mainExerciseId, trainingId, videoPlaybackId, videoAssetId, level } = req.body;

    // 1. Basic fields check jo hamesha chahiye
    if (!title?.trim() || !description?.trim()) 
      return res.status(400).json({ message: "Title and description are required" });
    
    if (!trainingId)
      return res.status(400).json({ message: "trainingId is required" });

    const training = await Training.findById(trainingId);
    if (!training)
      return res.status(404).json({ message: "Training not found" });

    // 2. Logic: Agar contentOnly false hai, TO level zaroori hai
    if (!training.isContentOnly) {
      if (!level) return res.status(400).json({ message: "Level is required for this training" });
      
      if (!mainExerciseId) {
        return res.status(400).json({ message: "mainExerciseId is required for non-content exercises" });
      }
    }

    const cleanTitle = title.trim().replace(/\s+/g, " ");

    const duplicate = await SubExercise.findOne({
      title: cleanTitle,
      mainExerciseId: mainExerciseId || null,
      trainingId,
    });

    if (duplicate)
      return res.status(400).json({ message: "SubExercise already exists" });

    const newSubExercise = await SubExercise.create({
      title: cleanTitle,
      description: description.trim(),
      isMuted: isMuted || false,
      mainExerciseId,
      trainingId: trainingId || null,
      videoPlaybackId: videoPlaybackId || null,
      videoAssetId: videoAssetId || null,
      isLiked: isLiked === true || isLiked === "true",
      level: level || null, // Level tabhi save hoga agar provide kiya gaya ho
    });

    return res.status(201).json({
      message: "Created successfully",
      subExercise: newSubExercise,
    });
  } catch (error) {
// Yahan console.log karein taake server terminal mein error dikhe
    console.error("SERVER SIDE ERROR:", error); 
    res.status(500).json({ message: "Server error occurred", error: error.message });
  }
};

// ----------------------
// UPDATE SUBEXERCISE
// ----------------------
// ----------------------
// UPDATE SUBEXERCISE (Updated with Level support)
// ----------------------
const updateSubExercise = async (req, res, next) => {
  try {
    const {
      title,
      description,
      level,          // ✅ Added level
      isLiked,
      isMuted,
      mainExerciseId,
      trainingId,
      videoPlaybackId,
      videoAssetId,
    } = req.body;

    const sub = await SubExercise.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "Not found" });

    // Updates
    if (title) sub.title = title.trim();
    if (description) sub.description = description.trim();
    if (level) sub.level = level; // ✅ Update level
    if (mainExerciseId) sub.mainExerciseId = mainExerciseId;
    if (trainingId !== undefined) sub.trainingId = trainingId;
    if (videoPlaybackId !== undefined) sub.videoPlaybackId = videoPlaybackId;
    if (videoAssetId !== undefined) sub.videoAssetId = videoAssetId;
    
    if (isLiked !== undefined)
      sub.isLiked = isLiked === true || isLiked === "true";
    
    if (isMuted !== undefined) sub.isMuted = isMuted;

    await sub.save();

    res.json({ message: "Updated successfully", sub });
  } catch (error) {
    next(error);
  }
};

// ----------------------
// GENERATE MUX UPLOAD URL
// ----------------------
const generateMuxUploadUrl = async (req, res, next) => {
  try {
    // 1. Check karein ke mux object exist karta hai
    if (!mux || !mux.video) {
       console.error("Mux Object is missing properties:", mux);
       return res.status(500).json({ success: false, message: "Mux initialization failed" });
    }

    console.log("Attempting to create Mux upload...");

    const upload = await mux.video.uploads.create({
      new_asset_settings: { 
        playback_policy: ["public"] 
      },
      cors_origin: "*",
    });

    console.log("Mux Upload Created:", upload.id);

    res.status(200).json({
      success: true,
      uploadUrl: upload.url,
      uploadId: upload.id,
    });
  } catch (error) {
    // Yeh logs humein asli wajah batayenge
    console.error("---------- MUX ERROR LOG ----------");
    console.error("Message:", error.message);
    console.error("Type:", error.constructor.name);
    console.error("-----------------------------------");

    res.status(500).json({ 
      success: false, 
      message: "Internal Error: " + error.message, 
      errorType: error.constructor.name 
    });
  }
};
// ----------------------
// GET ALL SUBEXERCISES
// ----------------------
const getAllSubExercises = async (req, res, next) => {
  try {
   const subExercises = await SubExercise.find()
  .populate({
    path: "mainExerciseId",
    select: "title trainingId",
    populate: {
      path: "trainingId",
      select: "title isContentOnly",
    },
  })
  .populate("trainingId", "title isContentOnly");

    res.status(200).json({
      subExercises,
    });
  } catch (error) {
    next(error);
  }
};
// ----------------------
// GET SUBEXERCISE BY ID
// ----------------------
const getSubExerciseById = async (req, res, next) => {
  try {
    const subExercise = await SubExercise.findById(req.params.id).populate("mainExerciseId", "title");
    if (!subExercise) return res.status(404).json({ message: "SubExercise not found" });

    const streamUrl = subExercise.videoPlaybackId
      ? `https://stream.mux.com/${subExercise.videoPlaybackId}.m3u8`
      : null;

    res.status(200).json({ subExercise, streamUrl });
  } catch (error) {
    next(error);
  }
};

// ----------------------
// DELETE SUBEXERCISE
// ----------------------
const deleteSubExercise = async (req, res, next) => {
  try {
    const subExercise = await SubExercise.findById(req.params.id);
    if (!subExercise) return res.status(404).json({ message: "SubExercise not found" });

    if (subExercise.videoAssetId) {
      await mux.video.assets.delete(subExercise.videoAssetId);
    }

    await SubExercise.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ----------------------
// GET TOTAL VIDEOS
// ----------------------
const getTotalVideos = async (req, res, next) => {
  try {
    const totalVideos = await SubExercise.countDocuments({ videoPlaybackId: { $ne: null } });
    res.status(200).json({ success: true, totalVideos });
  } catch (error) {
    next(error);
  }
};

// ----------------------
// TOGGLE LIKE
// ----------------------
const toggleLikeSubExercise = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const sub = await SubExercise.findById(id);
    if (!sub) return res.status(404).json({ message: "SubExercise not found" });

    const liked = sub.likedBy.includes(userId);
    liked ? sub.likedBy.pull(userId) : sub.likedBy.push(userId);

    await sub.save();
    res.json({ success: true, isLiked: !liked });
  } catch (error) {
    next(error);
  }
};

// ----------------------
// GET SUBEXERCISES BY MAIN EXERCISE
// ----------------------
const getSubExercises = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("level");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const rawLevel = req.user?.level || user?.level;
    const userLevel = typeof rawLevel === "string" && rawLevel.trim()
      ? rawLevel.trim()
      : null;

    const filter = { mainExerciseId: req.params.id };
    if (userLevel && userLevel !== "Not set") {
      filter.level = userLevel;
    }

    console.log("[getSubExercises] userId:", userId, "req.user.level:", req.user?.level, "dbLevel:", user?.level, "appliedFilter:", filter);
    const subs = await SubExercise.find(filter);
    console.log("[getSubExercises] found:", subs.length, "levels:", subs.map(s => s.level));

    const data = subs.map(s => ({
      title: s.title,
      video: s.videoPlaybackId
        ? `https://stream.mux.com/${s.videoPlaybackId}.m3u8`
        : null,
      isLiked: s.likedBy.includes(userId),
    }));

    res.json({ success: true, subExercises: data });
  } catch (error) {
    next(error);
  }
};

// ----------------------
// REACT LIKE / DISLIKE
// ----------------------
const reactToggleSubExercise = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Login required" });

    const sub = await SubExercise.findById(id);
    if (!sub) return res.status(404).json({ message: "SubExercise not found" });

    const liked = sub.likedBy.some(u => u.toString() === userId.toString());
    const disliked = sub.dislikedBy.some(u => u.toString() === userId.toString());

    if (!liked && !disliked) sub.likedBy.push(userId);
    else if (liked) {
      sub.likedBy = sub.likedBy.filter(u => u.toString() !== userId.toString());
      sub.dislikedBy.push(userId);
    } else if (disliked) {
      sub.dislikedBy = sub.dislikedBy.filter(u => u.toString() !== userId.toString());
      sub.likedBy.push(userId);
    }

    await sub.save();
    res.json({ message: "Toggled", likes: sub.likedBy.length, dislikes: sub.dislikedBy.length });
  } catch (error) {
    next(error);
  }
};

// ----------------------
// GET LIKED SUBEXERCISES
// ----------------------
const getLikedSubExercises = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Login required" });

    // "thumbnailPlaybackId" agar alag se save hai toh wo bhi select karein, 
    // warna videoPlaybackId se hi thumbnail ban jayega.
    const likedSubs = await SubExercise.find({ likedBy: userId })
      .select("title videoPlaybackId");

    res.status(200).json({
      success: true,
      count: likedSubs.length,
      subExercises: likedSubs.map(s => ({
        title: s.title,
        video: s.videoPlaybackId
          ? `https://stream.mux.com/${s.videoPlaybackId}.m3u8`
          : null,
        // Thumbnail URL yahan add kiya hai
        thumbnail: s.videoPlaybackId
          ? `https://image.mux.com/${s.videoPlaybackId}/thumbnail.jpg?width=600&height=400&fit_mode=pad`
          : null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------
// GET TOTAL SUBEXERCISES
// ----------------------
const getTotalSubExercises = async (req, res, next) => {
  try {
    const total = await SubExercise.countDocuments();
    res.status(200).json({ success: true, totalSubExercises: total });
  } catch (error) {
    next(error);
  }
};
const getMuxAssetDetails = async (req, res, next) => {
  try {
    const { uploadId } = req.params;

    // Get upload status
    const upload = await mux.video.uploads.retrieve(uploadId);

    if (!upload.asset_id) {
      return res.status(400).json({ message: "Asset not ready yet" });
    }

    const asset = await mux.video.assets.retrieve(upload.asset_id);

    res.status(200).json({
      assetId: upload.asset_id,
      playbackId: asset.playback_ids[0].id,
    });

  } catch (error) {
    next(error);
  }
};
const getSubExerciseswithsummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Aapki specific video ki ID
    const topVideoId = "6a563a52a1334294fdbdaadf";

    // 1. User level fetch
    const user = await User.findById(userId).select("level");
    const userLevel = user?.level?.trim() || null;
    const applyLevelFilter = userLevel && userLevel !== "Not set";

    // 2. QUERY
    const query = {
      $or: [
        { trainingId: new mongoose.Types.ObjectId(id), mainExerciseId: null },
        applyLevelFilter
          ? { mainExerciseId: new mongoose.Types.ObjectId(id), level: userLevel }
          : { mainExerciseId: new mongoose.Types.ObjectId(id) }
      ]
    };

    const subs = await SubExercise.find(query).lean();

    // 3. Logic to move specific video to the TOP
    // Hum findIndex se wo video dhoondenge aur agar mil gayi toh use array ke start mein le aayenge
    const index = subs.findIndex(s => s._id.toString() === topVideoId);
    if (index > -1) {
      const [topVideo] = subs.splice(index, 1); // Video ko array se nikal diya
      subs.unshift(topVideo); // Array ke bilkul shuru mein daal diya
    }

    // 4. Response Mapping
    const data = subs.map(s => ({
      _id: s._id,
      title: s.title,
      description: s.description,
      level: s.level || "Not set",
      video: s.videoPlaybackId ? `https://stream.mux.com/${s.videoPlaybackId}.m3u8` : null,
      thumbnail: s.videoPlaybackId ? `https://image.mux.com/${s.videoPlaybackId}/thumbnail.jpg` : null
    }));

    return res.status(200).json({ 
      success: true, 
      count: data.length,
      subExercises: data 
    });
  } catch (error) {
    console.error("Error in getSubExerciseswithsummary:", error);
    next(error);
  }
};
const updateAndGetVideoProgress = async (req, res, next) => {
  try {
    const { subExerciseId, time_played, total_time } = req.body;
    const userId = req.user.id;

    if (time_played > total_time) {
      return res.status(400).json({ 
        success: false, 
        message: "Error: Played time cannot be more than total video length." 
      });
    }

    // Data Save ya Update
    // 'updatedAt' automatically update ho jayegi timestamps ki wajah se
    await VideoProgress.findOneAndUpdate(
      { userId, subExerciseId },
      { time_played, total_time },
      { upsert: true, new: true }
    );

    const allProgress = await VideoProgress.find({ userId })
      .populate({
        path: "subExerciseId",
        select: "title videoPlaybackId"
      })
      .sort({ updatedAt: -1 });

    const formattedData = allProgress.map((item) => {
      const playbackId = item.subExerciseId?.videoPlaybackId;
      return {
        subExerciseId: item.subExerciseId?._id,
        title: item.subExerciseId?.title,
        time_played: item.time_played,
        total_time: item.total_time,
        // Chart ke liye date field add kar di gayi hai
        watchedDate: item.updatedAt, 
        videoUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
        thumbnail: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : null
      };
    });

    res.status(200).json({
      success: true,
      resumeVideos: formattedData
    });

  } catch (error) {
    next(error);
  }
};

const getTopResumeVideos = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const allProgress = await VideoProgress.find({ userId })
      .populate({
        path: "subExerciseId",
        select: "title videoPlaybackId" 
      })
      .sort({ updatedAt: -1 })
      .limit(6);

    const formattedData = allProgress
      .filter(item => item.subExerciseId)
      .map((item) => {
        const playbackId = item.subExerciseId?.videoPlaybackId;
        return {
          subExerciseId: item.subExerciseId?._id,
          title: item.subExerciseId?.title,
          time_played: item.time_played,
          total_time: item.total_time,
          // Yahan bhi date add kar di hai
          watchedDate: item.updatedAt, 
          videoUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
          thumbnail: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : null
        };
      });

    res.status(200).json({
      success: true,
      count: formattedData.length,
      resumeVideos: formattedData
    });

  } catch (error) {
    next(error);
  }
};
module.exports = {
  createSubExercise,
  updateSubExercise,
  generateMuxUploadUrl,
  getAllSubExercises,
  getSubExerciseById,
  deleteSubExercise,
  getTotalVideos,
  toggleLikeSubExercise,
  getSubExercises,
  reactToggleSubExercise,
  getLikedSubExercises,
  getTotalSubExercises,
  getMuxAssetDetails,
  getSubExerciseswithsummary,
  updateAndGetVideoProgress,
   getTopResumeVideos,
};