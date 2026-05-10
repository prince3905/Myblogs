const ContactMessage = require('./contact.model');
const { notifyContactMessage } = require('../../shared/services/mail.service');

async function submitContact(req, res, next) {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    await ContactMessage.create({ name, email, subject, message });
    notifyContactMessage({ name, email, subject, message }).catch(() => {});
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    next(err);
  }
}

async function listMessages(req, res, next) {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitContact, listMessages };
