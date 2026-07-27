const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    trainingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Training",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
       
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exercise", exerciseSchema);
