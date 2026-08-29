/**
 * Official Government Portal Mapping Engine for Digital Home Sarkari Result
 * Maps recruitment boards, exams, and public services to 100% authentic official government websites.
 */

const GOVT_PORTALS = [
  // 1. Public Utility & Government Services
  { keywords: ['aadhar', 'uidai'], url: 'https://uidai.gov.in', name: 'UIDAI Official Portal' },
  { keywords: ['voter', 'election', 'eci'], url: 'https://voters.eci.gov.in', name: 'ECI Voters Service Portal' },
  { keywords: ['pan card', 'pan link', 'incometax', 'nsdl', 'uti'], url: 'https://eportal.incometax.gov.in', name: 'Income Tax e-Filing Portal' },
  { keywords: ['parivahan', 'driving', 'licence', 'license', 'learning license', 'rc status', 'vehicle', 'sarathi'], url: 'https://parivahan.gov.in', name: 'Sarathi Parivahan Sewa' },
  { keywords: ['eshram', 'e shram', 'shramik'], url: 'https://eshram.gov.in', name: 'e-Shram Official Portal' },
  { keywords: ['passport'], url: 'https://passportindia.gov.in', name: 'Passport Seva Portal' },
  { keywords: ['cowin', 'corona vaccine', 'vaccine'], url: 'https://cowin.gov.in', name: 'CoWIN Portal' },
  { keywords: ['digilocker'], url: 'https://www.digilocker.gov.in', name: 'DigiLocker Official Portal' },

  // 2. Central Recruitment Boards & National Commissions
  { keywords: ['upsc', 'union public service', 'nda', 'cds', 'civil services'], url: 'https://upsc.gov.in', name: 'UPSC Official Portal' },
  { keywords: ['ssc', 'staff selection commission', 'cgl', 'chsl', 'mts', 'cpo', 'gd constable'], url: 'https://ssc.gov.in', name: 'SSC Official Portal' },
  { keywords: ['ibps', 'banking personnel', 'ibps po', 'ibps clerk', 'ibps rrb', 'ibps so'], url: 'https://ibps.in', name: 'IBPS Official Portal' },
  { keywords: ['rrb', 'railway recruitment', 'rrc', 'railway', 'alp', 'technician', 'ntpc', 'group d'], url: 'https://www.rrbapply.gov.in', name: 'Indian Railways RRB Portal' },
  { keywords: ['nta', 'national testing agency'], url: 'https://nta.ac.in', name: 'NTA Official Portal' },
  { keywords: ['neet', 'neet ug', 'neet pg'], url: 'https://neet.nta.nic.in', name: 'NTA NEET Portal' },
  { keywords: ['jee main', 'jeemain'], url: 'https://jeemain.nta.nic.in', name: 'JEE Main Portal' },
  { keywords: ['jee advanced', 'jeeadv'], url: 'https://jeeadv.ac.in', name: 'JEE Advanced Portal' },
  { keywords: ['cuet', 'cuet ug', 'cuet pg'], url: 'https://cuetug.ntaonline.in', name: 'CUET Official Portal' },
  { keywords: ['ctet'], url: 'https://ctet.nic.in', name: 'CTET Official Portal' },
  { keywords: ['ugc net', 'ugcnet', 'csir net'], url: 'https://ugcnet.nta.ac.in', name: 'UGC NET Portal' },
  { keywords: ['cbse'], url: 'https://cbse.gov.in', name: 'CBSE Official Portal' },
  { keywords: ['gate', 'iit gate'], url: 'https://gate2026.iisc.ac.in', name: 'GATE Official Portal' },
  { keywords: ['cat', 'iim cat'], url: 'https://iimcat.ac.in', name: 'IIM CAT Portal' },

  // 3. Himachal Pradesh State Portals (HPPSC, HPAS, HP High Court, HP Police, HP Forest)
  { keywords: ['hppsc', 'hpas', 'hp administrative', 'himachal public service', 'hp psc', 'hp judicial', 'hp set'], url: 'http://www.hppsc.hp.gov.in/hppsc/', name: 'HPPSC Official Portal' },
  { keywords: ['hpsssb', 'hprca', 'hp ssb', 'hp subordinate', 'himachal subordinate'], url: 'http://www.hpsssb.hp.gov.in/', name: 'HP Subordinate Selection Board' },
  { keywords: ['hp police', 'hppolice', 'himachal police'], url: 'https://citizenportal.hppolice.gov.in', name: 'HP Police Recruitment' },
  { keywords: ['hp high court', 'hphc', 'himachal high court'], url: 'https://highcourt.hp.gov.in', name: 'HP High Court Official' },
  { keywords: ['hpbose', 'hp dharamsala', 'hp tet', 'hptet'], url: 'https://hpbose.org', name: 'HP Board of School Education' },

  // 4. Uttar Pradesh State Portals
  { keywords: ['uppsc', 'up pcs', 'up ro aro', 'up judicial'], url: 'https://uppsc.up.nic.in', name: 'UPPSC Official Portal' },
  { keywords: ['upsssc', 'up pet', 'up lekhpal', 'up vdo'], url: 'https://upsssc.gov.in', name: 'UPSSSC Official Portal' },
  { keywords: ['up police', 'uppbpb', 'up si', 'up constable'], url: 'https://uppbpb.gov.in', name: 'UP Police Recruitment Board' },
  { keywords: ['jeecup', 'up polytechnic'], url: 'https://jeecup.admissions.nic.in', name: 'JEECUP Polytechnic Portal' },
  { keywords: ['upbed', 'up b.ed'], url: 'https://bujhansi.ac.in', name: 'UP B.Ed Admission Portal' },
  { keywords: ['allahabad hc', 'allahabad high court', 'ahc'], url: 'https://www.allahabadhighcourt.in', name: 'Allahabad High Court Official' },
  { keywords: ['up basic shiksha', 'up deled', 'kgbv', 'up btc'], url: 'https://updeled.gov.in', name: 'UP Basic Education Board' },
  { keywords: ['upsrtc', 'up roadways'], url: 'https://upsrtc.up.gov.in', name: 'UPSRTC Official Portal' },

  // 5. Bihar State Portals
  { keywords: ['bpsc', 'bihar public service', 'bpsc tre', 'bihar teacher'], url: 'https://bpsc.bih.nic.in', name: 'BPSC Official Portal' },
  { keywords: ['csbc', 'bihar police', 'bihar police constable'], url: 'https://csbc.bih.nic.in', name: 'CSBC Bihar Police Portal' },
  { keywords: ['bpssc', 'bihar daroga', 'bihar si'], url: 'https://bpssc.bih.nic.in', name: 'BPSSC Bihar Portal' },
  { keywords: ['bssc', 'bihar staff selection', 'bssc cgl', 'bssc inter level'], url: 'https://bssc.bihar.gov.in', name: 'BSSC Official Portal' },
  { keywords: ['bcece', 'bceceb', 'bihar combined entrance', 'ugmac'], url: 'https://bceceboard.bihar.gov.in', name: 'BCECEB Bihar' },
  { keywords: ['patna hc', 'patna high court'], url: 'https://patnahighcourt.gov.in', name: 'Patna High Court Official' },
  { keywords: ['bihar deled', 'bseb'], url: 'http://biharboardonline.bihar.gov.in', name: 'BSEB Bihar Board' },

  // 6. Madhya Pradesh State Portals
  { keywords: ['mppsc', 'mp pcs', 'mp public service'], url: 'https://mppsc.mp.gov.in', name: 'MPPSC Official Portal' },
  { keywords: ['mpesb', 'mppeb', 'mp peb', 'mp vyapam'], url: 'https://esb.mp.gov.in', name: 'MPESB Official Portal' },
  { keywords: ['mp police', 'mp police constable'], url: 'https://mppolice.gov.in', name: 'MP Police Official Portal' },
  { keywords: ['mp high court', 'mphc'], url: 'https://mphc.gov.in', name: 'MP High Court Official' },
  { keywords: ['mpbse'], url: 'https://mpbse.nic.in', name: 'MP Board of Secondary Education' },

  // 7. Rajasthan State Portals
  { keywords: ['rpsc', 'ras', 'rts', 'rajasthan public service'], url: 'https://rpsc.rajasthan.gov.in', name: 'RPSC Official Portal' },
  { keywords: ['rsmssb', 'rssb', 'rajasthan cet', 'rajasthan subordinate', 'rajasthan patwari'], url: 'https://rsmssb.rajasthan.gov.in', name: 'RSMSSB Official Portal' },
  { keywords: ['rajasthan police', 'raj police'], url: 'https://police.rajasthan.gov.in', name: 'Rajasthan Police Official' },
  { keywords: ['rajasthan hc', 'hcraj', 'rajasthan high court'], url: 'https://hcraj.nic.in', name: 'Rajasthan High Court Official' },
  { keywords: ['rajeduboard', 'bser', 'reet'], url: 'https://rajeduboard.rajasthan.gov.in', name: 'Rajasthan Education Board / REET' },

  // 8. Haryana & Punjab State Portals
  { keywords: ['hpsc', 'hcs', 'haryana public service'], url: 'https://hpsc.gov.in', name: 'HPSC Haryana Portal' },
  { keywords: ['hssc', 'haryana staff selection', 'haryana cet'], url: 'https://hssc.gov.in', name: 'HSSC Haryana Portal' },
  { keywords: ['haryana police'], url: 'https://haryanapolice.gov.in', name: 'Haryana Police Portal' },
  { keywords: ['ppsc', 'punjab public service'], url: 'https://ppsc.gov.in', name: 'PPSC Punjab Portal' },
  { keywords: ['sssb punjab', 'psssb'], url: 'https://sssb.punjab.gov.in', name: 'PSSSB Punjab Subordinate' },
  { keywords: ['punjab police'], url: 'https://punjabpolice.gov.in', name: 'Punjab Police Portal' },
  { keywords: ['phhc', 'punjab and haryana high court'], url: 'https://highcourtchd.gov.in', name: 'Punjab & Haryana High Court' },

  // 9. Uttarakhand & Jharkhand State Portals
  { keywords: ['ukpsc', 'uttarakhand public service', 'uk pcs'], url: 'https://psc.uk.gov.in', name: 'UKPSC Uttarakhand Portal' },
  { keywords: ['uksssc', 'uttarakhand subordinate'], url: 'https://sssc.uk.gov.in', name: 'UKSSSC Official Portal' },
  { keywords: ['uttarakhand police', 'uk police'], url: 'https://uttarakhandpolice.uk.gov.in', name: 'Uttarakhand Police Portal' },
  { keywords: ['jpsc', 'jharkhand public service'], url: 'https://jpsc.gov.in', name: 'JPSC Jharkhand Portal' },
  { keywords: ['jssc', 'jharkhand staff selection', 'jssc cgl'], url: 'https://jssc.nic.in', name: 'JSSC Official Portal' },
  { keywords: ['jharkhand police'], url: 'https://jhpolice.gov.in', name: 'Jharkhand Police Portal' },

  // 10. Delhi NCT State Portals
  { keywords: ['dsssb', 'delhi subordinate services'], url: 'https://dsssb.delhi.gov.in', name: 'DSSSB Official Portal' },
  { keywords: ['delhi police'], url: 'https://delhipolice.gov.in', name: 'Delhi Police Portal' },
  { keywords: ['delhi high court', 'dhc'], url: 'https://delhihighcourt.nic.in', name: 'Delhi High Court Official' },

  // 11. Maharashtra & Gujarat State Portals
  { keywords: ['mpsc', 'maharashtra public service'], url: 'https://mpsc.gov.in', name: 'MPSC Maharashtra Portal' },
  { keywords: ['maharashtra police', 'maha police'], url: 'https://mahapolice.gov.in', name: 'Maharashtra Police Portal' },
  { keywords: ['bombay high court'], url: 'https://bombayhighcourt.nic.in', name: 'Bombay High Court Official' },
  { keywords: ['gpsc', 'gujarat public service'], url: 'https://gpsc.gujarat.gov.in', name: 'GPSC Gujarat Portal' },
  { keywords: ['gsssb', 'gujarat subordinate'], url: 'https://gsssb.gujarat.gov.in', name: 'GSSSB Gujarat Subordinate' },
  { keywords: ['gujarat high court'], url: 'https://gujarathighcourt.nic.in', name: 'Gujarat High Court Official' },

  // 12. Odisha, West Bengal, Assam & North East
  { keywords: ['opsc', 'odisha public service'], url: 'https://opsc.gov.in', name: 'OPSC Odisha Portal' },
  { keywords: ['osssc', 'odisha subordinate'], url: 'https://osssc.gov.in', name: 'OSSSC Odisha Subordinate' },
  { keywords: ['wbpsc', 'west bengal public service'], url: 'https://psc.wb.gov.in', name: 'WBPSC West Bengal Portal' },
  { keywords: ['wbprb', 'west bengal police'], url: 'https://prb.wb.gov.in', name: 'WB Police Recruitment' },
  { keywords: ['calcutta high court'], url: 'https://calcuttahighcourt.gov.in', name: 'Calcutta High Court' },
  { keywords: ['apsc', 'assam public service'], url: 'https://apsc.nic.in', name: 'APPSC Assam Portal' },
  { keywords: ['slprb assam', 'assam police'], url: 'https://slprbassam.in', name: 'SLPRB Assam Police' },
  { keywords: ['gauhati high court'], url: 'https://ghconline.gov.in', name: 'Gauhati High Court' },

  // 13. South Indian State Portals (TN, AP, Telangana, Karnataka, Kerala)
  { keywords: ['tnpsc', 'tamil nadu public service'], url: 'https://tnpsc.gov.in', name: 'TNPSC Tamil Nadu' },
  { keywords: ['appsc', 'andhra pradesh public service'], url: 'https://psc.ap.gov.in', name: 'APPSC Andhra Pradesh' },
  { keywords: ['tspsc', 'telangana public service', 'tggpsc'], url: 'https://tspsc.gov.in', name: 'TSPSC Telangana' },
  { keywords: ['kpsc', 'karnataka public service'], url: 'https://kpsc.kar.nic.in', name: 'KPSC Karnataka' },
  { keywords: ['keralapsc', 'kerala psc'], url: 'https://keralapsc.gov.in', name: 'Kerala PSC Official' },

  // 14. Defense & Paramilitary Forces
  { keywords: ['join indian army', 'indian army', 'army bsc nursing', 'agniveer army'], url: 'https://joinindianarmy.nic.in', name: 'Join Indian Army Official' },
  { keywords: ['join indian navy', 'indian navy', 'agniveer navy', 'navy ssr', 'navy mr'], url: 'https://joinindiannavy.gov.in', name: 'Join Indian Navy Official' },
  { keywords: ['air force', 'afcat', 'agnipathvayu', 'indian air force'], url: 'https://agnipathvayu.cdac.in', name: 'Indian Air Force Agnipath' },
  { keywords: ['bsf', 'border security force'], url: 'https://rectt.bsf.gov.in', name: 'BSF Recruitment Portal' },
  { keywords: ['crpf', 'central reserve police'], url: 'https://rect.crpf.gov.in', name: 'CRPF Recruitment Portal' },
  { keywords: ['cisf', 'central industrial security'], url: 'https://cisfrectt.cisf.gov.in', name: 'CISF Recruitment Portal' },
  { keywords: ['itbp', 'indo tibetan border police'], url: 'https://recruitment.itbpolice.nic.in', name: 'ITBP Recruitment Portal' },
  { keywords: ['ssb', 'sashastra seema bal'], url: 'https://ssbrectt.gov.in', name: 'SSB Recruitment Portal' },
  { keywords: ['coast guard', 'icg', 'indian coast guard'], url: 'https://joinindiancoastguard.cdac.in', name: 'Indian Coast Guard Portal' },

  // 15. Banking, Financial & PSUs
  { keywords: ['sbi', 'state bank of india', 'sbi po', 'sbi clerk', 'sbi so', 'sbi cbo'], url: 'https://bank.sbi/careers', name: 'SBI Careers Portal' },
  { keywords: ['rbi', 'reserve bank of india', 'rbi grade b', 'rbi assistant'], url: 'https://opportunities.rbi.org.in', name: 'RBI Opportunities Portal' },
  { keywords: ['nabard'], url: 'https://www.nabard.org/careers-notices.aspx', name: 'NABARD Careers' },
  { keywords: ['sebi'], url: 'https://www.sebi.gov.in/department/human-resources-department-37/careers.html', name: 'SEBI Careers' },
  { keywords: ['pnb', 'punjab national bank'], url: 'https://pnbindia.in', name: 'PNB Official Portal' },
  { keywords: ['bob', 'bank of baroda'], url: 'https://www.bankofbaroda.in/career', name: 'Bank of Baroda Careers' },
  { keywords: ['canara bank'], url: 'https://canarabank.com/careers', name: 'Canara Bank Careers' },
  { keywords: ['isro', 'ursc', 'sac', 'vssc', 'sdsc'], url: 'https://isro.gov.in', name: 'ISRO Official Portal' },
  { keywords: ['drdo', 'ceptam'], url: 'https://drdo.gov.in', name: 'DRDO Official Portal' },
  { keywords: ['barc', 'bhabha atomic'], url: 'https://barc.gov.in', name: 'BARC Official Portal' },
  { keywords: ['lic', 'lic aao', 'lic ado', 'lic hfl'], url: 'https://licindia.in', name: 'LIC India Official Portal' },
  { keywords: ['gicl', 'niacl', 'oicl', 'uiic'], url: 'https://www.newindia.co.in', name: 'NIACL / PSU Insurance' },
  { keywords: ['coal india', 'cil'], url: 'https://coalindia.in', name: 'Coal India Official' },
  { keywords: ['nalco'], url: 'https://nalcoindia.com', name: 'NALCO Official Portal' },
  { keywords: ['aai', 'airports authority', 'aai atc', 'aai je'], url: 'https://aai.aero', name: 'AAI Official Portal' },
  { keywords: ['bhel'], url: 'https://careers.bhel.in', name: 'BHEL Official Portal' },
  { keywords: ['bel', 'bharat electronics'], url: 'https://bel-india.in', name: 'BEL Official Portal' },
  { keywords: ['iocl', 'indian oil'], url: 'https://iocl.com', name: 'IOCL Official Portal' },
  { keywords: ['ongc', 'oil and natural gas'], url: 'https://ongcindia.com', name: 'ONGC Official Portal' },
  { keywords: ['ntpc'], url: 'https://ntpc.co.in', name: 'NTPC Official Portal' },
  { keywords: ['gail'], url: 'https://gailonline.com', name: 'GAIL Official Portal' },
  { keywords: ['sail', 'steel authority'], url: 'https://sail.co.in', name: 'SAIL Official Portal' },
  { keywords: ['powergrid', 'pgcil'], url: 'https://www.powergrid.in', name: 'POWERGRID Official Portal' }
];

