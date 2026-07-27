const express = require("express");
const router = express.Router();
const { getUserTrainingSummary } = require("../controller/dashboard");
const { isAuthenticated } = require("../middleware/isAuthenticated");

// ✅ Make sure middleware is here
router.get("/user-training-summary", isAuthenticated, getUserTrainingSummary);

module.exports = router;
