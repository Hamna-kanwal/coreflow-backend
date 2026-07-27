const mongoose = require("mongoose");

const videoProgressSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    subExerciseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "SubExercise", 
      required: true 
    },
    time_played: { type: Number, default: 0 },
    total_time: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Taake ek user ka ek video ke liye ek hi record rahe
videoProgressSchema.index({ userId: 1, subExerciseId: 1 }, { unique: true });

module.exports = mongoose.model("VideoProgress", videoProgressSchema);