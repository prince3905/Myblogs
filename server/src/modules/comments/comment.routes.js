const express = require('express');
const router = express.Router();
const { addComment, getComments, listComments, approveComment, replyToComment, deleteComment } = require('./comment.controller');
const auth = require('../../shared/middleware/auth.middleware');

router.post('/posts/:slug/comments', addComment);
router.get('/posts/:slug/comments', getComments);

// Protect only admin routes
router.get('/admin/comments', auth, listComments);
router.put('/admin/comments/:id/approve', auth, approveComment);
router.post('/admin/comments/:id/reply', auth, replyToComment);
router.delete('/admin/comments/:id', auth, deleteComment);

module.exports = router;
