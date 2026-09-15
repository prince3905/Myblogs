/**
 * Smart Board Official Domain Resolver
 * Resolves 100% REAL official government & educational portal URLs based on post titles/boards.
 * ABSOLUTELY NEVER returns or allows sarkariresult.com or third-party competitor blog links!
 */

const { resolveOfficialGovtPortal, isDisallowedThirdPartyDomain } = require('./govtPortalMap');

function isCompetitorUrl(url = '') {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase();
  return (
    !lower.startsWith('http') ||
    isDisallowedThirdPartyDomain(url) ||
    lower.includes('digitalhomeblog.in') ||
    lower.includes('india.gov.in')
  );
}

function resolveOfficialUrls(title = '', alertObj = null, postSourceUrl = '') {
  const boardName = alertObj?.boardName || '';
  const state = alertObj?.state || '';
  const cleanTitle = title || alertObj?.title || '';

  // 1. Resolve authentic official website using the comprehensive portal engine
  const resolvedOfficialWeb = resolveOfficialGovtPortal(cleanTitle, boardName, '', state);

  // 2. Resolve Apply URL
  let apply = '';
  if (alertObj?.officialApplyUrl && !isCompetitorUrl(alertObj.officialApplyUrl)) {
    apply = alertObj.officialApplyUrl;
  } else if (alertObj?.officialUrl && !isCompetitorUrl(alertObj.officialUrl)) {
    apply = alertObj.officialUrl;
  } else {
    apply = resolvedOfficialWeb;
  }

  // 3. Resolve PDF / Notice URL
  let pdf = '';
  if (alertObj?.officialPdfUrl && !isCompetitorUrl(alertObj.officialPdfUrl)) {
    pdf = alertObj.officialPdfUrl;
  } else if (alertObj?.officialUrl && !isCompetitorUrl(alertObj.officialUrl)) {
    pdf = alertObj.officialUrl;
  } else {
    pdf = resolvedOfficialWeb;
  }

  // 4. Resolve Web URL
  let web = '';
  if (alertObj?.officialUrl && !isCompetitorUrl(alertObj.officialUrl)) {
    web = alertObj.officialUrl;
  } else {
    web = resolvedOfficialWeb;
  }

  return { apply, pdf, web };
}

module.exports = {
  isSarkariResultUrl: isCompetitorUrl,
  resolveOfficialUrls
};
