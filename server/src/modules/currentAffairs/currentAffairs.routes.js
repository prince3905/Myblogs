const express = require('express');
const router = express.Router();
const currentAffairsController = require('./currentAffairs.controller');
const requireAuth = require('../../shared/middleware/auth.middleware');

// Public Current Affairs Routes
router.get('/', currentAffairsController.getDailyCurrentAffairsList);
router.get('/quiz/today', currentAffairsController.getTodayQuiz);
router.post('/quiz/submit', currentAffairsController.submitQuizAttempt);
router.get('/:slug', currentAffairsController.getCurrentAffairsBySlug);

// Admin Routes (Manual Trigger & Auto Generator)
router.post('/admin/generate', requireAuth, currentAffairsController.adminGenerateDaily);

module.exports = router;
