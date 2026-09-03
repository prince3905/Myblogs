const axios = require('axios');
const { logAutomation } = require('../utils/automationLogger');

/**
 * High-Speed Broadcast Service for OneSignal Web Push Notifications
 * @param {Object} post - Published Blog Post or Live Alert
 */
async function sendPushNotification(post) {
  const appId = process.env.ONESIGNAL_APP_ID || '1be67f5d-ed1b-4f97-acf8-2f711447cc10';
  const apiKey = process.env.ONESIGNAL_API_KEY;

  if (!appId || !apiKey) {
    return { success: false, message: 'OneSignal credentials not configured in environment.' };
  }

  try {
    const title = (post.title || '').replace(/\s*\|\s*(Digital Home|Sarkari Result)\s*$/i, '').trim();
    const message = post.excerpt || 'New Sarkari Job alert & admit card released. Click to check full details & direct apply link.';
    const catSlug = (post.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'sarkari-jobs-exams';
    const postUrl = `https://www.digitalhomeblog.in/blog/${catSlug}/${post.slug}`;
    const imageUrl = post.featuredImage || 'https://www.digitalhomeblog.in/logo.webp';

    const payload = {
      app_id: appId,
      included_segments: ['All', 'Subscribed Users', 'Active Users'],
      headings: { en: `🔔 ${title.slice(0, 60)}` },
      contents: { en: message.slice(0, 120) },
      url: postUrl,
      big_picture: imageUrl,
      chrome_web_image: imageUrl,
      data: { postId: post._id, slug: post.slug, category: post.category }
    };

    const response = await axios.post('https://onesignal.com/api/v1/notifications', payload, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Key ${apiKey}`
      },
      timeout: 10000
    });

    const recipients = response.data?.recipients || 0;
    console.log(`[OneSignal Push] Broadcast sent for "${title}" (Recipients: ${recipients})`);

    // Log to Central Admin Automation Logs DB
    logAutomation({
      service: 'PUSH_NOTIFICATION',
      level: 'INFO',
      action: 'BROADCAST_SENT',
      message: `Web push notification broadcasted for "${title}" (Recipients: ${recipients})`,
      metadata: {
        postId: post._id,
        slug: post.slug,
        title: title,
        recipients: recipients,
        notificationId: response.data?.id
      }
    }).catch(() => {});

    return { success: true, recipients, id: response.data?.id };
  } catch (err) {
    const errorDetail = err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : (err.response?.data?.message || err.message);
    console.warn('[OneSignal Push] Notice:', errorDetail);

    // Log Warning to Central Admin Automation Logs DB
    logAutomation({
      service: 'PUSH_NOTIFICATION',
      level: 'WARN',
      action: 'BROADCAST_FAILED',
      message: `Web push broadcast warning for "${post.title}": ${errorDetail}`,
      metadata: {
        postId: post._id,
        slug: post.slug,
        error: errorDetail
      }
    }).catch(() => {});

    return { success: false, error: errorDetail };
  }
}

module.exports = { sendPushNotification };
