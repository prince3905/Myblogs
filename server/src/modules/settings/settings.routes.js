const express = require('express');
const router = express.Router();
const { getSettings, updateSetting } = require('./settings.controller');
const auth = require('../../shared/middleware/auth.middleware');

router.use(auth);
router.get('/settings', getSettings);
router.put('/settings', updateSetting);

module.exports = router;
