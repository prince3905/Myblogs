const mongoose = require('mongoose');
const Comment = require('./comment.model');
const { notifyNewComment } = require('../../shared/services/mail.service');

async function addComment(req, res, next) {
  try {
    const { slug } = req.params;
    const { name, email, content } = req.body;

    const post = await mongoose.model('BlogPost').findOne({ slug, status: 'published' });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = await Comment.create({ post: post._id, name, email, content });
    notifyNewComment({ name, email, content, postTitle: post.title, postId: post._id }).catch(() => {});
    res.status(201).json({ success: true, comment });
  } catch (err) {
    next(err);
  }
}

async function getComments(req, res, next) {
  try {
    const { slug } = req.params;
    const post = await mongoose.model('BlogPost').findOne({ slug });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const all = await Comment.find({ post: post._id, approved: true }).sort({ createdAt: -1 }).lean();
    const topLevel = all.filter(c => !c.parent);
    const replies = all.filter(c => c.parent);
    const comments = topLevel.map(c => ({
      ...c,
      replies: replies.filter(r => String(r.parent) === String(c._id)),
    }));
    res.json({ success: true, comments });
  } catch (err) {
    next(err);
  }
}

async function listComments(req, res, next) {
  try {
    const all = await Comment.find().populate('post', 'title slug').sort({ createdAt: -1 }).lean();
    const topLevel = all.filter(c => !c.parent);
    const replies = all.filter(c => c.parent);
    const comments = topLevel.map(c => ({
      ...c,
      replies: replies.filter(r => String(r.parent) === String(c._id)),
    }));
    res.json({ success: true, comments });
  } catch (err) {
    next(err);
  }
}

async function approveComment(req, res, next) {
  try {
    const { id } = req.params;
    const comment = await Comment.findByIdAndUpdate(id, { approved: true }, { new: true });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    res.json({ success: true, comment });
  } catch (err) {
    next(err);
  }
}

async function replyToComment(req, res, next) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content required' });

    const parent = await Comment.findById(id);
    if (!parent) return res.status(404).json({ success: false, message: 'Comment not found' });

    const reply = await Comment.create({
      post: parent.post,
      parent: parent._id,
      name: 'Admin',
      email: 'admin@example.com',
      content,
      approved: true,
    });
    res.status(201).json({ success: true, reply });
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    const { id } = req.params;
    await Comment.deleteMany({ parent: id });
    await Comment.findByIdAndDelete(id);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { addComment, getComments, listComments, approveComment, replyToComment, deleteComment };
