const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    trainingImage: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    isContentOnly: {
      type: Boolean,
      default: false, // Default false rakhein taake purani trainings break na hon
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Training", trainingSchema);