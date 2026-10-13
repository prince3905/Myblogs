const mongoose = require('mongoose');

const siteSeoConfigSchema = new mongoose.Schema(
  {
    // Homepage & Site-wide Branding SEO
    siteMetaTitle: {
      type: String,
      default: 'Sarkari Result 2026: Latest Sarkari Naukri, Online Form, Admit Card & Results',
      trim: true
    },
    siteMetaDescription: {
      type: String,
      default: 'Digital Home Sarkari Result: Get latest online forms, government jobs alerts 2026, admit cards, answer keys, syllabus, and results for 10th, 12th, and graduate.',
      trim: true
    },
    siteShortTailKeywords: {
      type: [String],
      default: () => [
        'Sarkari Result',
        'Sarkari Job 2026',
        'Sarkari Naukri',
        'Free Job Alert',
        'Online Form'
      ]
    },
    siteLongTailKeywords: {
      type: [String],
      default: () => [
        'latest sarkari job 2026 apply online',
        'sarkari result admit card 10th 12th pass',
        'up police ssc railway bharti notification'
      ]
    },

    // Dynamic Job Post Template Patterns
    jobTitlePattern: {
      type: String,
      default: 'Sarkari Result 2026: {title} – Apply Online Form',
      trim: true
    },
    jobMetaPattern: {
      type: String,
      default: 'Apply online for {title}. Check notification, eligibility, age limit, salary, and last date at Digital Home.',
      trim: true
    },
    defaultOgBanner: {
      type: String,
      default: '/og-sarkari-banner-1200x675.webp',
      trim: true
    },

    // Background Lifecycle Triggers
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

// Singleton helper: ensure single document exists and defaults are populated
siteSeoConfigSchema.statics.getOrCreate = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  } else {
    let modified = false;
    if (!config.siteMetaTitle) {
      config.siteMetaTitle = 'Sarkari Result 2026: Latest Sarkari Naukri, Online Form, Admit Card & Results';
      modified = true;
    }
    if (!config.siteMetaDescription) {
      config.siteMetaDescription = 'Digital Home Sarkari Result: Get latest online forms, government jobs alerts 2026, admit cards, answer keys, syllabus, and results for 10th, 12th, and graduate.';
      modified = true;
    }
    if (!Array.isArray(config.siteShortTailKeywords) || config.siteShortTailKeywords.length === 0) {
      config.siteShortTailKeywords = [
        'Sarkari Result',
        'Sarkari Job 2026',
        'Sarkari Naukri',
        'Free Job Alert',
        'Online Form'
      ];
      modified = true;
    }
    if (!Array.isArray(config.siteLongTailKeywords) || config.siteLongTailKeywords.length === 0) {
      config.siteLongTailKeywords = [
        'latest sarkari job 2026 apply online',
        'sarkari result admit card 10th 12th pass',
        'up police ssc railway bharti notification'
      ];
      modified = true;
    }
    if (modified) {
      await config.save();
    }
  }
  return config;
};

module.exports = mongoose.model('SiteSeoConfig', siteSeoConfigSchema);
