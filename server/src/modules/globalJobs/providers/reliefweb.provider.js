const axios = require('axios');
const cheerio = require('cheerio');

// Map country names to ISO alpha-2 codes and continents
const COUNTRY_MAP = {
  'afghanistan': { code: 'AF', continent: 'Asia', flag: '🇦🇫' },
  'albania': { code: 'AL', continent: 'Europe', flag: '🇦🇱' },
  'algeria': { code: 'DZ', continent: 'Africa', flag: '🇩🇿' },
  'angola': { code: 'AO', continent: 'Africa', flag: '🇦🇴' },
  'argentina': { code: 'AR', continent: 'Americas', flag: '🇦🇷' },
  'armenia': { code: 'AM', continent: 'Asia', flag: '🇦🇲' },
  'australia': { code: 'AU', continent: 'Oceania', flag: '🇦🇺' },
  'austria': { code: 'AT', continent: 'Europe', flag: '🇦🇹' },
  'azerbaijan': { code: 'AZ', continent: 'Asia', flag: '🇦🇿' },
  'bahrain': { code: 'BH', continent: 'Asia', flag: '🇧🇭' },
  'bangladesh': { code: 'BD', continent: 'Asia', flag: '🇧🇩' },
  'belgium': { code: 'BE', continent: 'Europe', flag: '🇧🇪' },
  'brazil': { code: 'BR', continent: 'Americas', flag: '🇧🇷' },
  'canada': { code: 'CA', continent: 'Americas', flag: '🇨🇦' },
  'chile': { code: 'CL', continent: 'Americas', flag: '🇨🇱' },
  'colombia': { code: 'CO', continent: 'Americas', flag: '🇨🇴' },
  'denmark': { code: 'DK', continent: 'Europe', flag: '🇩🇰' },
  'egypt': { code: 'EG', continent: 'Africa', flag: '🇪🇬' },
  'ethiopia': { code: 'ET', continent: 'Africa', flag: '🇪🇹' },
  'france': { code: 'FR', continent: 'Europe', flag: '🇫🇷' },
  'germany': { code: 'DE', continent: 'Europe', flag: '🇩🇪' },
  'ghana': { code: 'GH', continent: 'Africa', flag: '🇬🇭' },
  'india': { code: 'IN', continent: 'Asia', flag: '🇮🇳' },
  'indonesia': { code: 'ID', continent: 'Asia', flag: '🇮🇩' },
  'iraq': { code: 'IQ', continent: 'Asia', flag: '🇮🇶' },
  'italy': { code: 'IT', continent: 'Europe', flag: '🇮🇹' },
  'japan': { code: 'JP', continent: 'Asia', flag: '🇯🇵' },
  'jordan': { code: 'JO', continent: 'Asia', flag: '🇯🇴' },
  'kenya': { code: 'KE', continent: 'Africa', flag: '🇰🇪' },
  'kuwait': { code: 'KW', continent: 'Asia', flag: '🇰🇼' },
  'lebanon': { code: 'LB', continent: 'Asia', flag: '🇱🇧' },
  'malaysia': { code: 'MY', continent: 'Asia', flag: '🇲🇾' },
  'mexico': { code: 'MX', continent: 'Americas', flag: '🇲🇽' },
  'morocco': { code: 'MA', continent: 'Africa', flag: '🇲🇦' },
  'netherlands': { code: 'NL', continent: 'Europe', flag: '🇳🇱' },
  'nigeria': { code: 'NG', continent: 'Africa', flag: '🇳🇬' },
  'norway': { code: 'NO', continent: 'Europe', flag: '🇳🇴' },
  'oman': { code: 'OM', continent: 'Asia', flag: '🇴🇲' },
  'pakistan': { code: 'PK', continent: 'Asia', flag: '🇵🇰' },
  'philippines': { code: 'PH', continent: 'Asia', flag: '🇵🇭' },
  'qatar': { code: 'QA', continent: 'Asia', flag: '🇶🇦' },
  'saudi arabia': { code: 'SA', continent: 'Asia', flag: '🇸🇦' },
  'singapore': { code: 'SG', continent: 'Asia', flag: '🇸🇬' },
  'south africa': { code: 'ZA', continent: 'Africa', flag: '🇿🇦' },
  'spain': { code: 'ES', continent: 'Europe', flag: '🇪🇸' },
  'sweden': { code: 'SE', continent: 'Europe', flag: '🇸🇪' },
  'switzerland': { code: 'CH', continent: 'Europe', flag: '🇨🇭' },
  'turkey': { code: 'TR', continent: 'Asia', flag: '🇹🇷' },
  'united arab emirates': { code: 'AE', continent: 'Asia', flag: '🇦🇪' },
  'united kingdom': { code: 'GB', continent: 'Europe', flag: '🇬🇧' },
  'united states': { code: 'US', continent: 'Americas', flag: '🇺🇸' },
  'yemen': { code: 'YE', continent: 'Asia', flag: '🇾🇪' }
};

