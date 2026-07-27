const express = require("express");
const {
  createExercise,
  getExercises,
  getExercisesByTraining,
  updateExercise,
  deleteExercise,
    getTotalExercises,
    getExerciseWithSubExercises,
    getSubExercisesSelectiveOnly,
      
} = require("../controller/mainexerciseController");

const { isAuthenticated, verifyAdmin } = require("../middleware/isAuthenticated");

const router = express.Router();

/* ================= EXERCISE ROUTES ================= */

// Create exercise (with image in req.body.image) - only admin
router.post("/create", isAuthenticated, verifyAdmin, createExercise);

// Get all exercises - any authenticated user
router.get("/getallexercises", isAuthenticated, getExercises);

// Get exercises by trainingId - any authenticated user
router.get("/training/:trainingId", isAuthenticated, getExercisesByTraining);

// Update exercise (optional new image) - only admin
router.put("/update/:id", isAuthenticated, verifyAdmin, updateExercise);


// Delete exercise - only admin
router.delete("/delete/:id", isAuthenticated, verifyAdmin, deleteExercise);
router.get("/total", getTotalExercises);
router.get("/user/:id", isAuthenticated, getExerciseWithSubExercises);
router.get("/user/selective/:id", isAuthenticated,  getSubExercisesSelectiveOnly);


// Get total exercises count
router.get("/count", isAuthenticated, getTotalExercises);

module.exports = router;
