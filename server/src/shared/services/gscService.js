const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const env = require('../../config/env');

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
      console.error('[GSC Service] Failed to parse env credentials:', err.message);
    }
  }

  if (fs.existsSync(CREDENTIALS_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    } catch (err) {
      console.error('[GSC Service] Failed to parse credentials file:', err.message);
    }
  }

  return null;
}

async function getAccessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
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
 * Fetch top GSC queries for a specific page path.
 * @param {string} relativePagePath - e.g. "/blog/sarkari-jobs-exams/uttarakhand-tet-utet-online-form-2026"
 * @returns {Promise<string[]>} List of query keywords
 */
async function getDetailedQueriesForPage(relativePagePath) {
  const credentials = getCredentials();
  if (!credentials) {
    console.warn('[GSC Service] GSC credentials not configured. Skipping query search.');
    return [];
  }

  try {
    const token = await getAccessToken(credentials);

    // Calculate last 30 days date range
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const formatDate = (date) => date.toISOString().split('T')[0];
    const startDate = formatDate(thirtyDaysAgo);
    const endDate = formatDate(today);

    // Normalize siteUrl from env
    const siteUrlRaw = env.siteUrl || 'https://www.digitalhomeblog.in';
    const siteUrl = siteUrlRaw.endsWith('/') ? siteUrlRaw : `${siteUrlRaw}/`;
    
    // Construct the absolute page URL Search Console tracks
    const absolutePageUrl = `${siteUrlRaw}${relativePagePath}`;

    // Extract domain for sc-domain property queries fallback
    const domainMatch = siteUrlRaw.match(/https?:\/\/(?:www\.)?([^\/]+)/i);
    const domain = domainMatch ? domainMatch[1] : 'digitalhomeblog.in';

    console.log(`[GSC Service] Fetching queries for: "${absolutePageUrl}" (Last 30 days: ${startDate} to ${endDate})`);

    // GSC property candidates to try (trailing slash url, raw url, and sc-domain property)
    const propertyCandidates = [
      siteUrl,
      siteUrlRaw,
      `sc-domain:${domain}`
    ];

    let lastError = null;
    let rows = [];

    for (const property of propertyCandidates) {
      try {
        console.log(`[GSC Service] Trying query search on property: "${property}"`);
        const urlEncodedProperty = encodeURIComponent(property);
        const queryUrl = `https://www.googleapis.com/webmasters/v3/sites/${urlEncodedProperty}/searchAnalytics/query`;
        
        const response = await axios.post(
          queryUrl,
          {
            startDate,
            endDate,
            dimensions: ['page', 'query'],
            rowLimit: 100,
            dimensionFilterGroups: [
              {
                filters: [
                  {
                    dimension: 'page',
                    operator: 'equals',
                    expression: absolutePageUrl
                  }
                ]
              }
            ]
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            timeout: 10000
          }
        );

        if (response.data && response.data.rows) {
          rows = response.data.rows;
          console.log(`[GSC Service] Successfully fetched ${rows.length} query rows from property "${property}"`);
          break; // Found queries!
        }
      } catch (err) {
        const desc = err.response && err.response.data && err.response.data.error 
          ? err.response.data.error.message 
          : err.message;
        console.warn(`[GSC Service] Query search failed on property "${property}": ${desc}`);
        lastError = err;
      }
    }

    if (rows.length === 0 && lastError) {
      console.warn(`[GSC Service] All Search Console properties failed to query.`);
    }

    // Extract query terms sorted by impressions
    const queries = rows
      .map(row => ({
        query: row.keys[1],
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: row.ctr || 0,
        position: row.position || 0
      }))
      .filter(q => q.query && q.impressions >= 1) // filter low relevance
      .sort((a, b) => b.impressions - a.impressions);

    return queries;

  } catch (err) {
    console.error('[GSC Service] Failed to retrieve GSC search queries:', err.message);
    return [];
  }
}

/**
 * Fetch top GSC query strings for a specific page path.
 */
async function getTopQueriesForPage(relativePagePath) {
  const detailed = await getDetailedQueriesForPage(relativePagePath);
  return detailed.map(d => d.query);
}

module.exports = { getTopQueriesForPage, getDetailedQueriesForPage };
