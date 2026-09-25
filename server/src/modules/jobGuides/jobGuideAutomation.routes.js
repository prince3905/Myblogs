const express = require('express');
const mongoose = require('mongoose');
const requireAuth = require('../../shared/middleware/auth.middleware');
const { publishAutomatedJobGuide } = require('./jobGuideAutomation.service');
const { discoverNextJobGuideTopic } = require('./jobGuideTopics.service');

const router = express.Router();

/**
 * GET /api/admin/job-guides/status
 * View real-time automation stats, today's count, and upcoming candidates
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const BlogPost = mongoose.model('BlogPost');
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayCount = await BlogPost.countDocuments({
      createdAt: { $gte: startOfToday },
      category: 'Sarkari Jobs & Exams',
      author: 'Global Careers Intelligence Desk',
      status: 'published'
    });

    const recentGuides = await BlogPost.find({
      category: 'Sarkari Jobs & Exams',
      author: 'Global Careers Intelligence Desk',
      status: 'published'
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title slug publishedAt tags views')
      .lean();

    const upcomingIndian = await discoverNextJobGuideTopic('indian');
    const upcomingGlobal = await discoverNextJobGuideTopic('global');

    res.json({
      success: true,
      data: {
        todayPublished: todayCount,
        dailyCap: 3,
        remainingToday: Math.max(0, 3 - todayCount),
        recentGuides,
        upcomingCandidates: {
          indian: upcomingIndian,
          global: upcomingGlobal
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/job-guides/trigger
 * Manually trigger on-demand publication of an Indian or Global guide
 */
router.post('/trigger', requireAuth, async (req, res) => {
  try {
    const { region = 'indian', topic = null } = req.body;
    const post = await publishAutomatedJobGuide(region, topic);

    if (!post) {
      return res.status(429).json({
        success: false,
        message: 'Daily publication cap (3 guides/day) already reached. To bypass, provide a manual topic.'
      });
    }

    res.json({
      success: true,
      message: `Successfully generated and published guide: "${post.title}"`,
      data: {
        id: post._id,
        title: post.title,
        slug: post.slug,
        url: `/blog/${post.slug}`
      }
    });
  } catch (err) {
    console.error('[JobGuide Route] Manual trigger error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
