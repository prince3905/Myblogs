/**
 * Centralized Canonical & Link Normalization Utility for Digital Home Blog Server
 * Enforces clean, lowercase, HTTPS canonical URLs with no duplicate domain strings, query parameters, or trailing slashes.
 */

function normalizeCanonicalUrl(inputUrl) {
  if (!inputUrl) return 'https://www.digitalhomeblog.in';

  let cleaned = String(inputUrl).trim();

  // Handle relative paths
  if (cleaned.startsWith('/')) {
    cleaned = `https://www.digitalhomeblog.in${cleaned}`;
  } else if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://www.digitalhomeblog.in/${cleaned.replace(/^\/+/, '')}`;
  }

  try {
    const urlObj = new URL(cleaned);
    urlObj.protocol = 'https:';
    urlObj.host = 'www.digitalhomeblog.in';
    // Strictly strip ALL query parameters (page, search, utm, fbclid, ref, gclid, etc.)
    // Canonical URL must ALWAYS be the pure self-referential root URL
    urlObj.search = '';
    urlObj.hash = '';

    // Sanitize pathname: lowercase, remove ampersands, collapse duplicate slashes
    let pathname = urlObj.pathname.toLowerCase();
    pathname = pathname.replace(/\/digitalhomeblog\.in/gi, '');
    pathname = pathname.replace(/sarkari-jobs-(&|%26)-exams/gi, 'sarkari-jobs-exams');
    pathname = pathname.replace(/\/{2,}/g, '/');
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    urlObj.pathname = pathname || '/';

    return urlObj.toString();
  } catch (e) {
    return 'https://www.digitalhomeblog.in';
  }
}

module.exports = { normalizeCanonicalUrl };
