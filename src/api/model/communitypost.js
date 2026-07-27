const mongoose = require("mongoose");

const communityPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityCategory", required: true },
  description: { type: String, required: true },
  image: { type: String, default: null },
  videoPlaybackId: { type: String, default: null },
  videoAssetId: { type: String, default: null },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: { type: String, required: true },
      isHidden: { type: Boolean, default: false },
      reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("CommunityPost", communityPostSchema);