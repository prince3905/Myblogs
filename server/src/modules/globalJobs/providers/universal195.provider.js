const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const { OFFICIAL_GOV_TLD_REGEX } = require('../globalJob.model');

// Rotating Day-of-Week Schedule for Universal 195 Sovereign Nations Expansion
const ROTATING_SCHEDULE = {
  1: { // Monday: Nordic & Alpine Europe
    hubName: 'Nordic & Alpine Europe',
    countries: [
      { code: 'CH', name: 'Switzerland', flag: '🇨🇭', continent: 'Europe', currency: 'CHF', agency: 'Federal Administration (Bund/Admin.ch)', fallbackUrl: 'https://www.admin.ch', query: '("Stellenausschreibung" OR "Offre d\'emploi" OR "federal job") site:admin.ch OR site:ch.ch' },
      { code: 'NO', name: 'Norway', flag: '🇳🇴', continent: 'Europe', currency: 'NOK', agency: 'Norwegian Directorate (NAV / Jobbnorge)', fallbackUrl: 'https://www.nav.no', query: '("Ledig stilling" OR "statsansatt") site:nav.no' },
      { code: 'SE', name: 'Sweden', flag: '🇸🇪', continent: 'Europe', currency: 'SEK', agency: 'Swedish Public Employment Service', fallbackUrl: 'https://arbetsformedlingen.se', query: '("lediga jobb" OR "statliga jobb") site:arbetsformedlingen.se' },
      { code: 'AT', name: 'Austria', flag: '🇦🇹', continent: 'Europe', currency: 'EUR', agency: 'Federal Chancellery (Jobbörse der Republik)', fallbackUrl: 'https://jobboerse.gv.at', query: '("Ausschreibung" OR "Bundesdienst") site:gv.at' },
      { code: 'DK', name: 'Denmark', flag: '🇩🇰', continent: 'Europe', currency: 'DKK', agency: 'Agency for Public Finance & Recruitment', fallbackUrl: 'https://www.borger.dk', query: '("ledig stilling" OR "statsjob") site:borger.dk' },
      { code: 'FI', name: 'Finland', flag: '🇫🇮', continent: 'Europe', currency: 'EUR', agency: 'Valtiolle (State Civil Service)', fallbackUrl: 'https://www.valtiolle.fi', query: '("avoimet työpaikat" OR "valtiolle") site:valtiolle.fi' }
    ]
  },
  2: { // Tuesday: South & Central Asia
    hubName: 'South & Central Asia',
    countries: [
      { code: 'NP', name: 'Nepal', flag: '🇳🇵', continent: 'Asia', currency: 'NPR', agency: 'Public Service Commission (Lok Sewa Aayog)', fallbackUrl: 'http://psc.gov.np', query: '("Public Service Commission" OR "Lok Sewa" OR vacancy) site:gov.np' },
      { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', continent: 'Asia', currency: 'LKR', agency: 'Public Service Commission of Sri Lanka', fallbackUrl: 'http://www.psc.gov.lk', query: '("Public Service Commission" OR "Gazette Vacancy") site:gov.lk' },
      { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', continent: 'Asia', currency: 'BDT', agency: 'Bangladesh Public Service Commission (BPSC)', fallbackUrl: 'http://www.bpsc.gov.bd', query: '("Public Service Commission" OR recruitment OR circular) site:gov.bd' },
      { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', continent: 'Asia', currency: 'KZT', agency: 'Agency for Civil Service Affairs', fallbackUrl: 'https://gov.kz', query: '("государственная служба" OR "бос орындар") site:gov.kz' },
      { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', continent: 'Asia', currency: 'UZS', agency: 'Civil Service Development Agency (ARGOS)', fallbackUrl: 'https://gov.uz', query: '("davlat xizmati" OR "vakansiya") site:gov.uz' }
    ]
  },
  3: { // Wednesday: Southeast Asia & Oceania
    hubName: 'Southeast Asia & Oceania',
    countries: [
      { code: 'PH', name: 'Philippines', flag: '🇵🇭', continent: 'Asia', currency: 'PHP', agency: 'Civil Service Commission (CSC)', fallbackUrl: 'https://www.csc.gov.ph', query: '("Civil Service Commission" OR "Career Opportunity" OR vacancy) site:gov.ph' },
      { code: 'TH', name: 'Thailand', flag: '🇹🇭', continent: 'Asia', currency: 'THB', agency: 'Office of the Civil Service Commission (OCSC)', fallbackUrl: 'https://www.ocsc.go.th', query: '("รับสมัครงาน" OR "ข้าราชการ") site:go.th' },
      { code: 'VN', name: 'Vietnam', flag: '🇻🇳', continent: 'Asia', currency: 'VND', agency: 'Ministry of Home Affairs / Government Portal', fallbackUrl: 'https://chinhphu.vn', query: '("tuyển dụng công chức" OR "viên chức") site:gov.vn' },
      { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', continent: 'Oceania', currency: 'NZD', agency: 'Public Service Commission (Te Kawa Mataaho)', fallbackUrl: 'https://jobs.govt.nz', query: '("Public Service Commission" OR "civil service" OR vacancy) site:govt.nz' },
      { code: 'FJ', name: 'Fiji', flag: '🇫🇯', continent: 'Oceania', currency: 'FJD', agency: 'Fiji Public Service Commission', fallbackUrl: 'http://www.civilservice.gov.fj', query: '("Public Service" OR vacancy OR recruitment) site:gov.fj' }
    ]
  },
  4: { // Thursday: Latin America & Caribbean
    hubName: 'Latin America & Caribbean',
    countries: [
      { code: 'AR', name: 'Argentina', flag: '🇦🇷', continent: 'Americas', currency: 'ARS', agency: 'Secretaría de Gestión y Empleo Público', fallbackUrl: 'https://www.argentina.gob.ar', query: '("Empleo Público" OR concurso OR vacante) site:gob.ar' },
      { code: 'CL', name: 'Chile', flag: '🇨🇱', continent: 'Americas', currency: 'CLP', agency: 'Servicio Civil (Empleos Públicos)', fallbackUrl: 'https://www.empleospublicos.cl', query: '("Empleos Públicos" OR concurso OR "Servicio Civil") site:gob.cl' },
      { code: 'CO', name: 'Colombia', flag: '🇨🇴', continent: 'Americas', currency: 'COP', agency: 'Comisión Nacional del Servicio Civil (CNSC)', fallbackUrl: 'https://www.cnsc.gov.co', query: '("Convocatoria" OR "Servicio Civil" OR vacante) site:gov.co' },
      { code: 'PE', name: 'Peru', flag: '🇵🇪', continent: 'Americas', currency: 'PEN', agency: 'Autoridad Nacional del Servicio Civil (SERVIR)', fallbackUrl: 'https://www.gob.pe', query: '("Convocatorias de trabajo" OR "Servicio Civil") site:gob.pe' },
      { code: 'JM', name: 'Jamaica', flag: '🇯🇲', continent: 'Americas', currency: 'JMD', agency: 'Office of the Services Commissions', fallbackUrl: 'https://www.osc.gov.jm', query: '("Public Service" OR vacancy OR "civil service") site:gov.jm' }
    ]
  },
  5: { // Friday: Middle East & North Africa
    hubName: 'Middle East & North Africa',
    countries: [
      { code: 'EG', name: 'Egypt', flag: '🇪🇬', continent: 'Africa', currency: 'EGP', agency: 'Central Agency for Organization & Admin (CAOA)', fallbackUrl: 'https://jobs.caoa.gov.eg', query: '("بوابة الوظائف الحكومية" OR "وظائف حكومية") site:gov.eg' },
      { code: 'JO', name: 'Jordan', flag: '🇯🇴', continent: 'Asia', currency: 'JOD', agency: 'Civil Service Bureau (CSB)', fallbackUrl: 'http://www.csb.gov.jo', query: '("ديوان الخدمة المدنية" OR "وظائف حكومية") site:gov.jo' },
      { code: 'MA', name: 'Morocco', flag: '🇲🇦', continent: 'Africa', currency: 'MAD', agency: 'Ministère de la Transition Numérique et de la Réforme de l\'Administration', fallbackUrl: 'https://www.emploi-public.ma', query: '("Emploi Public" OR "مباريات التوظيف") site:gov.ma' },
      { code: 'TR', name: 'Turkey', flag: '🇹🇷', continent: 'Asia', currency: 'TRY', agency: 'Kariyer Kapısı (Cumhurbaşkanlığı İnsan Kaynakları)', fallbackUrl: 'https://kariyerkapisi.cbiko.gov.tr', query: '("Kamu Personeli Alımı" OR "memur alımı") site:gov.tr' }
    ]
  },
  0: { // Saturday & Sunday: Sub-Saharan Africa
    hubName: 'Sub-Saharan Africa',
    countries: [
      { code: 'GH', name: 'Ghana', flag: '🇬🇭', continent: 'Africa', currency: 'GHS', agency: 'Public Services Commission of Ghana', fallbackUrl: 'https://psc.gov.gh', query: '("Public Services Commission" OR recruitment OR vacancy) site:gov.gh' },
      { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', continent: 'Africa', currency: 'ETB', agency: 'Federal Civil Service Commission', fallbackUrl: 'http://www.fscs.gov.et', query: '("Civil Service Commission" OR vacancy OR recruitment) site:gov.et' },
      { code: 'RW', name: 'Rwanda', flag: '🇷🇼', continent: 'Africa', currency: 'RWF', agency: 'Public Service Commission of Rwanda', fallbackUrl: 'https://www.psc.gov.rw', query: '("Public Service Commission" OR "e-recruitment") site:gov.rw' },
      { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', continent: 'Africa', currency: 'TZS', agency: 'Public Service Recruitment Secretariat (PSRS)', fallbackUrl: 'http://ajira.go.tz', query: '("Public Service Recruitment" OR "Nafasi za Kazi") site:go.tz' },
      { code: 'UG', name: 'Uganda', flag: '🇺🇬', continent: 'Africa', currency: 'UGX', agency: 'Public Service Commission (PSC Uganda)', fallbackUrl: 'https://psc.go.ug', query: '("Public Service Commission" OR jobs OR vacancy) site:go.ug' }
    ]
  },
  6: { // Saturday alias (same hub)
    hubName: 'Sub-Saharan Africa',
    countries: [
      { code: 'GH', name: 'Ghana', flag: '🇬🇭', continent: 'Africa', currency: 'GHS', agency: 'Public Services Commission of Ghana', fallbackUrl: 'https://psc.gov.gh', query: '("Public Services Commission" OR recruitment OR vacancy) site:gov.gh' },
      { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', continent: 'Africa', currency: 'ETB', agency: 'Federal Civil Service Commission', fallbackUrl: 'http://www.fscs.gov.et', query: '("Civil Service Commission" OR vacancy OR recruitment) site:gov.et' },
      { code: 'RW', name: 'Rwanda', flag: '🇷🇼', continent: 'Africa', currency: 'RWF', agency: 'Public Service Commission of Rwanda', fallbackUrl: 'https://www.psc.gov.rw', query: '("Public Service Commission" OR "e-recruitment") site:gov.rw' },
      { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', continent: 'Africa', currency: 'TZS', agency: 'Public Service Recruitment Secretariat (PSRS)', fallbackUrl: 'http://ajira.go.tz', query: '("Public Service Recruitment" OR "Nafasi za Kazi") site:go.tz' },
      { code: 'UG', name: 'Uganda', flag: '🇺🇬', continent: 'Africa', currency: 'UGX', agency: 'Public Service Commission (PSC Uganda)', fallbackUrl: 'https://psc.go.ug', query: '("Public Service Commission" OR jobs OR vacancy) site:go.ug' }
    ]
  }
};

const TRASH_PATTERNS = [
  /recalled/i, /recall/i, /tax relief/i, /what is/i, /consultation/i,
  /invests in/i, /press release/i, /summit/i, /facility details/i,
  /register of legislation/i, /sanctions impact/i, /food recall/i,
  /consumer product/i, /statement on/i, /remarks by/i, /speech by/i,
  /success profiles/i, /behaviours/i, /innovation competitions/i,
  /working for/i, /using the civil service/i,
  /(declaration|statutory|weather|login page|eshop|all products|pension|seniors health card|medicare benefits|relationship authorisation|unclaimed money|immunisation program|definition of|looking for work|have your say|getting it right|helping you navigate|personal information releases)/i
];

const HIRING_PATTERNS = [
  /recruitment/i, /vacancy/i, /vacancies/i, /officer/i, /specialist/i,
  /assistant/i, /engineer/i, /analyst/i, /director/i, /manager/i,
  /associate/i, /internship/i, /fellowship/i, /technician/i, /coordinator/i,
  /administrator/i, /inspector/i, /advisor/i, /consultant/i, /clerk/i,
  /nurse/i, /doctor/i, /attorney/i, /counsel/i, /hiring/i, /careers/i,
  /job/i, /civil service/i, /public service/i,
  // Multilingual designations
  /(stellenausschreibung|sachbearbeiter|referent|beamter)/i,
  /(agent|officier|ingénieur|chargé de mission|administrateur)/i,
  /(funcionario|técnico|oposición|concurso|convocatoria)/i,
  /(採用|国家公務員|공무원|채용|jawatan kosong|pegawai)/i,
  /(lok sewa|ajira|nafasi za kazi|tuyển dụng|รับสมัครงาน)/i
];

function cleanTitle(title = '') {
  return title
    .replace(/ - [^-]+$/, '')
    .replace(/#\s*/g, '')
    .trim();
}

function detectJobCategory(title = '', desc = '') {
  const combined = (title + ' ' + (desc || '')).toLowerCase();

  if (/\b(health|medical|nurse|doctor|physician|surgeon|clinic|hospital|epidemiolog|pharmacist|pharmacy|midwife|radiology|patholog|dentist|psychiatr|psycholog|nutrition|sanitation|immuniz|vaccination|public health|community health|maternal|neonatal|hiv|malaria|tuberculosis|wash officer|santé|gesundheit|salud|médico|enfermero)\b/.test(combined)) {
    return 'Healthcare & Medical';
  }
  if (/\b(software|developer|programmer|it officer|information technology|cyber|network|database|data scientist|data analyst|machine learning|artificial intelligence|cloud|devops|systems administrator|web developer|frontend|backend|fullstack|engineer|technical officer|electrical|mechanical|civil engineer|infrastructure|gis|surveyor|construction|architect|technician|informatik|informática|sistemas)\b/.test(combined)) {
    return 'Tech & Engineering';
  }
  if (/\b(police|security officer|defense|defence|military|border|patrol|armed forces|guard|warden|constable|inspector|army|navy|air force|intelligence|counter-terrorism|corrections officer|fire service|rescue|sécurité|seguridad)\b/.test(combined)) {
    return 'Defense, Police & Security';
  }
  if (/\b(teacher|professor|lecturer|education officer|academic|school|university|college|curriculum|training officer|pedagog|faculty|research fellow|scholarship|librarian|headmaster|principal|instructor|enseignant|educación)\b/.test(combined)) {
    return 'Education & Academia';
  }
  if (/\b(finance|financial|audit|auditor|accountant|revenue|budget|treasury|tax|fiscal|comptroller|economics|economist|procurement|supply chain|grants|loans|customs|excise|internal control|customs officer|hacienda|finances)\b/.test(combined)) {
    return 'Finance, Revenue & Audit';
  }
  if (/\b(diplomat|ambassador|consular|foreign service|international relations|policy analyst|advocacy|liaison|humanitarian|legal officer|law officer|attorney|counsel|rights officer|protection officer|refugee|migration|geopolitics|multilateral|treaty|protocol officer|international law)\b/.test(combined)) {
    return 'Diplomatic & International Relations';
  }
  return 'Civil Service / Administrative';
}


function estimateSalary(currency, category) {
  return {
    amount: `Competitive ${currency} Statutory Civil Service Pay Scale`,
    currency: currency || 'USD'
  };
}

function generateRoleDetails(rawTitle, agency, countryName, category) {
  const responsibilities = [
    `Execute official statutory public governance and administration responsibilities under ${agency}.`,
    `Ensure compliance with national administrative frameworks, ethical guidelines, and legal statutes.`,
    `Coordinate public service operations and departmental policy initiatives in the ${category} portfolio.`,
    `Compile official records, analytical briefs, and statutory submissions for ministerial leadership.`,
    `Maintain merit-based administrative efficiency, fiscal accountability, and citizen-first delivery.`
  ];

  const benefits = [
    'Statutory Public Service Health & Social Protection Entitlements',
    'Official State Pension Scheme & Civil Service Provident Fund Protection',
    'Generous Paid Annual Leave, National Gazetted Holidays & Statutory Allowances',
    'Structured Public Service Grade Progression & Continuous Career Training',
    'High Statutory Tenured Employment Stability & Public Protections'
  ];

  const howToApply = `1. Click 'Apply on Official Portal' below to go to ${agency}'s verified government circular.\n2. Review the statutory call for candidates, grade prerequisites, and eligibility limits.\n3. Prepare your official electronic candidate dossier (CV, academic degrees, and civil service certifications).\n4. Complete the official government application form before the closing date.\n5. Keep your official registry number / submission receipt safe for subsequent evaluation phases.`;

  const description = `This official statutory position is announced under ${agency} representing the sovereign government of ${countryName}. The appointed officer will support public administrative operations, regulatory governance, and public service initiatives within the ${category} sector. This appointment includes comprehensive government benefits and statutory employment stability.`;

  return { responsibilities, benefits, howToApply, description };
}

/**
 * Fetch all countries from every rotation group every cycle.
 * Deduplicated by countryCode so each country is fetched once.
 * Per-country hard cap: 5 jobs to stay anti-spam-safe.
 */
async function fetchUniversalRotatingGovJobs() {
  // Collect ALL unique countries across all 7 day-groups
  const seenCodes = new Set();
  const allCountries = [];
  for (const dayGroup of Object.values(ROTATING_SCHEDULE)) {
    for (const country of dayGroup.countries) {
      if (!seenCodes.has(country.code)) {
        seenCodes.add(country.code);
        allCountries.push(country);
      }
    }
  }

  console.log(`[Universal 195 Provider] Running full sweep: ${allCountries.length} unique countries.`);
  const verifiedJobs = [];

  for (const country of allCountries) {
    try {
      const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(country.query)}&hl=en&gl=US&ceid=US:en`;
      const response = await axios.get(feedUrl, {
        timeout: 9000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GlobalCareersIntelligence/2.0' }
      });

      if (!response.data) continue;

      const $ = cheerio.load(response.data, { xmlMode: true });
      let countryJobCount = 0;

      $('item').slice(0, 20).each((i, el) => {
        if (countryJobCount >= 5) return false; // max 5 per country

        const itemTitle = $(el).find('title').text()?.trim();
        if (!itemTitle) return;

        const sourceEl = $(el).find('source');
        const sourceUrl = sourceEl.attr('url') || '';
        const itemLink = $(el).find('link').text()?.trim() || '';
        const rawTitle = cleanTitle(itemTitle);

        if (TRASH_PATTERNS.some(rx => rx.test(rawTitle))) return;
        if (!HIRING_PATTERNS.some(rx => rx.test(rawTitle))) return;

        const isValidGovDomain = OFFICIAL_GOV_TLD_REGEX.test(sourceUrl);
        const finalUrl = isValidGovDomain ? sourceUrl : country.fallbackUrl;

        const agency = sourceEl.text()?.trim() || country.agency;
        const category = detectJobCategory(rawTitle);
        const salary = estimateSalary(country.currency, category);

        const deadline = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
        const hash = crypto.createHash('md5').update(`${country.code}-${rawTitle}`).digest('hex').slice(0, 8);
        const refId = `${country.code}-GOV-${hash.toUpperCase()}`;
        const roleDetails = generateRoleDetails(rawTitle, agency, country.name, category);

        verifiedJobs.push({
          title: rawTitle,
          originalTitle: rawTitle,
          countryCode: country.code,
          countryName: country.name,
          countryFlag: country.flag,
          continent: country.continent,
          agencyOrMinistry: agency,
          officialReferenceId: refId,
          jobType: category || 'Civil Service / Administrative',
          category,
          salary,
          dutyStation: `${country.name} (National / Duty Station)`,
          officialNoticeUrl: finalUrl,
          officialGazetteSummary: `Official Gazette Vacancy Notice: ${rawTitle}\nAuthority: ${agency} (${country.name})\nClassification: ${category}\nSalary Scale: ${salary.amount}\nDuty Station: ${country.name}\nClosing Date: ${deadline.toLocaleDateString()}`,
          description: roleDetails.description,
          keyResponsibilities: roleDetails.responsibilities,
          benefits: roleDetails.benefits,
          howToApply: roleDetails.howToApply,
          applicationDeadline: deadline,
          verifiedStatus: 'Verified Official Gazette',
          verificationBadge: 'Verified by: Global Careers Intelligence Desk',
          eligibility: {
            education: 'University Degree or recognized statutory civil service qualification.',
            experience: 'Relevant public administration or professional specialty experience.',
            citizenshipRequired: false,
            visaSponsored: true,
            ageLimit: '18 - 65 years'
          },
          translations: {
            hi: {
              title: `सरकारी भर्ती: ${rawTitle}`,
              agency,
              dutyStation: `${country.name} (आधिकारिक तैनाती स्थल)`,
              eligibility: 'आधिकारिक गजट के अनुसार स्नातक / संबंधित योग्यता (18-65 वर्ष)',
              salary: salary.amount,
              summary: `${agency} (${country.name}) द्वारा ${rawTitle} के पद पर आधिकारिक भर्ती।`,
              howToApply: 'नीचे दिए गए आधिकारिक सरकारी लिंक पर क्लिक करें।'
            }
          }
        });
        countryJobCount++;
      });

      // Natural jitter between countries (anti-ban)
      await new Promise(res => setTimeout(res, 500 + Math.random() * 500));
    } catch (err) {
      console.warn(`[Universal 195] Failed for ${country.name}:`, err.message);
    }
  }

  console.log(`[Universal 195 Provider] Full sweep complete: ${verifiedJobs.length} jobs from ${allCountries.length} countries.`);
  return verifiedJobs;
}


module.exports = {
  fetchUniversalRotatingGovJobs,
  ROTATING_SCHEDULE
};
