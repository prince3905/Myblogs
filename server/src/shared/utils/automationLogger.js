const mongoose = require('mongoose');
require('../../modules/admin/automationLog.model');

const AutomationLog = mongoose.model('AutomationLog');

let lastCleanTime = 0;

/**
 * Global Non-Blocking Logger for System Automations
 * Includes 100% Automatic DB Protection (Max 3,000 logs cap + 30 days TTL auto-purge)
 */
async function logAutomation({ service, level = 'INFO', action, message, metadata = {} }) {
  try {
    const logEntry = new AutomationLog({
      service,
      level,
      action,
      message,
      metadata
    });
    await logEntry.save();
    console.log(`[AutomationLog][${service}][${level}] ${action}: ${message}`);

    // Auto-Clean DB Safety Guard: Keep maximum 3,000 log entries total (< 1.5MB DB storage)
    const now = Date.now();
    if (now - lastCleanTime > 3600000) { // Check once per hour
      lastCleanTime = now;
      const count = await AutomationLog.countDocuments();
      if (count > 3000) {
        const excess = count - 3000;
        const oldestLogs = await AutomationLog.find().sort({ createdAt: 1 }).limit(excess).select('_id').lean();
        const idsToDelete = oldestLogs.map(l => l._id);
        await AutomationLog.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`[AutomationLog Auto-Clean] Safely purged ${excess} oldest log entries to keep MongoDB light.`);
      }
    }
  } catch (err) {
    console.error(`[AutomationLog Error] Failed to record log:`, err.message);
  }
}

module.exports = { logAutomation };
