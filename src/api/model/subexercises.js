const mongoose = require("mongoose");

const subExerciseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },

    // ✅ Mux Video Fields
    videoPlaybackId: {
      type: String,
      default: null,
    },

    videoAssetId: {
      type: String,
      default: null,
    },

    // ✅ Like / Dislike
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ✅ Optional (agar frontend ko quick toggle chahiye)
    isLiked: {
      type: Boolean,
      default: false,
    },

    mainExerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: false,
    },
    trainingId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Training",
},
level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"], // Yahan levels define kiye
    required: false,
    default: null 
    
  },
isMuted: {
  type: Boolean,
  default: false,
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubExercise", subExerciseSchema);