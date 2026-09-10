const express = require('express');
const router = express.Router();
const requireAuth = require('../../shared/middleware/auth.middleware');
const { publishMultiCategoryPost, fetchTrendingTopicsForCategory } = require('./multiCategory.service');

// Status & schedule info
router.get('/status', (req, res) => {
  res.json({
    status: 'ACTIVE',
    schedule: [
      { slot: '10:30 AM IST', categories: ['Tech & Tutorials', 'AI & Web Tools'] },
      { slot: '02:30 PM IST', categories: ['Finance & Business'] },
      { slot: '06:30 PM IST', categories: ['Health & Wellness'] },
      { slot: '09:30 PM IST', categories: ['News & Trends'] }
    ]
  });
});

// Admin Manual Trigger
router.post('/run', requireAuth, async (req, res) => {
  try {
    const { category, topic } = req.body;
    const targetCat = category || 'Tech & Tutorials';
    console.log(`[MultiCategory Admin] Manual run requested for category: "${targetCat}", topic: "${topic || 'auto'}"`);

    const post = await publishMultiCategoryPost(targetCat, topic);
    res.json({
      success: true,
      message: `Successfully published article in "${post.category}"`,
      post: {
        id: post._id,
        title: post.title,
        slug: post.slug,
        category: post.category,
        url: `/blog/${post.category}/${post.slug}`,
        publishedAt: post.publishedAt
      }
    });
  } catch (err) {
    console.error('[MultiCategory Admin] Manual run failed:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
