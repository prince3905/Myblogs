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

function getCredentials() {
  const envCreds = process.env.GOOGLE_INDEXING_CREDENTIALS;
  if (envCreds) {
    try {
      if (envCreds.trim().startsWith('{')) {
        return JSON.parse(envCreds);
      } else {
        const resolvedPath = path.resolve(envCreds);
        if (fs.existsSync(resolvedPath)) {
          return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        }
      }
    } catch (err) {
      console.error('[Google Indexing] Failed to parse env credentials:', err.message);
    }
  }

  // Fallback to local JSON file
  if (fs.existsSync(CREDENTIALS_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    } catch (err) {
      console.error('[Google Indexing] Failed to parse credentials file:', err.message);
    }
  }

  return null;
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
  const credentials = getCredentials();
  if (!credentials) {
    console.warn(`[Google Indexing] Warning: Google Indexing credentials not configured in environment or JSON file. Indexing notice skipped.`);
    return { success: false, message: 'Google Indexing credentials not configured.' };
  }

  try {
    const token = await getAccessToken(credentials);

    const response = await axios.post(
      'https://indexing.googleapis.com/v3/urlNotifications:publish',
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
    return { success: true, data: response.data };
  } catch (error) {
    console.error(
      `[Google Indexing] API error notification failed for ${url}:`,
      error.response?.data || error.message
    );
    return { success: false, error: error.response?.data || error.message };
  }
}

module.exports = { notifyUrl };
