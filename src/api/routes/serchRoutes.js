const express = require("express");
const { searchExercises } = require("../controller/searchController");
const { isAuthenticated } = require("../middleware/isAuthenticated"); // your auth middleware

const router = express.Router();

// GET /api/search?q=push  -> only for logged-in users
router.get("/", isAuthenticated, searchExercises);

module.exports = router;
