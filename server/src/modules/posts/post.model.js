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
    likes: { type: Number, default: 0 },
    sponsored: { type: Boolean, default: false },
    affiliateDisclosure: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5, default: null },
    videoUrl: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

blogPostSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

module.exports = mongoose.model('BlogPost', blogPostSchema);
