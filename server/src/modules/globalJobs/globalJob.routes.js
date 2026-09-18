const express = require('express');
const router = express.Router();
const {
  getGlobalJobs,
  getGlobalJobStats,
  getGlobalJobById,
  triggerSupervisor,
  detectVisitorGeo
} = require('./globalJob.controller');

// Public endpoints
router.get('/', getGlobalJobs);
router.get('/stats', getGlobalJobStats);
router.get('/detect-geo', detectVisitorGeo);
router.get('/:id', getGlobalJobById);

// Trigger supervisor manually (for testing or cron webhook)
router.post('/trigger-supervisor', triggerSupervisor);

module.exports = router;
