const { google } = require('googleapis');

let authClient = null;

// Initialize Google Auth Client using service account credentials
function getGoogleAuthClient() {
  if (authClient) return authClient;

  const credentialsJson = process.env.GOOGLE_INDEXING_CREDENTIALS;
  if (!credentialsJson) {
    console.warn('[Google Indexing] GOOGLE_INDEXING_CREDENTIALS not set in environment. Index pings will be skipped.');
    return null;
  }

  try {
    let credentials;
    if (credentialsJson.trim().startsWith('{')) {
      credentials = JSON.parse(credentialsJson);
    } else {
      // If it's a file path, load from file
      const fs = require('fs');
      const path = require('path');
      credentials = JSON.parse(fs.readFileSync(path.resolve(credentialsJson), 'utf8'));
    }

    authClient = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/indexing'],
      null
    );
    return authClient;
  } catch (err) {
    console.error('[Google Indexing] Failed to parse credentials:', err.message);
    return null;
  }
}

/**
 * Send an indexing request to Google for a specific URL
 * @param {string} url - The URL to index or remove
 * @param {string} type - Either 'URL_UPDATED' (for creation/update) or 'URL_DELETED'
 */
async function pingGoogleIndexing(url, type = 'URL_UPDATED') {
  try {
    const auth = getGoogleAuthClient();
    if (!auth) {
      console.warn(`[Google Indexing] Skipping ping for ${url} (Credentials missing or invalid)`);
      return { success: false, message: 'Google Indexing Credentials not configured.' };
    }

    console.log(`[Google Indexing] Sending ${type} request for: ${url}`);
    
    // Authorize client
    await auth.authorize();

    const response = await google.indexing('v3').urlNotifications.publish({
      auth: auth,
      requestBody: {
        url: url,
        type: type
      }
    });

    console.log(`[Google Indexing] Ping successful! Response:`, response.data);
    return { success: true, data: response.data };
  } catch (err) {
    console.error(`[Google Indexing] Ping failed for ${url}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { pingGoogleIndexing };
