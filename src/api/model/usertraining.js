const mongoose = require("mongoose");

const userTrainingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    trainingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Training",
      required: true,
    },
    // New Field Added Here
    isContentOnly: {
      type: Boolean,
      default: false,
    },
        mainExerciseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Exercise",
          required: false,
        },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
  },
  { timestamps: true }
);

userTrainingSchema.index({ userId: 1, trainingId: 1 }, { unique: true });

module.exports = mongoose.model("UserTraining", userTrainingSchema);