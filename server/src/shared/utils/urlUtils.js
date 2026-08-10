/**
 * Centralized Canonical & Link Normalization Utility for Digital Home Blog Server
 * Enforces clean, lowercase, HTTPS canonical URLs with no duplicate domain strings or trailing slashes.
 */

function normalizeCanonicalUrl(inputUrl, pageNum = null) {
  if (!inputUrl) return 'https://www.digitalhomeblog.in';

  let cleaned = String(inputUrl).trim();

  // Handle relative paths
  if (cleaned.startsWith('/')) {
    cleaned = `https://www.digitalhomeblog.in${cleaned}`;
  } else if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://www.digitalhomeblog.in/${cleaned}`;
  }

  // Force HTTPS and www.digitalhomeblog.in
  cleaned = cleaned.replace(/^http:\/\//i, 'https://');
  cleaned = cleaned.replace(/^https:\/\/(?:www\.)?digitalhomeblog\.in/i, 'https://www.digitalhomeblog.in');
  cleaned = cleaned.replace(/^https:\/\/digital-home-blog\.onrender\.com/i, 'https://www.digitalhomeblog.in');

  // Strip duplicate domain path insertions
  cleaned = cleaned.replace(/\/digitalhomeblog\.in\/?/gi, '/');
  cleaned = cleaned.replace(/digitalhomeblog\.in\/?/gi, '');

  try {
    const urlObj = new URL(cleaned);
    urlObj.host = 'www.digitalhomeblog.in';
    urlObj.protocol = 'https:';

    const pageParam = urlObj.searchParams.get('page') || pageNum;
    urlObj.search = ''; // Strip all tracking query params (utm, fbclid, ref, etc.)

    if (pageParam && parseInt(pageParam, 10) > 1) {
      urlObj.searchParams.set('page', String(pageParam));
    }

    // Sanitize pathname: lowercase, remove ampersands, collapse slashes
    let pathname = urlObj.pathname.toLowerCase();
    pathname = pathname.replace(/sarkari-jobs-(&|%26)-exams/gi, 'sarkari-jobs-exams');
    pathname = pathname.replace(/\/{2,}/g, '/');
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    urlObj.pathname = pathname;

    return urlObj.toString();
  } catch (e) {
    return 'https://www.digitalhomeblog.in';
  }
}

module.exports = { normalizeCanonicalUrl };
