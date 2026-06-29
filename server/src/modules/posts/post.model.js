const mongoose = require('mongoose');
const { calculateSeoScore } = require('../../shared/utils/seoAuditor');

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 3000 },
    content: { type: String, required: true },
    featuredImage: { type: String, trim: true, default: '' },
    category: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    seoTitle: { type: String, trim: true, default: '' },
    seoDescription: { type: String, trim: true, default: '' },
    seoKeywords: { type: [String], default: [] },
    seoScore: { type: Number, default: 0 },
    canonicalUrl: { type: String, trim: true, default: '' },
    publishedAt: { type: Date, default: null },
    readingTime: { type: Number, default: 1 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    sponsored: { type: Boolean, default: false },
    affiliateDisclosure: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5, default: null },
    author: { type: String, trim: true, default: 'Harry Prince' },
    videoUrl: { type: String, trim: true, default: '' },
    translations: {
      en: {
        title: { type: String, default: '' },
        content: { type: String, default: '' },
        excerpt: { type: String, default: '' },
        seoTitle: { type: String, default: '' },
        seoDescription: { type: String, default: '' }
      }
    }
  },
  { timestamps: true }
);

blogPostSchema.pre('save', function (next) {
  try {
    const post = this;
    // Ensure seoDescription is filled if not provided
    if (!post.seoDescription) {
      const contentClean = (post.content || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      post.seoDescription = contentClean.slice(0, 145) || post.excerpt || '';
    }
    // Calculate SEO score if not explicitly set
    if (!post.seoScore) {
      const audit = calculateSeoScore({
        title: post.title,
        content: post.content,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        slug: post.slug,
        tags: post.tags,
        excerpt: post.excerpt,
        canonicalUrl: post.canonicalUrl
      });
      post.seoScore = audit.score || 0;
    }
  } catch (err) {
    console.error('Error calculating seoScore in post pre-save hook:', err.message);
  }
  next();
});

blogPostSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
blogPostSchema.index({ status: 1, publishedAt: -1, createdAt: -1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);
