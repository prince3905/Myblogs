const mongoose = require('mongoose');
require('../../modules/admin/automationLog.model');

const AutomationLog = mongoose.model('AutomationLog');

/**
 * Global Non-Blocking Logger for System Automations
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
  } catch (err) {
    console.error(`[AutomationLog Error] Failed to record log:`, err.message);
  }
}

module.exports = { logAutomation };
