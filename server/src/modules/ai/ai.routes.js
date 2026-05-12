const express = require('express');
const requireAuth = require('../../shared/middleware/auth.middleware');
const { generateAIContent } = require('./ai.controller');

const router = express.Router();

router.post('/ai/generate', requireAuth, generateAIContent);

module.exports = router;
