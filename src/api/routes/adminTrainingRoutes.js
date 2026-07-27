const express = require("express");
const {
  createTraining,
  getAllTrainings,
  updateTraining,
  deleteTraining,
  getTrainingById,
  getTrainingCount,
} = require("../controller/admintrainingController");

const { isAuthenticated, verifyAdmin } = require("../middleware/isAuthenticated");

const router = express.Router();

/* ================= TRAINING ROUTES ================= */

// Add new training - only admin
router.post("/createTraining", isAuthenticated, verifyAdmin, createTraining);

// Get all trainings - any authenticated user
router.get("/getAllTrainings", isAuthenticated, getAllTrainings);

// Update a training (optional new image) - only admin
router.put("/updateTraining/:id", isAuthenticated, verifyAdmin, updateTraining);

// Delete a training - only admin
router.delete("/deleteTraining/:id", isAuthenticated, verifyAdmin, deleteTraining);
router.get("/getAllTrainings/public", getAllTrainings);
router.get("/user/:id", isAuthenticated, getTrainingById);
router.get("/count", isAuthenticated, verifyAdmin, getTrainingCount);

module.exports = router;


