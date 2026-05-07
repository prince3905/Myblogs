const express = require('express');
const router = express.Router();
const { addComment, getComments, listComments, approveComment, deleteComment } = require('./comment.controller');
const auth = require('../../shared/middleware/auth.middleware');

router.post('/posts/:slug/comments', addComment);
router.get('/posts/:slug/comments', getComments);

router.use(auth);
router.get('/admin/comments', listComments);
router.put('/admin/comments/:id/approve', approveComment);
router.delete('/admin/comments/:id', deleteComment);

module.exports = router;
