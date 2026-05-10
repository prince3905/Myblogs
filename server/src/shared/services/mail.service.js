const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@digitalhome.blog';

function sendMail({ to, subject, html }) {
  if (!process.env.SMTP_USER) {
    console.log(`[mail] Skipped (no SMTP_USER): ${subject} -> ${to}`);
    return Promise.resolve();
  }
  return transporter.sendMail({ from: fromEmail, to, subject, html });
}

function notifyNewComment({ name, email, content, postTitle, postId }) {
  return sendMail({
    to: adminEmail,
    subject: `New Comment on "${postTitle}"`,
    html: `<div style="font-family:sans-serif;max-width:600px">
      <h2>New Comment</h2>
      <p><strong>Author:</strong> ${name} (${email})</p>
      <p><strong>Post:</strong> ${postTitle}</p>
      <p><strong>Comment:</strong> ${content}</p>
      <p><a href="${process.env.SITE_URL || 'http://localhost:5173'}/admin/comments" style="background:#4F46E5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Moderate →</a></p>
    </div>`,
  });
}

function notifyContactMessage({ name, email, subject, message }) {
  return sendMail({
    to: adminEmail,
    subject: `New Contact Message: ${subject}`,
    html: `<div style="font-family:sans-serif;max-width:600px">
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong> ${message}</p>
    </div>`,
  });
}

function sendWelcomeEmail({ email }) {
  return sendMail({
    to: email,
    subject: 'Welcome to Digital Home!',
    html: `<div style="font-family:sans-serif;max-width:600px">
      <h2>Welcome to Digital Home! 🎉</h2>
      <p>Thank you for subscribing to our newsletter.</p>
      <p>You'll now receive the latest insights on AI, web development, and more straight to your inbox.</p>
      <p>Stay curious,<br/>The Digital Home Team</p>
    </div>`,
  });
}

module.exports = { notifyNewComment, notifyContactMessage, sendWelcomeEmail };
