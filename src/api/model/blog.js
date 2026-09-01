const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"]
  },
  description: { type: String, required: true }, // CKEditor content
  image: { type: String, required: true }, // Base64 image string
  pagetitle: { type: String, default: null },
  pageDescription: { type: String, default: null },
  keywords: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Blog', blogSchema);