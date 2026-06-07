const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const CREDENTIALS_PATH = path.resolve(__dirname, '../../config/google-indexing-credentials.json');

function signJwt(payload, privateKey) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const base64UrlEncode = (str) => {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${headerPart}.${payloadPart}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(privateKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signature}`;
}

async function getAccessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const assertion = signJwt(payload, credentials.private_key);

  const response = await axios.post(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000
    }
  );

  return response.data.access_token;
}

/**
 * Notify Google Indexing API that a URL has been updated, created, or deleted.
 * @param {string} url - The canonical URL of the blog post
 * @param {'URL_UPDATED'|'URL_DELETED'} type - Notification type
 */
async function notifyUrl(url, type = 'URL_UPDATED') {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.warn(`[Google Indexing] Warning: Service account file not found at: ${CREDENTIALS_PATH}. Instant indexing will be skipped.`);
    return null;
  }

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const token = await getAccessToken(credentials);

    const response = await axios.post(
      'https://indexing.googleapis.com/v1/urlNotifications:publish',
      {
        url,
        type
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000
      }
    );

    console.log(`[Google Indexing] Successfully sent API notice: ${url} -> ${type}`);
    return response.data;
  } catch (error) {
    console.error(
      `[Google Indexing] API error notification failed for ${url}:`,
      error.response?.data || error.message
    );
    return null;
  }
}

module.exports = { notifyUrl };
