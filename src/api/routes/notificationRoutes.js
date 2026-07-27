const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markNotificationAsSeen
} = require("../controller/notificationController");

const { isAuthenticated } = require("../middleware/isAuthenticated");

// ✅ Get user notifications
router.get("/all", isAuthenticated, getMyNotifications);

// ✅ Mark notification as read
router.patch("/nseen/:id", isAuthenticated,  markNotificationAsSeen);

module.exports = router;