const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema({
  heading: { type: String, required: true, trim: true },
  text: { type: String, required: true, trim: true },
  image: { type: String, required: true, trim: true }
});

const webStorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true },
    slides: { type: [slideSchema], required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

webStorySchema.index({ status: 1, createdAt: -1 });

// Web Story Google Indexing Auto-Notification Hook
webStorySchema.post('save', async function(doc) {
  if (doc.status === 'published') {
    try {
      const { notifyUrl } = require('../../shared/utils/google-indexing');
      const env = require('../../config/env');
      
      const storyUrl = `${env.siteUrl}/web-stories/${doc.slug}`;
      console.log(`[Google Indexing] Auto-pinging index for published Web Story: ${storyUrl}`);
      
      const result = await notifyUrl(storyUrl, 'URL_UPDATED');
      if (result.success) {
        console.log(`[Google Indexing] Successfully auto-indexed published Web Story: "${doc.title}"`);
      } else {
        console.warn(`[Google Indexing] Auto-indexing failed for Web Story "${doc.title}":`, result.error || result.message);
      }
    } catch (err) {
      console.error('[Google Indexing] Failed in WebStory post-save index notifier:', err.message);
    }
  }
});

module.exports = mongoose.model('WebStory', webStorySchema);