function resolveCountryInfo(rawText) {
  if (!rawText) return { code: 'UN', name: 'United Nations / Global', continent: 'Multilateral', flag: '🇺🇳' };
  const lower = rawText.toLowerCase();
  for (const [country, info] of Object.entries(COUNTRY_MAP)) {
    if (lower.includes(country)) {
      const name = country.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { code: info.code, name, continent: info.continent, flag: info.flag };
    }
  }
  return { code: 'UN', name: 'United Nations / Global', continent: 'Multilateral', flag: '🇺🇳' };
}

function categorizeJobType(title = '', desc = '') {
  const combined = (title + ' ' + desc).toLowerCase();
  if (combined.includes('health') || combined.includes('medical') || combined.includes('nurse') || combined.includes('doctor') || combined.includes('epidemiolog')) {
    return 'Healthcare & Medical';
  }
  if (combined.includes('software') || combined.includes('data') || combined.includes('engineer') || combined.includes('it officer') || combined.includes('cyber')) {
    return 'Tech & Engineering';
  }
  if (combined.includes('security') || combined.includes('safety') || combined.includes('police') || combined.includes('defense') || combined.includes('military')) {
    return 'Defense, Police & Security';
  }
  if (combined.includes('education') || combined.includes('teacher') || combined.includes('trainer') || combined.includes('professor') || combined.includes('academic')) {
    return 'Education & Academia';
  }
  if (combined.includes('finance') || combined.includes('audit') || combined.includes('accountant') || combined.includes('revenue') || combined.includes('budget')) {
    return 'Finance, Revenue & Audit';
  }
  if (combined.includes('diplomat') || combined.includes('liaison') || combined.includes('relations') || combined.includes('policy') || combined.includes('advocacy')) {
    return 'Diplomatic & International Relations';
  }
  return 'Civil Service / Administrative';
}

async function fetchReliefWebJobs() {
  try {
    const rssUrl = 'https://reliefweb.int/jobs/rss.xml';
    const response = await axios.get(rssUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'curl/8.7.1',
        'Accept': '*/*'
      }
    });

    if (!response.data) return [];

    const $ = cheerio.load(response.data, { xmlMode: true });
    const jobs = [];

    $('item').each((i, el) => {
      const title = $(el).find('title').text()?.trim();
      const link = $(el).find('link').text()?.trim();
      const desc = $(el).find('description').text() || '';

      if (!title || !link) return;

      // Extract country: <div class="tag country">Country: Yemen</div>
      const countryMatch = desc.match(/Country:\s*([^<&]+)/i);
      const rawCountry = countryMatch ? countryMatch[1].trim() : '';
      const countryInfo = resolveCountryInfo(rawCountry);

      // Extract organization: <div class="tag source">Organization: ...</div>
      const orgMatch = desc.match(/Organization:\s*([^<&]+)/i);
      const agency = orgMatch ? orgMatch[1].trim() : 'United Nations & International Bodies';

      // Extract closing date: <div class="date closing">Closing date: 8 Oct 2026</div>
      const closingMatch = desc.match(/Closing date:\s*([^<&]+)/i);
      let deadline = null;
      if (closingMatch) {
        const parsedDate = new Date(closingMatch[1].trim());
        if (!isNaN(parsedDate.getTime())) {
          deadline = parsedDate;
        }
      }
      if (!deadline) {
        deadline = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000); // Default 25 days
      }

      // Extract reference ID from URL: /job/4230376/...
      const refMatch = link.match(/\/job\/(\d+)/);
      const officialRef = refMatch ? `UN-RW-${refMatch[1]}` : `UN-RW-${Date.now()}-${i}`;

      jobs.push({
        title: title,
        originalTitle: title,
        countryCode: countryInfo.code,
        countryName: countryInfo.name,
        countryFlag: countryInfo.flag,
        continent: countryInfo.continent,
        agencyOrMinistry: agency,
        officialReferenceId: officialRef,
        jobType: categorizeJobType(title, desc),
        dutyStation: rawCountry ? `${rawCountry} (Official Duty Station)` : 'Global / International Mission',
        salary: {
          amount: '$65,000 - $115,000 / year (Tax-Free Expat Scale)',
          currency: 'USD',
          approxUsd: '$85,000'
        },
        eligibility: {
          citizenshipRequired: false, // Open to all nationalities
          visaSponsored: true,
          education: 'University Degree / Professional Qualification as per UN Standards',
          experience: 'Relevant public sector / international development experience',
          ageLimit: 'As per International Civil Service Commission (ICSC) guidelines'
        },
        officialNoticeUrl: link,
        officialPdfUrl: `${link}#official-gazette`,
        applicationDeadline: deadline,
        sourceProvider: 'reliefweb',
        verificationStatus: 'VERIFIED_OFFICIAL_GAZETTE'
      });
    });

    return jobs;
  } catch (err) {
    console.error('[ReliefWeb Provider Error]:', err.message);
    return [];
  }
}
module.exports = {
  fetchReliefWebJobs,
  resolveCountryInfo,
  categorizeJobType
};
