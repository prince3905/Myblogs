const express = require('express');
const requireAuth = require('../../shared/middleware/auth.middleware');
const { searchPexelsImage } = require('./pexels.controller');

const router = express.Router();

router.post('/pexels/search', requireAuth, searchPexelsImage);

module.exports = router;