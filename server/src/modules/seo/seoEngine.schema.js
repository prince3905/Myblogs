const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, default: '', trim: true },
    answer: { type: String, default: '', trim: true }
  },
  { _id: false }
);

const seoEngineSchema = new mongoose.Schema(
  {
    isAutoMode: { type: Boolean, default: true },
    shortTailKeywords: [{ type: String, trim: true }],
    longTailKeywords: [{ type: String, trim: true }],
    customMetaTitle: { type: String, default: '', trim: true },
    customMetaDescription: { type: String, default: '', trim: true },
    canonicalUrl: { type: String, default: '', trim: true },
    seoScore: { type: Number, default: 0, min: 0, max: 100 },
    faqs: [faqSchema]
  },
  { _id: false }
);

module.exports = { seoEngineSchema, faqSchema };
