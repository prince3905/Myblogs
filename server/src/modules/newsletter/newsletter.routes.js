const express = require('express');
const router = express.Router();
const { subscribe, listSubscribers } = require('./newsletter.controller');
const auth = require('../../shared/middleware/auth.middleware');

router.post('/newsletter/subscribe', subscribe);

router.get('/admin/subscribers', auth, listSubscribers);

module.exports = router;
