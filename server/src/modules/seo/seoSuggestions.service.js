const axios = require('axios');

/**
 * Real-time Candidate Search Autocomplete via Google Suggest API
 * @param {string} query Search query term
 * @returns {Promise<string[]>} Array of clean suggestion strings
 */
async function fetchGoogleSuggestions(query) {
  const cleanQuery = (query || '').trim();
  if (!cleanQuery) return [];

  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(cleanQuery)}`;
    const response = await axios.get(url, {
      timeout: 6000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (Array.isArray(response.data) && Array.isArray(response.data[1])) {
      const suggestions = response.data[1]
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
      return Array.from(new Set(suggestions));
    }
    return [];
  } catch (error) {
    console.warn(`[SEO Suggestions Service] Google Suggest fetch error for "${cleanQuery}":`, error.message);
    return [];
  }
}

module.exports = {
  fetchGoogleSuggestions
};
