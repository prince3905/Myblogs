const express = require('express');
const requireAuth = require('../../shared/middleware/auth.middleware');
const {
  listAdminPosts,
  getAdminPostById,
  createPost,
  updatePost,
  deletePost
} = require('./post.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/posts', listAdminPosts);
router.get('/posts/:id', getAdminPostById);
router.post('/posts', createPost);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);

module.exports = router;
