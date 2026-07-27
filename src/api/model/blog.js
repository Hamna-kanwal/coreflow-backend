const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true }, // CKEditor content
  image: { type: String, required: true }, // Base64 image string
  pagetitle: { type: String, default: null },
  pageDescription: { type: String, default: null },
  keywords: { type: String, default: null },
  tag: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Blog', blogSchema);
