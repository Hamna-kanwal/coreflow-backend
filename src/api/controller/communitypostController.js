const mongoose = require("mongoose");
const CommunityPost = require("../model/communitypost");
const CommunityCategory = require("../model/communityCategory");
const cloudinary = require("../utils/cloudinary"); 
const mux = require("../utils/mux");
const { triggerNotification } = require("./notificationController");
const User = require("../model/user"); 
const Report = require("../model/report");

const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { description, image, video, categoryId } = req.body;

    if (!description || !description.trim())
      return res.status(400).json({ success: false, message: "Description is required" });
    if (!image && !video)
      return res.status(400).json({ success: false, message: "Either image or video is required" });

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ success: false, message: "Valid Category ID is required" });
    }

    const categoryExists = await CommunityCategory.findById(categoryId);
    if (!categoryExists) return res.status(404).json({ success: false, message: "Category not found" });

    const cleanDescription = description.trim();
    if (!/^[A-Za-z0-9 ,.]+$/.test(cleanDescription))
      return res.status(400).json({ success: false, message: "Description can contain only letters, numbers, spaces, commas, and dots" });

    const existingPost = await CommunityPost.findOne({
      description: { $regex: new RegExp(`^${cleanDescription}$`, "i") },
    });
    if (existingPost) return res.status(400).json({ success: false, message: "Description already exists" });

    let imageUrl = null;
    let videoUrl = null;

    if (image) {
      const base64ImageRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/i;
      if (!base64ImageRegex.test(image))
        return res.status(400).json({ success: false, message: "Only JPG, JPEG, PNG, or WEBP allowed for image" });

      const result = await cloudinary.uploader.upload(image, { folder: "community-posts" });
      imageUrl = result.secure_url;
    }

    if (video) videoUrl = video;

    const post = await CommunityPost.create({
      userId,
      categoryId,
      description: cleanDescription,
      image: imageUrl,
      videoPlaybackId: videoUrl,
      likes: [],
      dislikes: [],
      comments: [],
    });

    await triggerNotification({
      title: "New Community Post!",
      message: `A new post was shared in ${categoryExists.title}: "${cleanDescription.substring(0, 30)}..."`,
      type: "system",
      referenceId: post._id,
      image: imageUrl || null
    });

    res.status(201).json({ success: true, message: "Post created successfully", post });
  } catch (error) {
    console.error("CREATE POST ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateMuxUploadUrl = async (req, res) => {
  try {
    const upload = await mux.video.uploads.create({
      new_asset_settings: { playback_policy: ["public"] },
      cors_origin: "*",
    });
    res.status(200).json({ success: true, uploadUrl: upload.url, uploadId: upload.id });
  } catch (error) {
    console.error("MUX UPLOAD URL ERROR 👉", error);
    res.status(500).json({ success: false, message: "Failed to generate Mux upload URL" });
  }
};

const getMuxAssetDetails = async (req, res) => {
  try {
    const { uploadId } = req.params;
    const upload = await mux.video.uploads.retrieve(uploadId);
    if (!upload.asset_id) return res.status(400).json({ message: "Asset not ready yet" });

    const asset = await mux.video.assets.retrieve(upload.asset_id);
    res.status(200).json({ assetId: upload.asset_id, playbackId: asset.playback_ids[0].id });
  } catch (error) {
    console.error("MUX ASSET DETAILS ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, image, video, categoryId } = req.body;

    const post = await CommunityPost.findById(id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    let isUpdated = false;

    if (categoryId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(categoryId))
        return res.status(400).json({ success: false, message: "Invalid Category ID" });

      const catExists = await CommunityCategory.findById(categoryId);
      if (!catExists) return res.status(404).json({ success: false, message: "Category not found" });

      if (categoryId.toString() !== post.categoryId.toString()) {
        post.categoryId = categoryId;
        isUpdated = true;
      }
    }

    if (description !== undefined) {
      const cleanDescription = description.trim();
      if (!/^[A-Za-z0-9 ,.]+$/.test(cleanDescription))
        return res.status(400).json({ success: false, message: "Invalid characters in description" });

      const duplicateDesc = await CommunityPost.findOne({ description: cleanDescription, _id: { $ne: id } });
      if (duplicateDesc) return res.status(400).json({ success: false, message: "Description already exists" });

      if (cleanDescription !== post.description) {
        post.description = cleanDescription;
        isUpdated = true;
      }
    }

    if (image === null) {
      if (post.image) { post.image = null; isUpdated = true; }
    } else if (image) {
      if (image.startsWith("data:image")) {
        const result = await cloudinary.uploader.upload(image, { folder: "community-posts" });
        post.image = result.secure_url;
        isUpdated = true;
      } else if (image.startsWith("http") && image !== post.image) {
        post.image = image;
        isUpdated = true;
      }
    }

    if (video === null) {
      if (post.videoPlaybackId) { post.videoPlaybackId = null; post.videoAssetId = null; isUpdated = true; }
    } else if (video !== undefined) {
      post.videoPlaybackId = video;
      post.videoAssetId = null;
      isUpdated = true;
    }

    if (!isUpdated) return res.status(400).json({ success: false, message: "Nothing changed" });

    await post.save();
    return res.status(200).json({ success: true, message: "Post updated successfully", post });
  } catch (error) {
    console.error("UPDATE POST ERROR:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await CommunityPost.findById(id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    await CommunityPost.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("DELETE POST ERROR:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ message: "Invalid post ID" });

    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const liked = post.likes.includes(userId);
    const disliked = post.dislikes.includes(userId);

    if (liked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
      if (disliked) post.dislikes.pull(userId);
    }

    await post.save();
    res.json({ success: true, likes: post.likes.length, dislikes: post.dislikes.length });
  } catch (err) {
    console.error("LIKE ERROR 👉", err);
    res.status(500).json({ message: "Server error" });
  }
};

const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ message: "Invalid post" });
    if (!text || text.trim() === "") return res.status(400).json({ message: "Comment cannot be empty" });

    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ userId, text });
    await post.save();

    res.json({ success: true, comments: post.comments });
  } catch (err) {
    console.error("COMMENT ERROR 👉", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getPosts = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { categoryId, postType } = req.query;

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ success: false, message: "Valid categoryId query parameter is required" });
    }

    if (postType && !["admin", "user"].includes(postType)) {
      return res.status(400).json({ success: false, message: "postType must be either 'admin' or 'user'" });
    }

    const user = await User.findById(currentUserId).select("blockedUsers");
    const blockedIds = user?.blockedUsers?.map(id => id.toString()) || [];

    const reportedEntries = await Report.find({ 
        reporterId: currentUserId, 
        targetPostId: { $exists: true },
        targetCommentId: { $exists: false } 
    }).select("targetPostId");
    
    const reportedPostIds = reportedEntries.map(entry => entry.targetPostId.toString());

    let userIdFilter = { $nin: blockedIds };

    if (postType === "admin") {
      const adminUsers = await User.find({ is_admin: true }).select("_id");
      const adminIds = adminUsers.map(u => u._id.toString());
      userIdFilter = { $in: adminIds };
    } else if (postType === "user") {
      const adminUsers = await User.find({ is_admin: true }).select("_id");
      const adminIds = adminUsers.map(u => u._id.toString());
      userIdFilter = { $nin: [...blockedIds, ...adminIds] };
    }

    const posts = await CommunityPost.find({
        categoryId: categoryId,
        userId: userIdFilter,
        _id: { $nin: reportedPostIds } 
      })
      .sort({ createdAt: -1 })
      .populate("userId", "fullname profileImage") // Yahan profileImage populate kar di hai
      .populate("categoryId", "title description image date")
      .populate("comments.userId", "fullname profileImage");

    const formattedPosts = posts.map(post => {
      const filteredComments = post.comments
        .filter(comment => {
          const commenterId = comment.userId?._id?.toString() || comment.userId?.toString();
          return !blockedIds.includes(commenterId) && !comment.isHidden;
        })
        .map(comment => ({
          _id: comment._id,
          text: comment.text,
          userName: comment.userId ? comment.userId.fullname : "Deleted User",
          userImage: comment.userId ? comment.userId.profileImage : null,
          userId: comment.userId ? (comment.userId._id || comment.userId) : null,
          createdAt: comment.createdAt
        }));

      return {
        _id: post._id,
        description: post.description,
        category: post.categoryId,
        postBy: post.userId ? post.userId.fullname : "Admin",
        userImage: post.userId ? post.userId.profileImage : null, // Post karne wale user ki image
        image: post.image,
        videoPlaybackId: post.videoPlaybackId,
        videoAssetId: post.videoAssetId,
        likesCount: post.likes ? post.likes.length : 0,
        dislikesCount: post.dislikes ? post.dislikes.length : 0,
        bookmarkedCount: post.bookmarkedBy ? post.bookmarkedBy.length : 0,
        comments: filteredComments,
        commentsCount: filteredComments.length,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      };
    });

    res.json({ success: true, posts: formattedPosts });
  } catch (err) {
    console.error("GET POSTS ERROR 👉", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getPostsCount = async (req, res) => {
  try {
    const totalPosts = await CommunityPost.countDocuments();
    return res.status(200).json({ success: true, totalPosts });
  } catch (error) {
    console.error("GET POSTS COUNT ERROR 👉", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const toggleBookmark = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const bookmarked = post.bookmarkedBy.includes(userId);
    if (bookmarked) post.bookmarkedBy.pull(userId);
    else post.bookmarkedBy.push(userId);

    await post.save();

    res.status(200).json({ success: true, isBookmarked: !bookmarked, totalBookmarks: post.bookmarkedBy.length });
  } catch (error) {
    console.error("BOOKMARK ERROR 👉", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getBookmarkedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("blockedUsers");
    const blockedIds = user.blockedUsers || [];

    const posts = await CommunityPost.find({ bookmarkedBy: userId, userId: { $nin: blockedIds } })
      .sort({ createdAt: -1 })
      .populate("userId", "fullname profileImage") // Yahan bhi profileImage populate ki hai
      .populate("categoryId", "title description image date")
      .populate("comments.userId", "fullname profileImage");

    const formattedPosts = posts.map(post => ({
      _id: post._id,
      description: post.description,
      category: post.categoryId,
      postBy: post.userId ? post.userId.fullname : "Unknown",
      userImage: post.userId ? post.userId.profileImage : null, // Bookmarked post ke author ki image
      image: post.image,
      videoPlaybackId: post.videoPlaybackId,
      videoAssetId: post.videoAssetId,
      likesCount: post.likes.length,
      dislikesCount: post.dislikes.length,
      bookmarked: true,
      comments: post.comments
        .filter(c => !blockedIds.includes(c.userId?._id?.toString()))
        .map(comment => ({
          _id: comment._id,
          text: comment.text,
          userName: comment.userId ? comment.userId.fullname : "Deleted User",
          userImage: comment.userId ? comment.userId.profileImage : null,
          userId: comment.userId ? comment.userId._id : null,
          createdAt: comment.createdAt
        })),
      commentsCount: post.comments.length,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));

    res.status(200).json({ success: true, posts: formattedPosts });
  } catch (error) {
    console.error("GET BOOKMARKED POSTS ERROR 👉", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const reportPost = async (req, res) => {
  try {
    const { postId } = req.body;
    const reporterId = req.user.id;

    if (!postId) return res.status(400).json({ success: false, message: "Post ID is required." });

    const post = await CommunityPost.findById(postId).populate("userId");
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });
    if (post.userId?.is_admin) {
      return res.status(400).json({ success: false, message: "Admin posts cannot be reported." });
    }

    const existingReport = await Report.findOne({ reporterId, targetPostId: postId });
    if (existingReport) return res.status(400).json({ success: false, message: "You have already reported this post." });

    await Report.create({ reporterId, targetPostId: postId, targetUserId: post.userId });

    res.status(201).json({ success: true, message: "Post reported and hidden from your feed." });
  } catch (error) {
    console.error("REPORT POST ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const reportAndHideComment = async (req, res) => {
  try {
    const { postId, commentId } = req.body;
    const userId = req.user.id;

    if (!postId || !commentId) return res.status(400).json({ success: false, message: "Post ID and Comment ID are required." });

    const updatedPost = await CommunityPost.findOneAndUpdate(
      { _id: postId, "comments": { $elemMatch: { _id: commentId, reportedBy: { $ne: userId } } } },
      { $set: { "comments.$[c].isHidden": true }, $addToSet: { "comments.$[c].reportedBy": userId } },
      { arrayFilters: [{ "c._id": commentId }], new: true }
    );

    if (!updatedPost) return res.status(404).json({ success: false, message: "Post/Comment not found or already reported by you." });

    const targetComment = updatedPost.comments.id(commentId);
    
    await Report.create({
        reporterId: userId,
        targetPostId: postId,
        targetCommentId: commentId, 
        targetUserId: targetComment.userId || updatedPost.userId,
        reportType: "comment"
    });

    res.status(200).json({ success: true, message: "Comment reported and hidden successfully." });
  } catch (error) {
    console.error("REPORT COMMENT ERROR 👉", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPost, updatePost, deletePost, toggleLike, addComment,
  getPosts, getPostsCount, generateMuxUploadUrl, getMuxAssetDetails,
  toggleBookmark, getBookmarkedPosts, reportPost, reportAndHideComment
};