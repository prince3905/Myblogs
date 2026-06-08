const mongoose = require('mongoose');

const liveAlertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    boardName: { type: String, trim: true, default: 'Official Board' },
    lastDate: { type: String, trim: true, default: 'N/A' },
    sourceUrl: { type: String, required: true, unique: true, trim: true },
    officialUrl: { type: String, trim: true, default: '' },
    source: { type: String, default: 'Sarkari Feed' },
    status: { type: String, enum: ['active', 'drafted'], default: 'active' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LiveAlert', liveAlertSchema);
