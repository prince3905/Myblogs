/**
 * countrySeoConfig.js
 * International & Foreigner SEO Matrix for Global Jobs Portal.
 * Maps sovereign countries to localized titles, meta descriptions, hreflang tags, and canonical paths.
 */

import { getCountryByCode } from './sovereignCountries195';

export const COUNTRY_SEO_CONFIG = {
  US: {
    lang: 'en-US',
    title: 'Official US Federal Jobs & Vacancies (USAJOBS) 2026 | Digital Home',
    description: 'Search live verified US Federal Government jobs, GS-grade payscales, and civilian agency circulars.',
    keywords: ['US Federal Jobs', 'USAJOBS 2026', 'GS grade salaries', 'US Government Careers', 'Federal Civil Service']
  },
  SG: {
    lang: 'en-SG',
    title: 'Careers@Gov Singapore Public Service Vacancies 2026 | Digital Home',
    description: 'Explore verified Singapore Civil Service & statutory board job circulars on Careers@Gov.',
    keywords: ['Careers@Gov Singapore', 'Singapore Civil Service Jobs 2026', 'Public Service Division jobs', 'Singapore statutory board careers']
  },
  GB: {
    lang: 'en-GB',
    title: 'UK Civil Service Jobs & Government Vacancies 2026 | Digital Home',
    description: 'Explore verified UK Civil Service fast-stream, executive agency, and ministry vacancies across England, Scotland, Wales, and Northern Ireland.',
    keywords: ['UK Civil Service jobs', 'GOV.UK jobs 2026', 'British government vacancies', 'HM Civil Service recruitment']
  },
  DE: {
    lang: 'de-DE',
    title: 'German Federal Civil Service (Bund.de) Jobs 2026 | Digital Home',
    description: 'Offizielle Stellenangebote der Bundesverwaltung (Bund.de). Finden Sie verifizierte Jobs für Beamte, Referenten und Sachbearbeiter in Deutschland.',
    keywords: ['Bund.de Stellenangebote', 'Bundesverwaltung Jobs 2026', 'Beamte Stellen', 'Öffentlicher Dienst Deutschland']
  },
  CA: {
    lang: 'en-CA',
    title: 'Government of Canada Jobs (GC Jobs / Emplois GC) 2026 | Digital Home',
    description: 'Search live verified Government of Canada federal public service opportunities, bilingual roles, and ministerial appointments across all provinces.',
    keywords: ['Government of Canada jobs', 'GC Jobs 2026', 'Emplois GC', 'Federal Public Service Canada']
  },
  AU: {
    lang: 'en-AU',
    title: 'Australian Public Service (APS Jobs) Vacancies 2026 | Digital Home',
    description: 'Search live Australian Public Service (APS Level & Executive) vacancies, commonwealth agency roles, and statutory appointments across Australia.',
    keywords: ['APS jobs 2026', 'Australian Public Service vacancies', 'Commonwealth government jobs Australia', 'APS Gazette notices']
  },
  IN: {
    lang: 'en-IN',
    title: 'Sarkari Result & Govt Jobs 2026 | UPSC, SSC, Railways & State PSC | Digital Home',
    description: 'Latest Sarkari Result 2026, Central & State Government job notifications, official circulars, admit cards, and verified .nic.in apply links.',
    keywords: ['Sarkari Result 2026', 'Sarkari Naukri', 'UPSC recruitment', 'SSC CGL vacancies', 'Railway jobs 2026']
  },
  AE: {
    lang: 'ar-AE',
    title: 'UAE Federal & Dubai Government Jobs 2026 | FAHR Careers | Digital Home',
    description: 'Explore verified UAE Federal Government & Dubai Civil Service vacancies across ministries, government entities, and statutory authorities.',
    keywords: ['UAE government jobs', 'Dubai careers 2026', 'FAHR government vacancies', 'Abu Dhabi public service']
  },
  SA: {
    lang: 'ar-SA',
    title: 'Saudi Civil Service & Government Jobs (Jadarat) 2026 | Digital Home',
    description: 'Search live verified Saudi Arabia public sector circulars, ministerial vacancies, and government agency announcements across Riyadh, Jeddah, and all regions.',
    keywords: ['Saudi government jobs', 'Jadarat vacancies 2026', 'Saudi civil service jobs', 'وظائف حكومية السعودية']
  }
};

