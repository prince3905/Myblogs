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

router.post('/pagespeed-audit', async (req, res, next) => {
  try {
    const { runPageSpeedAudit } = require('../../shared/services/pagespeedService');
    const { targetUrl, strategy } = req.body || {};
    const auditResult = await runPageSpeedAudit(targetUrl || 'https://www.digitalhomeblog.in', strategy || 'desktop');
    res.json(auditResult);
  } catch (err) {
    next(err);
  }
});

router.post('/pagespeed-autofix', async (req, res, next) => {
  try {
    const { runPageSpeedAutoFix } = require('../../shared/services/pagespeedService');
    const { targetUrl, strategy } = req.body || {};
    const fixResult = await runPageSpeedAutoFix(targetUrl || 'https://www.digitalhomeblog.in', strategy || 'desktop');
    res.json(fixResult);
  } catch (err) {
    next(err);
  }
});

// System Automation Logs Endpoints
router.get('/automation-logs', async (req, res, next) => {
  try {
    require('./automationLog.model');
    const AutomationLog = mongoose.model('AutomationLog');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.service && req.query.service !== 'ALL') {
      query.service = req.query.service;
    }
    if (req.query.level && req.query.level !== 'ALL') {
      query.level = req.query.level;
    }
    if (req.query.search) {
      query.$or = [
        { action: new RegExp(req.query.search.trim(), 'i') },
        { message: new RegExp(req.query.search.trim(), 'i') }
      ];
    }

    const [logs, total] = await Promise.all([
      AutomationLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AutomationLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

router.all(['/pagespeed-audit/trigger', '/pagespeed/trigger'], async (req, res, next) => {
  try {
    const { runDailyPageSpeedAudit } = require('../../shared/services/pageSpeedMonitorCron');
    // Run audit asynchronously so admin UI gets immediate confirmation
    runDailyPageSpeedAudit().catch(err => console.error('[Admin PageSpeed Trigger] Error:', err.message));
    res.json({ success: true, message: 'PageSpeed 4-Page Deep Audit initiated! Results will appear in Automation Logs shortly.' });
  } catch (err) {
    next(err);
  }
});

router.delete('/automation-logs/clear', async (req, res, next) => {
  try {
    require('./automationLog.model');
    const AutomationLog = mongoose.model('AutomationLog');
    await AutomationLog.deleteMany({});
    res.json({ success: true, message: 'Automation logs successfully cleared!' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
