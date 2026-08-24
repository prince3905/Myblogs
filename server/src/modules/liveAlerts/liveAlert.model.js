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
    status: { type: String, enum: ['active', 'drafted', 'published'], default: 'active' }
  },
  { timestamps: true }
);

liveAlertSchema.index({ status: 1, parsedPostDate: -1, createdAt: -1 });
liveAlertSchema.index({ parsedPostDate: -1, createdAt: -1 });

// Pre-save hook to guarantee 100% zero sarkariresult.com links in DB
liveAlertSchema.pre('save', function (next) {
  const isSarkari = (url) => url && typeof url === 'string' && (url.includes('sarkariresult') || url.includes('freejobalert') || url.includes('sarkari-result'));

  const safeUrl = `https://www.digitalhomeblog.in/job-alerts?alert=${this._id}`;

  if (isSarkari(this.sourceUrl)) {
    this.sourceUrl = safeUrl;
  }
  if (isSarkari(this.officialUrl)) {
    this.officialUrl = this.sourceUrl;
  }
  if (isSarkari(this.officialApplyUrl)) {
    this.officialApplyUrl = this.sourceUrl;
  }
  if (isSarkari(this.officialPdfUrl)) {
    this.officialPdfUrl = this.sourceUrl;
  }
  if (this.detailsText && isSarkari(this.detailsText)) {
    this.detailsText = this.detailsText.replace(/https?:\/\/(?:www\.)?(?:sarkariresult|freejobalert)\.com[^\s,)\'\"]*/gi, safeUrl);
  }
  next();
});

module.exports = mongoose.model('LiveAlert', liveAlertSchema);
