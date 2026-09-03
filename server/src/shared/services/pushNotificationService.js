const axios = require('axios');

/**
 * High-Speed Broadcast Service for OneSignal Web Push Notifications
 * @param {Object} post - Published Blog Post or Live Alert
 */
async function sendPushNotification(post) {
  const appId = process.env.ONESIGNAL_APP_ID;
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
        'Authorization': `Basic ${apiKey}`
      },
      timeout: 10000
    });

    console.log(`[OneSignal Push] Broadcast sent for "${title}" (Recipients: ${response.data?.recipients || 0})`);
    return { success: true, recipients: response.data?.recipients };
  } catch (err) {
    console.warn('[OneSignal Push] Notice:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendPushNotification };
