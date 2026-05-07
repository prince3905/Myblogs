const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 320 },
    content: { type: String, required: true },
    featuredImage: { type: String, trim: true, default: '' },
    category: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    seoTitle: { type: String, trim: true, default: '' },
    seoDescription: { type: String, trim: true, default: '' },
    seoKeywords: { type: [String], default: [] },
    canonicalUrl: { type: String, trim: true, default: '' },
    publishedAt: { type: Date, default: null },
    readingTime: { type: Number, default: 1 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlogPost', blogPostSchema);
