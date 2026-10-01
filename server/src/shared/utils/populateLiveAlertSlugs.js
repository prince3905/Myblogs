/**
 * Automatic Slug Population Utility for Live Alerts
 * Ensures all existing and newly imported alerts have clean, unique, hyphenated slugs.
 */

const { sanitizeJobSlug } = require('./jobSeoOptimizer');

async function ensureLiveAlertSlugs() {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return;
    }
    const LiveAlert = require('../../modules/liveAlerts/liveAlert.model');

    const alertsWithoutSlug = await LiveAlert.find({
      $or: [
        { slug: { $exists: false } },
        { slug: '' },
        { slug: null }
      ]
    })
      .select('_id title boardName')
      .limit(1500)
      .lean();

    if (!alertsWithoutSlug || alertsWithoutSlug.length === 0) {
      return;
    }

    console.log(`[SEO Upgrade] Generating clean, sanitized slugs for ${alertsWithoutSlug.length} alerts...`);

    const usedSlugs = new Set();
    const existing = await LiveAlert.find({ slug: { $exists: true, $ne: '' } }).select('slug').lean();
    existing.forEach(e => { if (e.slug) usedSlugs.add(e.slug); });

    const bulkOps = [];
    for (const alert of alertsWithoutSlug) {
      let slug = sanitizeJobSlug(alert.title, alert.boardName, alert._id.toString());
      if (usedSlugs.has(slug)) {
        slug = `${slug}-${alert._id.toString().slice(-4)}`;
      }
      usedSlugs.add(slug);
      bulkOps.push({
        updateOne: {
          filter: { _id: alert._id },
          update: { $set: { slug } }
        }
      });
    }

    if (bulkOps.length > 0) {
      await LiveAlert.bulkWrite(bulkOps);
      console.log(`[SEO Upgrade] ✅ Successfully updated ${bulkOps.length} live alerts with sanitized slugs.`);
    }
  } catch (err) {
    console.warn('[SEO Upgrade] ensureLiveAlertSlugs notice:', err.message);
  }
}

module.exports = { ensureLiveAlertSlugs };
