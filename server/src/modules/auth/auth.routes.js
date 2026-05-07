const express = require('express');
const { login, me } = require('./auth.controller');
const requireAuth = require('../../shared/middleware/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', requireAuth, me);

module.exports = router;
