const mongoose = require('mongoose');

const keywordResearchSchema = new mongoose.Schema({
  topic: { type: String, required: true, unique: true },
  category: { type: String, default: '' },
  keywords: [{
    keyword: String,
    type: { type: String, enum: ['short-tail', 'mid-tail', 'long-tail', 'lsi', 'question-based'] },
    searchVolume: Number,
    kd: Number,
    intent: { type: String, enum: ['informational', 'commercial', 'transactional', 'navigational'] },
    trend: { type: String, enum: ['rising', 'stable', 'declining', 'insufficient_data'] },
    trendScore: { type: Number, default: 0 },
    placement: String,
  }],
  filteredKeywords: [String],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('KeywordResearch', keywordResearchSchema);
