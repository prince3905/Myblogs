const express = require('express');
const requireAuth = require('../../shared/middleware/auth.middleware');
const { generateAIContent, convertYoutubeToBlog } = require('./ai.controller');

const router = express.Router();

router.post('/ai/generate', requireAuth, generateAIContent);
router.post('/ai/convert-youtube', requireAuth, convertYoutubeToBlog);

module.exports = router;
