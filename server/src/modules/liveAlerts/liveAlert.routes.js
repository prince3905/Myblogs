const express = require('express');
const requireAuth = require('../../shared/middleware/auth.middleware');
const { getAlerts, getAlertById, triggerScrape, draftPostFromAlert } = require('./liveAlert.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/live-alerts', getAlerts);
router.get('/live-alerts/:id', getAlertById);
router.post('/live-alerts/trigger', triggerScrape);
router.post('/live-alerts/:id/draft', draftPostFromAlert);

module.exports = router;
