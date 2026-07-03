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

    // Ensure preschool educational games promotion is appended
    if (post.content && !post.content.includes('games-promo-block')) {
      const gamesPromo = `\n<div class="games-promo-block" style="margin: 30px 0; padding: 24px; border-radius: 16px; border: 1px solid #e5e7eb; background: linear-gradient(135deg, #fef08a 0%, #fef9c3 100%); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); text-align: left; position: relative; overflow: hidden;">
  <div style="display: flex; align-items: flex-start; gap: 16px;">
    <div style="font-size: 32px; line-height: 1;">🎮</div>
    <div>
      <h3 style="margin: 0 0 8px 0; color: #854d0e; font-size: 1.25rem; font-weight: 800; border: none; padding: 0;">Preschool Learning & Brain Booster Games for Kids!</h3>
      <p style="margin: 0 0 16px 0; color: #a16207; font-size: 0.95rem; line-height: 1.6; font-weight: 500;">
        Apne bacho ki concentration, memory, aur problem-solving skills ko boost karne ke liye humare <strong>100% Free & Ad-Free educational games</strong> ko try karein. Kids-friendly UI ke sath banaya gaya jo learning ko fun banata hai!
      </p>
      <a href="/games" style="display: inline-block; padding: 10px 20px; background: #ca8a04; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.85rem; box-shadow: 0 4px 6px -1px rgba(133, 77, 14, 0.2);">Play Free Brain Booster Games Now 🚀</a>
    </div>
  </div>
</div>\n`;

      // Insert before the brand authority block if it exists
      const brandIndex = post.content.indexOf("<div class='brand-authority-block'");
      if (brandIndex !== -1) {
        post.content = post.content.slice(0, brandIndex) + gamesPromo + '\n' + post.content.slice(brandIndex);
      } else {
        post.content += '\n' + gamesPromo;
      }
    }

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
