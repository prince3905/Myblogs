const express = require('express');
const router = express.Router();
const auth = require('../../shared/middleware/auth.middleware');
const {
  getGoogleSuggestions,
  generateAiMeta,
  getSeoConfig,
  updateSeoConfig,
  pushIndexing,
  pingHomepage
} = require('./seo.controller');

// Require authentication for all admin SEO intelligence routes
// Autocomplete suggestions from Google Suggest
router.get('/seo-intelligence/suggestions', auth, getGoogleSuggestions);

// AI Meta & FAQ generation
router.post('/seo-intelligence/generate-meta', auth, generateAiMeta);

// Global Site SEO Config
router.get('/seo-intelligence/config', auth, getSeoConfig);
router.put('/seo-intelligence/config', auth, updateSeoConfig);

// Instant Indexing & Social Dispatch
router.post('/seo-intelligence/push-indexing', auth, pushIndexing);
router.post('/seo-intelligence/ping-homepage', auth, pingHomepage);

module.exports = router;
