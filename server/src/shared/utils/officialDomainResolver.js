/**
 * Smart Board Official Domain Resolver
 * Resolves 100% REAL official government & educational portal URLs based on post titles/boards.
 * ABSOLUTELY NEVER returns or allows sarkariresult.com or third-party competitor blog links!
 */

const BOARD_URL_MAP = [
  { keywords: ['hppsc', 'hpas', 'hp administrative', 'himachal public service', 'hp psc'], apply: 'http://www.hppsc.hp.gov.in/hppsc/', pdf: 'http://www.hppsc.hp.gov.in/hppsc/', web: 'http://www.hppsc.hp.gov.in/hppsc/' },
  { keywords: ['hpsssb', 'hprca', 'hp ssb', 'hp subordinate'], apply: 'http://www.hpsssb.hp.gov.in/', pdf: 'http://www.hpsssb.hp.gov.in/', web: 'http://www.hpsssb.hp.gov.in/' },
  { keywords: ['jee advanced', 'iit jee advanced'], apply: 'https://jeeadv.ac.in/', pdf: 'https://jeeadv.ac.in/', web: 'https://jeeadv.ac.in/' },
  { keywords: ['jee main', 'jeemain', 'iit jee main', 'iit jee'], apply: 'https://jeemain.nta.nic.in/', pdf: 'https://jeemain.nta.nic.in/', web: 'https://jeemain.nta.nic.in/' },
  { keywords: ['neet ug', 'neet pg', 'neet'], apply: 'https://neet.nta.nic.in/', pdf: 'https://nbe.edu.in/', web: 'https://neet.nta.nic.in/' },
  { keywords: ['cuet ug', 'cuet pg', 'cuet'], apply: 'https://cuetug.ntaonline.in/', pdf: 'https://cuet.nta.nic.in/', web: 'https://cuet.nta.nic.in/' },
  { keywords: ['gate', 'iit gate'], apply: 'https://gate.iisc.ac.in/', pdf: 'https://gate.iisc.ac.in/', web: 'https://gate.iisc.ac.in/' },
  { keywords: ['cat admission', 'iim cat', 'cat 202'], apply: 'https://iimcat.ac.in/', pdf: 'https://iimcat.ac.in/', web: 'https://iimcat.ac.in/' },
  { keywords: ['cmat'], apply: 'https://cmat.nta.ac.in/', pdf: 'https://cmat.nta.ac.in/', web: 'https://cmat.nta.ac.in/' },
  { keywords: ['jipmat'], apply: 'https://jipmat.nta.ac.in/', pdf: 'https://jipmat.nta.ac.in/', web: 'https://jipmat.nta.ac.in/' },
  { keywords: ['bhu', 'banaras hindu'], apply: 'https://bhuonline.in/', pdf: 'https://bhuonline.in/', web: 'https://www.bhu.ac.in/' },
  { keywords: ['nta', 'aissee'], apply: 'https://nta.ac.in/', pdf: 'https://nta.ac.in/', web: 'https://nta.ac.in/' },
  { keywords: ['iit jam', 'jam 2023', 'jam 2024', 'jam 2025', 'jam 2026'], apply: 'https://jam.iitm.ac.in/', pdf: 'https://jam.iitm.ac.in/', web: 'https://jam.iitm.ac.in/' },
  { keywords: ['ssc', 'staff selection'], apply: 'https://ssc.gov.in/', pdf: 'https://ssc.gov.in/', web: 'https://ssc.gov.in/' },
  { keywords: ['upsc'], apply: 'https://upsconline.nic.in/', pdf: 'https://upsc.gov.in/', web: 'https://upsc.gov.in/' },
  { keywords: ['upsrtc', 'bus conductor', 'conductor'], apply: 'https://upsrtc.up.gov.in/', pdf: 'https://upsrtc.up.gov.in/', web: 'https://upsrtc.up.gov.in/' },
  { keywords: ['rrb', 'rrc', 'railway', 'alp', 'group d', 'apprentice'], apply: 'https://www.rrbapply.gov.in/', pdf: 'https://www.rrbapply.gov.in/', web: 'https://indianrailways.gov.in/' },
  { keywords: ['ibps'], apply: 'https://www.ibps.in/', pdf: 'https://www.ibps.in/', web: 'https://www.ibps.in/' },
  { keywords: ['up police', 'uppbpb'], apply: 'https://uppbpb.gov.in/', pdf: 'https://uppbpb.gov.in/', web: 'https://uppbpb.gov.in/' },
  { keywords: ['upsssc'], apply: 'https://upsssc.gov.in/', pdf: 'https://upsssc.gov.in/', web: 'https://upsssc.gov.in/' },
  { keywords: ['uppsc', 'up pcs'], apply: 'https://uppsc.up.nic.in/', pdf: 'https://uppsc.up.nic.in/', web: 'https://uppsc.up.nic.in/' },
  { keywords: ['bpsc', 'bihar teacher'], apply: 'https://bpsc.bih.nic.in/', pdf: 'https://bpsc.bih.nic.in/', web: 'https://bpsc.bih.nic.in/' },
  { keywords: ['csbc', 'bihar police'], apply: 'https://csbc.bih.nic.in/', pdf: 'https://csbc.bih.nic.in/', web: 'https://csbc.bih.nic.in/' },
  { keywords: ['bcece', 'ugmac', 'bihar neet'], apply: 'https://bceceboard.bihar.gov.in/', pdf: 'https://bceceboard.bihar.gov.in/', web: 'https://bceceboard.bihar.gov.in/' },
  { keywords: ['rpsc', 'ras'], apply: 'https://rpsc.rajasthan.gov.in/', pdf: 'https://rpsc.rajasthan.gov.in/', web: 'https://rpsc.rajasthan.gov.in/' },
  { keywords: ['rsmssb', 'rssb'], apply: 'https://rsmssb.rajasthan.gov.in/', pdf: 'https://rsmssb.rajasthan.gov.in/', web: 'https://rsmssb.rajasthan.gov.in/' },
  { keywords: ['hpsc', 'haryana psc'], apply: 'https://hpsc.gov.in/', pdf: 'https://hpsc.gov.in/', web: 'https://hpsc.gov.in/' },
  { keywords: ['hssc'], apply: 'https://hssc.gov.in/', pdf: 'https://hssc.gov.in/', web: 'https://hssc.gov.in/' },
  { keywords: ['ukpsc'], apply: 'https://psc.uk.gov.in/', pdf: 'https://psc.uk.gov.in/', web: 'https://psc.uk.gov.in/' },
  { keywords: ['uksssc'], apply: 'https://sssc.uk.gov.in/', pdf: 'https://sssc.uk.gov.in/', web: 'https://sssc.uk.gov.in/' },
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

  // 1. Try matching board keywords with word-boundary regex
  const cleanTitle = ` ${lowerTitle} `;
  for (const entry of BOARD_URL_MAP) {
    for (const k of entry.keywords) {
      const escaped = k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i');
      if (regex.test(cleanTitle)) {
        const apply = (!isSarkariResultUrl(alertObj?.officialApplyUrl) && alertObj?.officialApplyUrl) || entry.apply;
        const pdf = (!isSarkariResultUrl(alertObj?.officialPdfUrl) && alertObj?.officialPdfUrl) || entry.pdf;
        const web = (!isSarkariResultUrl(alertObj?.officialUrl) && alertObj?.officialUrl) || entry.web;
        return { apply, pdf, web };
      }
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