export const COUNTRY_TO_PRIMARY_LANG = {
  IN: 'hi',
  AE: 'ar', SA: 'ar', QA: 'ar', OM: 'ar', KW: 'ar', BH: 'ar', EG: 'ar',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es',
  FR: 'fr', BE: 'fr', SN: 'fr',
  DE: 'de', AT: 'de', CH: 'de',
  US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', SG: 'en',
  RU: 'ru',
  BR: 'pt', PT: 'pt',
  JP: 'ja',
  KR: 'ko',
  BD: 'bn',
  PK: 'ur',
  ID: 'id'
};

export function getCountrySeoMeta(countryCode) {
  if (!countryCode || countryCode === 'ALL') {
    return {
      title: 'Global Government Jobs Portal 2026 | 195 Sovereign Countries & UN Circulars | Digital Home',
      description: 'Explore verified official government jobs, federal civil service notices, and UN/WHO vacancies across 195 sovereign countries. 100% direct official links.',
      canonical: 'https://www.digitalhomeblog.in/global-jobs',
      keywords: ['Global government jobs', 'Sarkari naukri world', 'UN jobs', 'Dubai government careers', 'Saudi civil service', 'UPSC SSC vacancies 2026', 'WHO jobs'],
      lang: 'en'
    };
  }

  const upper = countryCode.toUpperCase();
  if (COUNTRY_SEO_CONFIG[upper]) {
    return {
      ...COUNTRY_SEO_CONFIG[upper],
      canonical: `https://www.digitalhomeblog.in/global-jobs/${upper.toLowerCase()}`
    };
  }

  const countryInfo = getCountryByCode(upper);
  const countryName = countryInfo ? countryInfo.name : upper;
  const primaryLang = COUNTRY_TO_PRIMARY_LANG[upper] || 'en';

  return {
    lang: `${primaryLang}-${upper}`,
    title: `Official ${countryName} Government Jobs & Public Vacancies 2026 | Digital Home`,
    description: `Search live verified government jobs, ministry circulars, and public service opportunities in ${countryName}. Official portal links and gazette details.`,
    canonical: `https://www.digitalhomeblog.in/global-jobs/${upper.toLowerCase()}`,
    keywords: [`${countryName} government jobs`, `${countryName} civil service vacancies`, `${countryName} public sector careers`, 'official gazette jobs 2026']
  };
}

export function buildHreflangMatrix(activeCountryCode) {
  const baseUrl = 'https://www.digitalhomeblog.in';
  
  const matrix = [
    { lang: 'x-default', href: `${baseUrl}/global-jobs` },
    { lang: 'en-US', href: `${baseUrl}/global-jobs/us` },
    { lang: 'en-GB', href: `${baseUrl}/global-jobs/gb` },
    { lang: 'en-CA', href: `${baseUrl}/global-jobs/ca` },
    { lang: 'en-AU', href: `${baseUrl}/global-jobs/au` },
    { lang: 'de-DE', href: `${baseUrl}/global-jobs/de` },
    { lang: 'en-SG', href: `${baseUrl}/global-jobs/sg` },
    { lang: 'en-IN', href: `${baseUrl}/global-jobs/in` },
    { lang: 'ar-AE', href: `${baseUrl}/global-jobs/ae` },
    { lang: 'ar-SA', href: `${baseUrl}/global-jobs/sa` }
  ];

  if (activeCountryCode && activeCountryCode !== 'ALL') {
    const upper = activeCountryCode.toUpperCase();
    const currentMeta = getCountrySeoMeta(upper);
    const targetHref = `${baseUrl}/global-jobs/${upper.toLowerCase()}`;
    if (!matrix.some(m => m.lang === currentMeta.lang)) {
      matrix.push({ lang: currentMeta.lang, href: targetHref });
    }
  }

  return matrix;
}
