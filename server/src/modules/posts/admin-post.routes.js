const express = require('express');
const requireAuth = require('../../shared/middleware/auth.middleware');
const {
  listAdminPosts,
  getAdminPostById,
  createPost,
  updatePost,
  deletePost,
  pingPostIndexing,
  sharePostToTelegram
} = require('./post.controller');

const {
  listAdminWebStories,
  getAdminWebStoryById,
  updateAdminWebStory,
  deleteAdminWebStory,
  pingWebStoryIndexing
} = require('./webstory.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/posts', listAdminPosts);
router.get('/posts/:id', getAdminPostById);
router.post('/posts', createPost);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);
router.post('/posts/:id/index-ping', pingPostIndexing);
router.post('/posts/:id/telegram-share', sharePostToTelegram);

// Admin Web Stories Management Endpoints
router.get('/web-stories', listAdminWebStories);
router.get('/web-stories/:id', getAdminWebStoryById);
router.put('/web-stories/:id', updateAdminWebStory);
router.delete('/web-stories/:id', deleteAdminWebStory);
router.post('/web-stories/:id/index-ping', pingWebStoryIndexing);

module.exports = router;
