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

/**
 * Instant IndexNow Auto-Ping (Notifies Bing, Yandex, Seznam, Naver & DuckDuckGo in 1 second)
 */
async function notifyIndexNow(url) {
  const indexNowKey = process.env.INDEXNOW_KEY || '8f7e2a9b3c4d5e6f7a8b9c0d1e2f3a4b';
  const host = 'www.digitalhomeblog.in';
  const keyLocation = `https://${host}/${indexNowKey}.txt`;

  try {
    const payload = {
      host: host,
      key: indexNowKey,
      keyLocation: keyLocation,
      urlList: [url]
    };

    console.log(`[IndexNow Protocol] Instant auto-pinging URL: ${url}`);
    const response = await axios.post('https://api.indexnow.org/indexnow', payload, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      timeout: 10000
    });

    console.log(`[IndexNow Protocol] Ping success for ${url} (Status: ${response.status})`);
    return { success: true, status: response.status };
  } catch (err) {
    console.warn(`[IndexNow Protocol] Notice for ${url}:`, err.response?.data || err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Auto-Ping Google & Bing Search Engines with updated Sitemap
 */
async function pingSitemapEngines() {
  const sitemapUrl = 'https://www.digitalhomeblog.in/sitemap.xml';
  try {
    console.log(`[Sitemap Ping] Auto-notifying Google and Bing of sitemap updates...`);
    await Promise.allSettled([
      axios.get(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, { timeout: 8000 }),
      axios.get(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, { timeout: 8000 })
    ]);
    console.log(`[Sitemap Ping] Search engine pings dispatched successfully.`);
  } catch (err) {
    console.warn(`[Sitemap Ping] Notice:`, err.message);
  }
}

/**
 * Instant Batch IndexNow Auto-Ping (Notifies Bing, Yandex, Seznam for up to 1,000 URLs in 1 call)
 */
async function notifyBatchIndexNow(urlList = []) {
  if (!urlList || urlList.length === 0) return { success: true, count: 0 };
  const indexNowKey = process.env.INDEXNOW_KEY || '8f7e2a9b3c4d5e6f7a8b9c0d1e2f3a4b';
  const host = 'www.digitalhomeblog.in';
  const keyLocation = `https://${host}/${indexNowKey}.txt`;

  try {
    const payload = {
      host: host,
      key: indexNowKey,
      keyLocation: keyLocation,
      urlList: urlList.slice(0, 1000)
    };

    console.log(`[IndexNow Batch] Auto-pinging batch of ${payload.urlList.length} URLs...`);
    const response = await axios.post('https://api.indexnow.org/indexnow', payload, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      timeout: 15000
    });

    console.log(`[IndexNow Batch] Batch ping success (Status: ${response.status}, Count: ${payload.urlList.length})`);
    return { success: true, status: response.status, count: payload.urlList.length };
  } catch (err) {
    console.warn('[IndexNow Batch] Notice:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Universal Auto-Indexing Orchestrator (Google API + IndexNow Protocol + Sitemap Pings)
 */
async function notifyAllIndexing(url, type = 'URL_UPDATED') {
  console.log(`[Universal Auto-Indexing] Triggering 360° index pings for: ${url}`);
  const results = await Promise.allSettled([
    notifyUrl(url, type),
    notifyIndexNow(url),
    pingSitemapEngines()
  ]);
  return {
    google: results[0]?.value || null,
    indexNow: results[1]?.value || null
  };
}

module.exports = { 
  notifyUrl,
  notifyIndexNow,
  notifyBatchIndexNow,
  pingSitemapEngines,
  notifyAllIndexing
};

