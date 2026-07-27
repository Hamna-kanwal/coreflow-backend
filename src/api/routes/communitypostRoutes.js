const express = require("express");
const { createPost, toggleLike, addComment, getPosts,deletePost,updatePost,getPostsCount,generateMuxUploadUrl, getMuxAssetDetails,toggleBookmark, 
  getBookmarkedPosts,reportPost,reportAndHideComment } = require("../controller/communitypostController");
const { isAuthenticated } = require("../middleware/isAuthenticated");

const router = express.Router();

// Get all posts
router.get("/get", isAuthenticated, getPosts);
router.get("/gets", isAuthenticated, getPosts);
// Create new post
router.post("/create", isAuthenticated, createPost);
router.put("/update/:id", isAuthenticated, updatePost);
router.delete("/deletePost/:id",isAuthenticated, deletePost);

// Like / Dislike toggle
router.put("/like/:id", isAuthenticated, toggleLike);

// Add comment
router.post("/comment/:id", isAuthenticated, addComment);
router.get("/count", isAuthenticated, getPostsCount);
router.post("/mux-upload-url", isAuthenticated, generateMuxUploadUrl);
router.get("/mux-asset/:uploadId", isAuthenticated, getMuxAssetDetails);
// Bookmark toggle
router.put("/bookmark/:id", isAuthenticated, toggleBookmark);

// Get all bookmarked posts
router.get("/bookmarked", isAuthenticated, getBookmarkedPosts);
router.post("/report-post", isAuthenticated, reportPost);
router.post("/report-hide", isAuthenticated, reportAndHideComment);

module.exports = router;  