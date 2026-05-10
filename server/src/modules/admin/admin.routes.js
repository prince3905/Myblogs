const express = require('express');
const mongoose = require('mongoose');
const requireAuth = require('../../shared/middleware/auth.middleware');
const BlogPost = require('../posts/post.model');
const Comment = require('../comments/comment.model');
const ContactMessage = require('../contact/contact.model');
const Subscriber = require('../newsletter/subscriber.model');

const router = express.Router();
router.use(requireAuth);

router.get('/activity', async (req, res, next) => {
  try {
    const [pendingComments, recentComments, recentMessages, recentSubscribers] = await Promise.all([
      Comment.countDocuments({ approved: false }),
      Comment.find().populate('post', 'title slug').sort({ createdAt: -1 }).limit(5).lean(),
      ContactMessage.find().sort({ createdAt: -1 }).limit(5).lean(),
      Subscriber.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    res.json({
      pendingComments,
      recentComments,
      recentMessages,
      recentSubscribers,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/analytics', async (req, res, next) => {
  try {
    const [totalViews, topPosts, totalPosts] = await Promise.all([
      BlogPost.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      BlogPost.find({ status: 'published' }).sort({ views: -1 }).limit(5).select('title slug views likes').lean(),
      BlogPost.countDocuments(),
    ]);

    res.json({
      totalViews: totalViews[0]?.total || 0,
      totalPosts,
      topPosts,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
