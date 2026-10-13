const express = require('express');
const router = express.Router();
const auth = require('../../shared/middleware/auth.middleware');
const {
  getGoogleSuggestions,
  generateAiMeta,
  getSeoConfig,
  updateSeoConfig,
  pushIndexing
} = require('./seo.controller');

// Require authentication for all admin SEO routes
router.use(auth);

// Autocomplete suggestions from Google Suggest
router.get('/seo-intelligence/suggestions', getGoogleSuggestions);

// AI Meta & FAQ generation
router.post('/seo-intelligence/generate-meta', generateAiMeta);

// Global Site SEO Config
router.get('/seo-intelligence/config', getSeoConfig);
router.put('/seo-intelligence/config', updateSeoConfig);

// Instant Indexing & Social Dispatch
router.post('/seo-intelligence/push-indexing', pushIndexing);

module.exports = router;
