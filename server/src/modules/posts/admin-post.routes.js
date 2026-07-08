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

const router = express.Router();

router.use(requireAuth);
router.get('/posts', listAdminPosts);
router.get('/posts/:id', getAdminPostById);
router.post('/posts', createPost);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);
router.post('/posts/:id/index-ping', pingPostIndexing);
router.post('/posts/:id/telegram-share', sharePostToTelegram);

module.exports = router;
