const express = require("express");
const {
  selectTraining,
  getMyTraining,
  getUserSelections,
  getAllSelections,
} = require("../controller/usertrainingController");

const { isAuthenticated, verifyAdmin } = require("../middleware/isAuthenticated");

const router = express.Router();

/* ================= USER TRAINING ROUTES ================= */

// User selects a training
router.post("/select-training", isAuthenticated, selectTraining);

// Get logged-in user's selected training
router.get("/my-training", isAuthenticated, getMyTraining);

// Get selections for logged-in user (or admin can query ?userId=xxx)
router.get("/my-selections", isAuthenticated, getUserSelections);

// Get all selections (admin only)
router.get("/all-selections", isAuthenticated, verifyAdmin, getAllSelections);

module.exports = router;


