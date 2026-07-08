const Settings = require('./settings.model');

async function getSettings(req, res) {
  try {
    const settings = await Settings.find({});
    const config = {};
    settings.forEach(s => {
      config[s.key] = s.value;
    });

    // Fallback default value from environment variables if not created in DB yet
    if (config.disableAutopilot === undefined) {
      config.disableAutopilot = process.env.DISABLE_AUTOPILOT === 'true';
    }

    res.json({ success: true, settings: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function updateSetting(req, res) {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ success: false, message: 'Key is required' });
    }

    await Settings.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: `Setting "${key}" updated successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getSettings, updateSetting };
