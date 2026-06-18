const express = require('express');
const router = express.Router();
const { listPublishedPosts, getPostBySlug, listCategories, siteMeta, likePost, searchPosts } = require('./post.controller');
const { getAlerts } = require('../liveAlerts/liveAlert.controller');

router.get('/posts', listPublishedPosts);
router.get('/posts/search', searchPosts);
router.get('/posts/slug/:slug', getPostBySlug);
router.get('/categories', listCategories);
router.get('/meta/site', siteMeta);
router.post('/posts/:slug/like', likePost);

// Public Live Alerts endpoint
router.get('/public/live-alerts', getAlerts);

module.exports = router;
