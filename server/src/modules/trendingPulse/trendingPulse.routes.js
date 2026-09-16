const express = require('express');
const router = express.Router();
const { getTrendingPulseData, CATEGORY_FEEDS } = require('./trendingPulse.service');

/**
 * @route   GET /api/public/trending-pulse
 * @desc    Get real-time multi-category news cards (UPI, Tech, AI, Health, News)
 * @access  Public (Cached)
 */
router.get('/', async (req, res) => {
  try {
    const force = req.query.refresh === 'true';
    const { items, lastUpdated, fromCache } = await getTrendingPulseData(force);
    
    // Optional category filtering
    const requestedCat = req.query.category;
    let filtered = items;
    if (requestedCat && requestedCat !== 'all') {
      filtered = items.filter(item => item.categoryKey === requestedCat || item.categoryName.toLowerCase().includes(requestedCat.toLowerCase()));
    }

    res.json({
      success: true,
      count: filtered.length,
      lastUpdated,
      fromCache,
      categories: Object.entries(CATEGORY_FEEDS).map(([key, val]) => ({
        key,
        name: val.name,
        badge: val.badge,
        icon: val.icon,
        color: val.color
      })),
      data: filtered
    });
  } catch (err) {
    console.error('[TrendingPulse Route Error]:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending pulse',
      error: err.message
    });
  }
});

module.exports = router;
