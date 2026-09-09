const mongoose = require('mongoose');

const McqSchema = new mongoose.Schema({
  questionId: { type: Number, required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }], // Array of 4 options
  correctOptionIndex: { type: Number, required: true, min: 0, max: 3 }, // 0-based index (0, 1, 2, 3)
  explanation: { type: String, required: true }, // Comprehensive Hindi/English explanation
  topicCategory: { type: String, default: 'General' }
}, { _id: false });

const CurrentAffairsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  dateString: {
    type: String, // e.g., '2026-09-09' for strict daily deduplication
    required: true,
    unique: true,
    index: true
  },
  publishDate: {
    type: Date,
    required: true,
    index: true
  },
  summary: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String, // Full long-form HTML content (1,500+ words)
    required: true
  },
  highlights: [{
    type: String // Key 8-10 bullet points for quick glance
  }],
  categories: [{
    type: String,
    trim: true
  }],
  staticGkList: [{
    topic: { type: String },
    details: { type: String }
  }],
  quizzes: [McqSchema], // 10 Daily Practice MCQs embedded
  seoTitle: {
    type: String,
    trim: true
  },
  seoDescription: {
    type: String,
    trim: true
  },
  canonicalUrl: {
    type: String,
    trim: true
  },
  focusKeyword: {
    type: String,
    default: 'Current Affairs'
  },
  featuredImage: {
    type: String,
    default: '/assets/images/current-affairs-banner.webp'
  },
  wordCount: {
    type: Number,
    default: 1500
  },
  readingTimeMinutes: {
    type: Number,
    default: 6
  },
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
    index: true
  },
  author: {
    type: String,
    default: 'Digital Home Editorial Team'
  }
}, {
  timestamps: true
});

// Pre-save validation & strict date clamping (Past lessons applied: No future date jumps)
CurrentAffairsSchema.pre('validate', function (next) {
  const now = new Date();
  
  // Date Clamping: If publishDate is in the future, clamp to now
  if (this.publishDate && this.publishDate > now) {
    this.publishDate = now;
  }
  if (!this.publishDate) {
    this.publishDate = now;
  }

  // Generate dateString if not present (YYYY-MM-DD in IST)
  if (!this.dateString) {
    const istDate = new Date(this.publishDate.getTime() + (5.5 * 60 * 60 * 1000));
    this.dateString = istDate.toISOString().split('T')[0];
  }

  // Generate Immutable slug if not present
  if (!this.slug && this.title) {
    const cleanDate = this.dateString.replace(/-/g, '-');
    const baseSlug = (this.title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    this.slug = `daily-current-affairs-${cleanDate}-${baseSlug}`.slice(0, 110).replace(/-+$/, '');
  }

  // Canonical URL
  if (!this.canonicalUrl && this.slug) {
    this.canonicalUrl = `https://www.digitalhomeblog.in/current-affairs/${this.slug}`;
  }

  // Word count calculation
  if (this.content) {
    const rawText = this.content.replace(/<[^>]*>/g, ' ').trim();
    this.wordCount = rawText.split(/\s+/).filter(Boolean).length;
    this.readingTimeMinutes = Math.max(2, Math.ceil(this.wordCount / 220));
  }

  next();
});

// Index for high-speed chronological queries
CurrentAffairsSchema.index({ publishDate: -1, status: 1 });
CurrentAffairsSchema.index({ dateString: -1 });

module.exports = mongoose.model('CurrentAffairs', CurrentAffairsSchema);
