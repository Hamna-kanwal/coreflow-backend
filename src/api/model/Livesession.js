const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema(
  {
    hostUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    streamKey: {
      type: String,
      unique: true,
      required: true,
    },
    title: String,
    isLive: {
      type: Boolean,
      default: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
    muxStreamId: { type: String, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LiveSession', liveSessionSchema);