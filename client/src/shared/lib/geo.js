import { useState, useEffect } from 'react';
import { request } from './api';

export const COUNTRY_META = {
  IN: { code: 'IN', name: 'India', flag: '🇮🇳', label: '🇮🇳 India (Sarkari)', portal: 'UPSC / SSC / State PSC' },
  US: { code: 'US', name: 'United States', flag: '🇺🇸', label: '🇺🇸 USA Federal Jobs', portal: 'USAJOBS.gov' },
  GB: { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', label: '🇬🇧 UK Civil Service', portal: 'Civil Service Jobs' },
  CA: { code: 'CA', name: 'Canada', flag: '🇨🇦', label: '🇨🇦 Canada GC Jobs', portal: 'GC Jobs' },
  AU: { code: 'AU', name: 'Australia', flag: '🇦🇺', label: '🇦🇺 Australia APS Jobs', portal: 'APSjobs.gov.au' },
  AE: { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', label: '🇦🇪 UAE Gov Jobs', portal: 'Federal Authority FAHR' },
  SA: { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', label: '🇸🇦 Saudi Gov Jobs', portal: 'Jadarat Unified National' },
  QA: { code: 'QA', name: 'Qatar', flag: '🇶🇦', label: '🇶🇦 Qatar Gov Jobs', portal: 'Kawader Portal' },
  KW: { code: 'KW', name: 'Kuwait', flag: '🇰🇼', label: '🇰🇼 Kuwait Civil Service', portal: 'CSC Kuwait' },
  OM: { code: 'OM', name: 'Oman', flag: '🇴🇲', label: '🇴🇲 Oman Gov Jobs', portal: 'Ministry of Labour' },
  BH: { code: 'BH', name: 'Bahrain', flag: '🇧🇭', label: '🇧🇭 Bahrain Civil Service', portal: 'CSB Bahrain' },
  DE: { code: 'DE', name: 'Germany', flag: '🇩🇪', label: '🇩🇪 Germany Gov Jobs', portal: 'Bund.de Karriere' },
  FR: { code: 'FR', name: 'France', flag: '🇫🇷', label: '🇫🇷 France Public Service', portal: 'Emploi Public' },
  ES: { code: 'ES', name: 'Spain', flag: '🇪🇸', label: '🇪🇸 Spain Public Service', portal: 'Empleo Público' },
  IT: { code: 'IT', name: 'Italy', flag: '🇮🇹', label: '🇮🇹 Italy Gov Jobs', portal: 'inPA Portale' },
  SG: { code: 'SG', name: 'Singapore', flag: '🇸🇬', label: '🇸🇬 Singapore Gov Jobs', portal: 'Careers@Gov' },
  JP: { code: 'JP', name: 'Japan', flag: '🇯🇵', label: '🇯🇵 Japan Gov Jobs', portal: 'Jinji-in National Personnel' },
  KR: { code: 'KR', name: 'South Korea', flag: '🇰🇷', label: '🇰🇷 Korea Public Jobs', portal: 'ALIO Portal' },
  ZA: { code: 'ZA', name: 'South Africa', flag: '🇿🇦', label: '🇿🇦 South Africa DPSA', portal: 'DPSA Vacancies' },
  BR: { code: 'BR', name: 'Brazil', flag: '🇧🇷', label: '🇧🇷 Brazil Concursos', portal: 'Concursos Federais' },
  NZ: { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', label: '🇳🇿 NZ Public Sector', portal: 'Jobs.govt.nz' },
  IE: { code: 'IE', name: 'Ireland', flag: '🇮🇪', label: '🇮🇪 Ireland Public Jobs', portal: 'PublicJobs.ie' },
  NL: { code: 'NL', name: 'Netherlands', flag: '🇳🇱', label: '🇳🇱 Netherlands Gov Jobs', portal: 'Werkenvoornederland' },
  SE: { code: 'SE', name: 'Sweden', flag: '🇸🇪', label: '🇸🇪 Sweden Gov Jobs', portal: 'Arbetsförmedlingen' },
  NO: { code: 'NO', name: 'Norway', flag: '🇳🇴', label: '🇳🇴 Norway Public Sector', portal: 'NAV.no' }
};

export function detectInitialCountry() {
  try {
    const saved = localStorage.getItem('dh_user_country');
    if (saved && saved.length === 2) return saved.toUpperCase();

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz === 'IST') return 'IN';
    if (tz.includes('Dubai') || tz.includes('Muscat')) return 'AE';
    if (tz.includes('Riyadh')) return 'SA';
    if (tz.includes('Qatar')) return 'QA';
    if (tz.includes('Kuwait')) return 'KW';
    if (tz.includes('London')) return 'GB';
    if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Denver') || tz.includes('Phoenix')) return 'US';
    if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Montreal')) return 'CA';
    if (tz.includes('Sydney') || tz.includes('Melbourne') || tz.includes('Brisbane') || tz.includes('Perth')) return 'AU';
    if (tz.includes('Auckland')) return 'NZ';
    if (tz.includes('Dublin')) return 'IE';
    if (tz.includes('Berlin') || tz.includes('Frankfurt')) return 'DE';
    if (tz.includes('Paris')) return 'FR';
    if (tz.includes('Madrid')) return 'ES';
    if (tz.includes('Rome')) return 'IT';
    if (tz.includes('Amsterdam')) return 'NL';
    if (tz.includes('Singapore')) return 'SG';
    if (tz.includes('Tokyo')) return 'JP';
    if (tz.includes('Seoul')) return 'KR';
    if (tz.includes('Johannesburg')) return 'ZA';
    if (tz.includes('Sao_Paulo')) return 'BR';

    // If timezone doesn't match and browser language or tz is non-Indian
    if (!tz || tz.includes('Asia/')) return 'IN';
    return 'US';
  } catch (e) {
    return 'IN';
  }
}

export function useVisitorCountry() {
  const [userCountry, setUserCountry] = useState(() => detectInitialCountry());

  useEffect(() => {
    // 1. Check if we need background GeoIP verification
    const saved = localStorage.getItem('dh_user_country');
    if (!saved) {
      request('/api/global-jobs/detect-geo')
        .then(res => {
          if (res?.success && res.detectedCountry && res.detectedCountry.length === 2) {
            setUserCountry(res.detectedCountry.toUpperCase());
            localStorage.setItem('dh_user_country', res.detectedCountry.toUpperCase());
          }
        })
        .catch(() => {});
    }

    // 2. Listen to custom country/language picker updates
    const handleSync = (e) => {
      if (e.detail?.country) {
        setUserCountry(e.detail.country.toUpperCase());
      }
    };
    window.addEventListener('dh_language_changed', handleSync);
    return () => window.removeEventListener('dh_language_changed', handleSync);
  }, []);

  const isIndia = userCountry === 'IN';
  const meta = COUNTRY_META[userCountry] || {
    code: userCountry,
    name: userCountry,
    flag: '📍',
    label: `📍 ${userCountry} Gov Vacancies`,
    portal: 'Official Gazette'
  };

  return {
    userCountry,
    isIndia,
    countryMeta: meta
  };
}
