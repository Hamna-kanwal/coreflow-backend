// ==========================================
// 1. CONFIG & IMPORTS
// ==========================================
require("dotenv").config(); 
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const Pusher = require("pusher"); 
const connectDB = require("./src/api/utils/db.js");
const cron = require("node-cron");

// Models (Jinki zaroorat index.js mein hai)
const User = require("./src/api/model/user");
require("./src/api/model/admintraining"); // 👈 Yeh line add karein
require("./src/api/model/usertraining");  // 👈 Yeh line add karein
require("./src/api/model/subexercises");
require("./src/api/model/communityCategory"); // 👈 Yeh line add karein

// ==========================================
// 2. PUSHER CONFIGURATION
// ==========================================
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});


// Debugging for Environment Variables
if (!process.env.PUSHER_APP_ID) {
    console.log("❌ Pusher Keys missing in .env file!");
} else {
    console.log("✅ Pusher Keys Loaded Successfully");
}

const app = express();

// ==========================================
// 3. MIDDLEWARES & CORS
// ==========================================
app.use(express.json({ limit: "100mb" }));
app.use((req, res, next) => {
    console.log("Incoming Request:", req.method, req.path);
    console.log("Headers:", req.headers['content-type']);
    next();
});
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cookieParser());

const allowedOrigins = [
  "https://www.coreflowfit.com",
  "https://coreflowfit.com",
  "https://www.admin.coreflowfit.com",
  "https://admin.coreflowfit.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://api.coreflowfit.com"

];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// ==========================================
// 4. API ROUTES (Registration)
// ==========================================
app.get("/", (req, res) => {
  res.status(200).json({ message: "CoreFlow API is running successfully", success: true });
});

app.use("/api/v1/users", require("./src/api/routes/userRoutes.js"));
app.use("/api/v1/training", require("./src/api/routes/adminTrainingRoutes.js"));
app.use("/api/v1/user-training", require("./src/api/routes/userTrainingRoutes.js"));
app.use("/api/v1/exercises", require("./src/api/routes/mainExerciseRoutes.js"));
app.use("/api/v1/subexercises", require("./src/api/routes/subExerciseRoutes.js"));
app.use("/api/v1/cloudinary", require("./src/api/routes/cloudinaryRoutes.js"));
app.use("/api/dashboard", require("./src/api/routes/dashboardRoutes.js"));
app.use("/api/v1/community-posts", require("./src/api/routes/communitypostRoutes.js"));
app.use("/api/search", require("./src/api/routes/serchRoutes.js"));
app.use("/api/v1/blog", require("./src/api/routes/blogRoutes.js"));
app.use("/api/v1/chat", require("./src/api/routes/chatRoutes.js")); // 👈 Modular Route handles everything
app.use("/api/v1", require("./src/api/routes/contactRoutes.js"));
app.use("/api/v1/notifications", require("./src/api/routes/notificationRoutes.js"));
app.use("/api/v1/live", require("./src/api/routes/liveRoutes.js"));
app.use("/api/v1/community-categories", require("./src/api/routes/categoryRoutes.js"));

// ==========================================
// 5. CRON JOBS
// ==========================================
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    await User.updateMany(
      { isSubscriptionActive: true, subscriptionEndDate: { $lt: now } },
      { $set: { isSubscriptionActive: false, subscriptionEndDate: null } }
    );
  } catch (error) {
    console.error("Cron Job Error:", error);
  }
});

// ==========================================
// 6. SERVER START
// ==========================================
// ==========================================
// 6. SERVER START & EXPORTS
// ==========================================
// ==========================================
// 6. SERVER START & EXPORTS
// ==========================================
// ==========================================
// 6. SERVER START & EXPORTS
// ==========================================

// ==========================================
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`API Server running at port ${PORT}`);
});

// Vercel ke liye export lazmi hai
module.exports = app;
module.exports.pusher = pusher;