const express = require("express");
const { uploadMedia } = require("../controller/cloudinaryController");

const router = express.Router();

// Upload image or video
router.post("/upload", uploadMedia);

module.exports = router;




