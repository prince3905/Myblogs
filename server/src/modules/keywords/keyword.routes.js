const express = require('express');
const requireAuth = require('../../shared/middleware/auth.middleware');
const { getKeywordHistory, deleteKeywordHistory, clearKeywordHistory } = require('../ai/keywordResearchService');
const { discoverTopics, exploreTopic, fetchSearchSuggestions, serpAnalyze } = require('../ai/topicDiscoveryService');

const router = express.Router();

// --- Keyword Research History ---

router.get('/admin/keywords', requireAuth, async (req, res) => {
  try {
    const { topic } = req.query;
    const data = await getKeywordHistory(topic || null);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Keyword fetch error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/admin/keywords/:topic', requireAuth, async (req, res) => {
  try {
    const data = await getKeywordHistory(req.params.topic);
    if (!data) {
      return res.status(404).json({ success: false, message: 'No keyword data found for this topic' });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Topic Discovery ---

router.get('/admin/topics/discover', requireAuth, async (req, res) => {
  try {
    const data = await discoverTopics();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Topic discovery error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/admin/topics/explore', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) {
      return res.status(400).json({ success: false, message: 'Query (q) must be at least 3 characters' });
    }
    const data = await exploreTopic(q);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Topic explore error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/admin/topics/suggest', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, message: 'Query (q) must be at least 2 characters' });
    }
    const suggestions = await fetchSearchSuggestions(q);
    res.json({ success: true, data: suggestions });
  } catch (err) {
    console.error('Topic suggest error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/admin/topics/serp-analyze', requireAuth, async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword || keyword.length < 2) {
      return res.status(400).json({ success: false, message: 'keyword is required (min 2 chars)' });
    }
    const data = serpAnalyze(keyword);
    res.json({ success: true, data });
  } catch (err) {
    console.error('SERP analyze error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Delete ---

router.delete('/admin/keywords/clear-all', requireAuth, async (req, res) => {
  try {
    const result = await clearKeywordHistory();
    res.json({ success: true, message: `Keyword history cleared (${result.deleted} deleted)` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/admin/keywords/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await deleteKeywordHistory(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Keyword research deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
