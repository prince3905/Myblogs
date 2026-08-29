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
    status: { type: String, enum: ['active', 'drafted', 'published', 'expired'], default: 'active' }
  },
  { timestamps: true }
);

const { resolveOfficialGovtPortal } = require('../../shared/utils/govtPortalMap');

liveAlertSchema.index({ status: 1, parsedPostDate: -1, createdAt: -1 });
liveAlertSchema.index({ parsedPostDate: -1, createdAt: -1 });

// Pre-save hook to guarantee 100% real government portal URLs in DB & auto-expire past-year alerts
liveAlertSchema.pre('save', function (next) {
  // Pre-save guard: Automatic expiration of past-year alerts
  if (this.title) {
    const titleLower = this.title.toLowerCase();
    const hasPastYear = /\b(2025|2024|2023|2022|2021|2020)\b/.test(titleLower);
    const hasCurrentOrFutureYear = /\b(2026|2027)\b/.test(titleLower);
    if (hasPastYear && !hasCurrentOrFutureYear) {
      this.status = 'expired';
    }
  }

  const isBadUrl = (url) => !url || typeof url !== 'string' || url.includes('sarkariresult') || url.includes('freejobalert') || url.includes('sarkari-result') || url.includes('sarkariexam') || url.includes('jobalerts') || url.includes('/job-alerts');

  const realGovtUrl = resolveOfficialGovtPortal(this.title, this.boardName, this.sourceUrl);

  if (isBadUrl(this.officialUrl)) {
    this.officialUrl = realGovtUrl;
  }
  if (isBadUrl(this.officialApplyUrl)) {
    this.officialApplyUrl = realGovtUrl;
  }
  if (isBadUrl(this.officialPdfUrl)) {
    this.officialPdfUrl = realGovtUrl;
  }

  // Sanitize source field — never store competitor brand name
  if (this.source && /sarkari/i.test(this.source)) {
    this.source = 'Official Portal';
  }

  if (this.detailsText) {
    // Replace all competitor URLs with real govt portal
    this.detailsText = this.detailsText
      .replace(/(?:https?:\/\/)?(?:www\.)?(?:sarkariresult|freejobalert|sarkari-result|sarkariexam|jobalerts)\.com[^\s,)\'\"]*​/gi, realGovtUrl)
      .replace(/https?:\/\/www\.digitalhomeblog\.in\/job-alerts\?alert=[^\s,)\'\"]*​/gi, realGovtUrl);
    // Replace text mentions
    this.detailsText = this.detailsText
      .replace(/sarkari\s*result\s*official\s*(?:website|app|portal|tools?)/gi, 'Digital Home Official Portal')
      .replace(/sarkari\s*result\s*(?:tools?|resizer|cropper|compressor)/gi, 'Student Utility Tools')
      .replace(/sarkari\s*result/gi, 'Digital Home Portal')
      .replace(/sarkariresult/gi, 'Digital Home')
      .replace(/www\.sarkariresult\.com/gi, 'www.digitalhomeblog.in')
      .replace(/sarkariresult\.com/gi, 'digitalhomeblog.in');
  }
  next();
});

module.exports = mongoose.model('LiveAlert', liveAlertSchema);
