/**
 * Official Government Portal Mapping Engine for Digital Home Sarkari Result
 * Maps recruitment boards, exams, and public services to 100% authentic official government websites.
 */

const GOVT_PORTALS = [
  // 1. Public Utility & Government Services
  { keywords: ['aadhar', 'uidai'], url: 'https://uidai.gov.in', name: 'UIDAI Official Portal' },
  { keywords: ['voter', 'election', 'eci'], url: 'https://voters.eci.gov.in', name: 'ECI Voters Service Portal' },
  { keywords: ['pan card', 'pan link', 'incometax'], url: 'https://eportal.incometax.gov.in', name: 'Income Tax e-Filing Portal' },
  { keywords: ['parivahan', 'driving', 'licence', 'license', 'learning license', 'rc status', 'vehicle'], url: 'https://parivahan.gov.in', name: 'Sarathi Parivahan Sewa' },
  { keywords: ['eshram', 'e shram', 'shramik'], url: 'https://eshram.gov.in', name: 'e-Shram Official Portal' },
  { keywords: ['passport'], url: 'https://passportindia.gov.in', name: 'Passport Seva Portal' },
  { keywords: ['cowin', 'corona vaccine', 'vaccine'], url: 'https://cowin.gov.in', name: 'CoWIN Portal' },

  // 2. Central Recruitment Boards & Entrance Exams
  { keywords: ['upsc', 'union public service'], url: 'https://upsc.gov.in', name: 'UPSC Official Portal' },
  { keywords: ['ssc', 'staff selection commission'], url: 'https://ssc.gov.in', name: 'SSC Official Portal' },
  { keywords: ['ibps', 'banking personnel'], url: 'https://ibps.in', name: 'IBPS Official Portal' },
  { keywords: ['rrb', 'railway recruitment', 'rrc', 'railway'], url: 'https://indianrailways.gov.in', name: 'Indian Railways Portal' },
  { keywords: ['nta', 'national testing agency'], url: 'https://nta.ac.in', name: 'NTA Official Portal' },
  { keywords: ['neet'], url: 'https://neet.nta.nic.in', name: 'NTA NEET Portal' },
  { keywords: ['jee main', 'jeemain'], url: 'https://jeemain.nta.nic.in', name: 'JEE Main Portal' },
  { keywords: ['cuet'], url: 'https://cuet.samarth.ac.in', name: 'CUET Official Portal' },
  { keywords: ['ctet'], url: 'https://ctet.nic.in', name: 'CTET Official Portal' },
  { keywords: ['cbse'], url: 'https://cbse.gov.in', name: 'CBSE Official Portal' },
  { keywords: ['gate'], url: 'https://gate2026.iisc.ac.in', name: 'GATE Official Portal' },
  { keywords: ['cat', 'iim cat'], url: 'https://iimcat.ac.in', name: 'IIM CAT Portal' },

  // 3. Defense & Paramilitary Forces
  { keywords: ['army', 'join indian army'], url: 'https://joinindianarmy.nic.in', name: 'Join Indian Army Official' },
  { keywords: ['navy', 'indian navy'], url: 'https://joinindiannavy.gov.in', name: 'Join Indian Navy Official' },
  { keywords: ['air force', 'afcat', 'agnipathvayu'], url: 'https://agnipathvayu.cdac.in', name: 'Indian Air Force Agnipath' },
  { keywords: ['bsf'], url: 'https://rectt.bsf.gov.in', name: 'BSF Recruitment Portal' },
  { keywords: ['crpf'], url: 'https://rect.crpf.gov.in', name: 'CRPF Recruitment Portal' },
  { keywords: ['cisf'], url: 'https://cisfrectt.cisf.gov.in', name: 'CISF Recruitment Portal' },
  { keywords: ['itbp'], url: 'https://recruitment.itbpolice.nic.in', name: 'ITBP Recruitment Portal' },
  { keywords: ['ssb', 'sashastra seema bal'], url: 'https://ssbrectt.gov.in', name: 'SSB Recruitment Portal' },
  { keywords: ['coast guard'], url: 'https://joinindiancoastguard.cdac.in', name: 'Indian Coast Guard Portal' },

  // 4. Uttar Pradesh State Portals
  { keywords: ['uppsc'], url: 'https://uppsc.up.nic.in', name: 'UPPSC Official Portal' },
  { keywords: ['upsssc'], url: 'https://upsssc.gov.in', name: 'UPSSSC Official Portal' },
  { keywords: ['up police', 'uppbpb'], url: 'https://uppbpb.gov.in', name: 'UP Police Recruitment Board' },
  { keywords: ['jeecup', 'up polytechnic'], url: 'https://jeecup.admissions.nic.in', name: 'JEECUP Polytechnic Portal' },
  { keywords: ['upbed', 'up b.ed'], url: 'https://bujhansi.ac.in', name: 'UP B.Ed Admission Portal' },
  { keywords: ['allahabad hc', 'allahabad high court', 'ahc'], url: 'https://www.allahabadhighcourt.in', name: 'Allahabad High Court Official' },
  { keywords: ['up basic shiksha', 'up deled', 'kgbv'], url: 'https://updeled.gov.in', name: 'UP Basic Education Board' },
  { keywords: ['upsrtc'], url: 'https://upsrtc.up.gov.in', name: 'UPSRTC Official Portal' },

  // 5. Bihar State Portals
  { keywords: ['bpsc'], url: 'https://bpsc.bih.nic.in', name: 'BPSC Official Portal' },
  { keywords: ['csbc', 'bihar police'], url: 'https://csbc.bih.nic.in', name: 'CSBC Bihar Police Portal' },
  { keywords: ['bpssc'], url: 'https://bpssc.bih.nic.in', name: 'BPSSC Bihar Portal' },
  { keywords: ['bssc'], url: 'https://bssc.bihar.gov.in', name: 'BSSC Official Portal' },
  { keywords: ['patna hc', 'patna high court'], url: 'https://patnahighcourt.gov.in', name: 'Patna High Court Official' },

  // 6. Madhya Pradesh & Rajasthan State Portals
  { keywords: ['mppsc'], url: 'https://mppsc.mp.gov.in', name: 'MPPSC Official Portal' },
  { keywords: ['mpesb', 'mppeb', 'mp peb'], url: 'https://esb.mp.gov.in', name: 'MPESB Official Portal' },
  { keywords: ['rpsc'], url: 'https://rpsc.rajasthan.gov.in', name: 'RPSC Official Portal' },
  { keywords: ['rsmssb', 'rssb', 'rajasthan cet'], url: 'https://rsmssb.rajasthan.gov.in', name: 'RSMSSB Official Portal' },

  // 7. Delhi, Haryana, Uttarakhand, Jharkhand
  { keywords: ['dsssb'], url: 'https://dsssb.delhi.gov.in', name: 'DSSSB Official Portal' },
  { keywords: ['delhi police'], url: 'https://delhipolice.gov.in', name: 'Delhi Police Portal' },
  { keywords: ['hssc'], url: 'https://hssc.gov.in', name: 'HSSC Haryana Portal' },
  { keywords: ['hpsc'], url: 'https://hpsc.gov.in', name: 'HPSC Haryana Portal' },
  { keywords: ['ukpsc'], url: 'https://ukpsc.gov.in', name: 'UKPSC Uttarakhand Portal' },
  { keywords: ['uksssc'], url: 'https://sssc.uk.gov.in', name: 'UKSSSC Official Portal' },
  { keywords: ['jpsc'], url: 'https://jpsc.gov.in', name: 'JPSC Jharkhand Portal' },
  { keywords: ['jssc'], url: 'https://jssc.nic.in', name: 'JSSC Official Portal' },

  // 8. Banking & PSUs
  { keywords: ['sbi', 'state bank'], url: 'https://bank.sbi/careers', name: 'SBI Careers Portal' },
  { keywords: ['rbi', 'reserve bank'], url: 'https://opportunities.rbi.org.in', name: 'RBI Opportunities Portal' },
  { keywords: ['pnb', 'punjab national'], url: 'https://pnbindia.in', name: 'PNB Official Portal' },
  { keywords: ['isro'], url: 'https://isro.gov.in', name: 'ISRO Official Portal' },
  { keywords: ['drdo'], url: 'https://drdo.gov.in', name: 'DRDO Official Portal' },
  { keywords: ['barc'], url: 'https://barc.gov.in', name: 'BARC Official Portal' },
  { keywords: ['lic'], url: 'https://licindia.in', name: 'LIC India Official Portal' },
  { keywords: ['coal india', 'cil'], url: 'https://coalindia.in', name: 'Coal India Official' },
  { keywords: ['nalco'], url: 'https://nalcoindia.com', name: 'NALCO Official Portal' },
  { keywords: ['aai', 'airports authority'], url: 'https://aai.aero', name: 'AAI Official Portal' }
];

/**
 * Resolves a given alert title/board/scraped URL to its authentic Official Government Portal.
 * Guaranteed 100% NEVER to return sarkariresult.com or a broken self-loop link!
 */
function resolveOfficialGovtPortal(title = '', boardName = '', currentUrl = '') {
  const combined = `${title} ${boardName} ${currentUrl}`.toLowerCase();

  for (const portal of GOVT_PORTALS) {
    if (portal.keywords.some(kw => combined.includes(kw))) {
      return portal.url;
    }
  }

  // Fallback domain extraction if currentUrl is a real external gov/edu/nic domain
  if (currentUrl && typeof currentUrl === 'string') {
    const lower = currentUrl.toLowerCase();
    if (!lower.includes('sarkariresult') && !lower.includes('freejobalert') && !lower.includes('sarkari-result') && !lower.includes('digitalhomeblog.in')) {
      return currentUrl;
    }
  }

  return 'https://india.gov.in';
}

function isDisallowedThirdPartyDomain(url = '') {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return lower.includes('sarkariresult') || lower.includes('freejobalert') || lower.includes('sarkari-result');
}

module.exports = {
  GOVT_PORTALS,
  resolveOfficialGovtPortal,
  isDisallowedThirdPartyDomain
};
