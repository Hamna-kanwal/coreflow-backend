const express = require("express");
const {
  createSubExercise,
  updateSubExercise,
  getAllSubExercises,
  getSubExerciseById,
  deleteSubExercise,
  getLikedSubExercises,
  reactToggleSubExercise,
  getTotalSubExercises,
  generateMuxUploadUrl,
  getMuxAssetDetails,
  getSubExerciseswithsummary,
  updateAndGetVideoProgress,
  getTopResumeVideos // <--- Naya controller import karein
} = require("../controller/subexerciseController");

const { isAuthenticated, verifyAdmin } = require("../middleware/isAuthenticated");

const router = express.Router();

// ==========================================
// ROUTES (Multer removed for Mux direct upload)
// ==========================================

// Create & Update
router.post("/create", isAuthenticated, verifyAdmin, createSubExercise);
router.put("/update/:id", isAuthenticated, verifyAdmin, updateSubExercise);

// Admin / System Routes
router.delete("/delete/:id", isAuthenticated, verifyAdmin, deleteSubExercise);
router.post("/generate-upload-url", generateMuxUploadUrl);
router.get("/get-asset/:uploadId", getMuxAssetDetails);

// --- VIDEO PROGRESS / RESUME ROUTE ---
// Is route ko mobile end se hit kiya jayega video pause ya close hone par
router.post("/progress", isAuthenticated, updateAndGetVideoProgress); 
router.get("/resume-list", isAuthenticated, getTopResumeVideos);
// User / Viewing Routes
router.get("/getall", isAuthenticated, getAllSubExercises);
router.get("/liked", isAuthenticated, getLikedSubExercises);
router.post("/:id/react", isAuthenticated, reactToggleSubExercise);
router.get("/count", isAuthenticated, getTotalSubExercises);
router.get("/:id", isAuthenticated, getSubExerciseById);
router.get("/get-subexercises/:id", isAuthenticated, getSubExerciseswithsummary);

module.exports = router;