/**
 * Smart Board Official Domain Resolver
 * Resolves 100% REAL official government & educational portal URLs based on post titles/boards.
 * ABSOLUTELY NEVER returns or allows sarkariresult.com or third-party competitor blog links!
 */

const BOARD_URL_MAP = [
  { keywords: ['bhu', 'banaras hindu'], apply: 'https://bhuonline.in/', pdf: 'https://bhuonline.in/', web: 'https://www.bhu.ac.in/' },
  { keywords: ['nta', 'cuet', 'jee main', 'neet', 'cmat', 'aissee'], apply: 'https://nta.ac.in/', pdf: 'https://nta.ac.in/', web: 'https://nta.ac.in/' },
  { keywords: ['iit jam', 'jam 2023', 'jam 2024', 'jam 2025', 'jam 2026'], apply: 'https://jam.iitm.ac.in/', pdf: 'https://jam.iitm.ac.in/', web: 'https://jam.iitm.ac.in/' },
  { keywords: ['ssc', 'staff selection'], apply: 'https://ssc.gov.in/', pdf: 'https://ssc.gov.in/', web: 'https://ssc.gov.in/' },
  { keywords: ['upsc'], apply: 'https://upsconline.nic.in/', pdf: 'https://upsc.gov.in/', web: 'https://upsc.gov.in/' },
  { keywords: ['upsrtc', 'bus conductor', 'conductor'], apply: 'https://upsrtc.up.gov.in/', pdf: 'https://upsrtc.up.gov.in/', web: 'https://upsrtc.up.gov.in/' },
  { keywords: ['rrb', 'rrc', 'railway', 'alp', 'group d', 'apprentice'], apply: 'https://www.rrbapply.gov.in/', pdf: 'https://www.rrbapply.gov.in/', web: 'https://indianrailways.gov.in/' },
  { keywords: ['ibps'], apply: 'https://www.ibps.in/', pdf: 'https://www.ibps.in/', web: 'https://www.ibps.in/' },
  { keywords: ['up police', 'uppbpb'], apply: 'https://uppbpb.gov.in/', pdf: 'https://uppbpb.gov.in/', web: 'https://uppbpb.gov.in/' },
  { keywords: ['upsssc'], apply: 'https://upsssc.gov.in/', pdf: 'https://upsssc.gov.in/', web: 'https://upsssc.gov.in/' },
  { keywords: ['bpsc', 'bihar teacher'], apply: 'https://bpsc.bih.nic.in/', pdf: 'https://bpsc.bih.nic.in/', web: 'https://bpsc.bih.nic.in/' },
  { keywords: ['bcece', 'ugmac', 'bihar neet'], apply: 'https://bceceboard.bihar.gov.in/', pdf: 'https://bceceboard.bihar.gov.in/', web: 'https://bceceboard.bihar.gov.in/' },
  { keywords: ['isro'], apply: 'https://apps.ursc.gov.in/', pdf: 'https://www.isro.gov.in/', web: 'https://www.isro.gov.in/' },
  { keywords: ['cbse'], apply: 'https://www.cbse.gov.in/', pdf: 'https://www.cbse.gov.in/', web: 'https://www.cbse.gov.in/' },
  { keywords: ['mp board', 'mpbse', 'mppsc', 'mpesb'], apply: 'https://mpbse.nic.in/', pdf: 'https://mpbse.nic.in/', web: 'https://mpbse.nic.in/' },
  { keywords: ['patna high court', 'phc'], apply: 'https://phc-recruitment.com/', pdf: 'https://patnahighcourt.gov.in/', web: 'https://patnahighcourt.gov.in/' },
  { keywords: ['army', 'iaf', 'navy', 'agniveer'], apply: 'https://joinindianarmy.nic.in/', pdf: 'https://joinindianarmy.nic.in/', web: 'https://joinindianarmy.nic.in/' },
  { keywords: ['clat', 'nlus'], apply: 'https://consortiumofnlus.ac.in/', pdf: 'https://consortiumofnlus.ac.in/', web: 'https://consortiumofnlus.ac.in/' },
  { keywords: ['muit', 'maharishi'], apply: 'https://apply.muituniversity.in/', pdf: 'https://www.maharishiuniversity.ac.in/', web: 'https://www.maharishiuniversity.ac.in/' }
];

function isSarkariResultUrl(url = '') {
  if (!url) return false;
  return /sarkariresult|sarkari-result|sarkariexam|freejobalert|jobalerts/i.test(url);
}

function resolveOfficialUrls(title = '', alertObj = null, postSourceUrl = '') {
  const lowerTitle = (title || alertObj?.title || '').toLowerCase();

  // 1. Try matching board keywords
  for (const entry of BOARD_URL_MAP) {
    if (entry.keywords.some(k => lowerTitle.includes(k))) {
      const apply = (!isSarkariResultUrl(alertObj?.officialApplyUrl) && alertObj?.officialApplyUrl) || entry.apply;
      const pdf = (!isSarkariResultUrl(alertObj?.officialPdfUrl) && alertObj?.officialPdfUrl) || entry.pdf;
      const web = (!isSarkariResultUrl(alertObj?.officialUrl) && alertObj?.officialUrl) || entry.web;
      return { apply, pdf, web };
    }
  }

  // 2. Generic fallback: use alertObj official URLs if NOT sarkariresult, else India Government Portal
  const apply = (!isSarkariResultUrl(alertObj?.officialApplyUrl) && alertObj?.officialApplyUrl) || 
                (!isSarkariResultUrl(alertObj?.officialUrl) && alertObj?.officialUrl) || 
                (!isSarkariResultUrl(postSourceUrl) && postSourceUrl) || 
                'https://www.india.gov.in/my-government/schemes-services';

  const pdf = (!isSarkariResultUrl(alertObj?.officialPdfUrl) && alertObj?.officialPdfUrl) || 
              (!isSarkariResultUrl(alertObj?.officialUrl) && alertObj?.officialUrl) || 
              (!isSarkariResultUrl(postSourceUrl) && postSourceUrl) || 
              'https://www.india.gov.in/my-government/schemes-services';

  const web = (!isSarkariResultUrl(alertObj?.officialUrl) && alertObj?.officialUrl) || 
              (!isSarkariResultUrl(postSourceUrl) && postSourceUrl) || 
              'https://www.india.gov.in/';

  return { apply, pdf, web };
}

module.exports = {
  isSarkariResultUrl,
  resolveOfficialUrls
};