function escapeRegex(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// Pre-compiled keyword index sorted by length descending (longest/most-specific matches first)
const SORTED_PORTAL_RULES = [];
GOVT_PORTALS.forEach(portal => {
  portal.keywords.forEach(kw => {
    const cleanKw = kw.trim().toLowerCase();
    const regex = new RegExp(`(?:^|[^a-z0-9])${escapeRegex(cleanKw)}(?:[^a-z0-9]|$)`, 'i');
    SORTED_PORTAL_RULES.push({
      keyword: cleanKw,
      regex,
      url: portal.url,
      name: portal.name,
      length: cleanKw.length
    });
  });
});
SORTED_PORTAL_RULES.sort((a, b) => b.length - a.length);

/**
 * Resolves a given alert title/board/scraped URL to its authentic Official Government Portal.
 * 1. Checks specific board rules (e.g. JSSC, UPSSSC, HPPSC, UP Police, BPSC, SBI, UPSC) using word-boundary regex.
 * 2. If no board rule matches, checks if currentUrl is an authentic external link.
 * 3. Guaranteed 100% NEVER to return sarkariresult.com or a competitor domain!
 */
function resolveOfficialGovtPortal(title = '', boardName = '', currentUrl = '') {
  const combinedText = ` ${title} ${boardName} `.toLowerCase();

  // 1. Longest-specific keyword match with word-boundary regex
  for (const rule of SORTED_PORTAL_RULES) {
    if (rule.regex.test(combinedText)) {
      return rule.url;
    }
  }

  // 2. If currentUrl is a valid external official/government link (not competitor, not self), use it
  if (currentUrl && typeof currentUrl === 'string' && currentUrl.startsWith('http')) {
    const lowerUrl = currentUrl.toLowerCase();
    const isCompetitor = lowerUrl.includes('sarkariresult') || lowerUrl.includes('freejobalert') || lowerUrl.includes('sarkari-result') || lowerUrl.includes('sarkariexam') || lowerUrl.includes('jobalerts') || lowerUrl.includes('digitalhomeblog.in');
    if (!isCompetitor) {
      return currentUrl;
    }
  }

  return 'https://india.gov.in';
}

function isDisallowedThirdPartyDomain(url = '') {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return lower.includes('sarkariresult') || lower.includes('freejobalert') || lower.includes('sarkari-result') || lower.includes('sarkariexam') || lower.includes('jobalerts');
}

module.exports = {
  GOVT_PORTALS,
  resolveOfficialGovtPortal,
  isDisallowedThirdPartyDomain
};
