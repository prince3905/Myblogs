const mongoose = require('mongoose');

const siteSeoConfigSchema = new mongoose.Schema(
  {
    jobTitlePattern: {
      type: String,
      default: 'Sarkari Result 2026: {title} – Apply Online Form'
    },
    jobMetaPattern: {
      type: String,
      default: 'Apply online for {title}. Check notification, eligibility, age limit, salary, and last date at Digital Home.'
    },
    defaultOgBanner: {
      type: String,
      default: '/og-sarkari-banner-1200x675.webp'
    },
    autoExtractKeywords: {
      type: Boolean,
      default: true
    },
    autoPingIndexingApi: {
      type: Boolean,
      default: true
    },
    autoDispatchTelegram: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Singleton helper: ensure single document exists
siteSeoConfigSchema.statics.getOrCreate = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('SiteSeoConfig', siteSeoConfigSchema);
