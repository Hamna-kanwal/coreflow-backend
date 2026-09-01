const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phonenumber: { type: String, default: null },
    gender: { type: String, enum: ["male", "female", "other"], default: null },
    age: { type: Number, default: null },
    weight: { type: Number, default: null },
    address: { type: String, default: "" },
    is_admin: { type: Boolean, default: false },
    profileImage: { type: String, default: "https://res.cloudinary.com/difb9zzcu/image/upload/v1774338015/Gemini_Generated_Image_838nwz838nwz838n_qu4qic.png" },
    isVerified: { type: Boolean, default: false },
    isSubscriptionActive: { type: Boolean, default: false },
    subscriptionEndDate: { type: Date, default: null },
    freeVideosCount: { type: Number, default: 0 },
    emailVerifyToken: String,
    emailVerifyExpires: Date,
    isNewUser: { type: Boolean, default: true },
    freeDownloadsCount: { type: Number, default: 0 },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: null,
    },

    selectTraining: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Training",
      },
    ],

    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);