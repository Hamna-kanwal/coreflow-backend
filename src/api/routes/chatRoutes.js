const express = require("express");
const router = express.Router();
const { sendMessage, getChatHistory,toggleBlockUser,reportUser } = require("../controller/chatController");
const { isAuthenticated } = require("../middleware/isAuthenticated");

router.post("/send",isAuthenticated, sendMessage);
router.get("/history/:senderId/:receiverId",  getChatHistory);
router.post("/toggle-block", toggleBlockUser);
router.post("/report", reportUser);

module.exports = router;