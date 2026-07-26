const mongoose = require('mongoose');

const automationLogSchema = new mongoose.Schema({
  service: {
    type: String,
    enum: ['SCRAPER', 'TELEGRAM', 'WHATSAPP', 'SEO_INDEXING', 'SYSTEM_CRON', 'WEB_STORY', 'AI_WRITER'],
    required: true,
    index: true
  },
  level: {
    type: String,
    enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'],
    default: 'INFO',
    index: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // Automatically purge logs older than 30 days (30 * 86400s)
  }
}, { timestamps: true });

module.exports = mongoose.model('AutomationLog', automationLogSchema);
