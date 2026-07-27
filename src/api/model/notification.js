const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Agar aap specific user ko bhejna chahti hain
    required: false, // False rakhein agar ye "Global" notification hai sab ke liye
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["training", "exercise", "sub-exercise", "payment", "system","community-post"], 
    required: true 
  },
  referenceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true // Training ya Exercise ki ID takay click par wahan ja sakay
  },
  parentReferenceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: false // Agar exercise hai, to uski Training ID yahan ayegi
  },
  image: { 
    type: String // Thumbnail URL (ImageKit ya Cloudinary se)
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  notificationDate: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);