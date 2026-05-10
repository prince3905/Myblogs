const Subscriber = require('./subscriber.model');
const { sendWelcomeEmail } = require('../../shared/services/mail.service');

async function subscribe(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    
    await Subscriber.create({ email });
    sendWelcomeEmail({ email }).catch(() => {});
    res.json({ success: true, message: 'Subscribed successfully' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Already subscribed' });
    next(err);
  }
}

async function listSubscribers(req, res, next) {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json({ success: true, subscribers });
  } catch (err) {
    next(err);
  }
}

module.exports = { subscribe, listSubscribers };
