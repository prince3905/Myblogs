const mongoose = require('mongoose');

const liveAlertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    boardName: { type: String, trim: true, default: 'Official Board' },
    lastDate: { type: String, trim: true, default: 'N/A' },
    postDate: { type: String, trim: true, default: '' },
    parsedPostDate: { type: Date },
    sourceUrl: { type: String, required: true, unique: true, trim: true },
    officialUrl: { type: String, trim: true, default: '' },
    officialPdfUrl: { type: String, trim: true, default: '' },
    officialApplyUrl: { type: String, trim: true, default: '' },
    source: { type: String, default: 'Sarkari Feed' },
    state: { type: String, default: 'Central/All India', trim: true },
    category: { type: String, default: 'Latest Job', trim: true },
    detailsText: { type: String, default: '', trim: true },
    status: { type: String, enum: ['active', 'drafted'], default: 'active' }
  },
  { timestamps: true }
);

liveAlertSchema.index({ status: 1, parsedPostDate: -1, createdAt: -1 });
liveAlertSchema.index({ parsedPostDate: -1, createdAt: -1 });

module.exports = mongoose.model('LiveAlert', liveAlertSchema);
