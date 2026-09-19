import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TranslateIcon from '@mui/icons-material/Translate';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublicIcon from '@mui/icons-material/Public';

// Country list with regional languages: Native language first, English common to all
export const COUNTRY_REGIONS = [
  {
    code: 'IN',
    name: 'India (भारत)',
    flag: '🇮🇳',
    languages: [
      { code: 'hi', label: 'हिंदी (Hindi - Native)', flag: '🇮🇳' },
      { code: 'en', label: 'English (Common)', flag: '🌐' },
      { code: 'bn', label: 'বাংলা (Bengali)', flag: '🇧🇩' },
      { code: 'ta', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
      { code: 'te', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
      { code: 'mr', label: 'मराठी (Marathi)', flag: '🇮🇳' },
      { code: 'gu', label: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
      { code: 'kn', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
      { code: 'ml', label: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
      { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
      { code: 'ur', label: 'اردو (Urdu)', flag: '🇵🇰' }
    ]
  },
  {
    code: 'SA',
    name: 'Saudi Arabia (السعودية)',
    flag: '🇸🇦',
    languages: [
      { code: 'ar', label: 'العربية (Arabic - Native)', flag: '🇸🇦' },
      { code: 'en', label: 'English (Common)', flag: '🌐' },
      { code: 'ur', label: 'اردو (Urdu Expat)', flag: '🇵🇰' }
    ]
  },
  {
    code: 'AE',
    name: 'UAE (Dubai / Abu Dhabi)',
    flag: '🇦🇪',
    languages: [
      { code: 'ar', label: 'العربية (Arabic - Native)', flag: '🇦🇪' },
      { code: 'en', label: 'English (Common)', flag: '🌐' },
      { code: 'ur', label: 'اردو (Urdu Expat)', flag: '🇵🇰' },
      { code: 'hi', label: 'हिंदी (Hindi Expat)', flag: '🇮🇳' }
    ]
  },
  {
    code: 'QA',
    name: 'Qatar (قطر)',
    flag: '🇶🇦',
    languages: [
      { code: 'ar', label: 'العربية (Arabic - Native)', flag: '🇶🇦' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'KW',
    name: 'Kuwait (الكويت)',
    flag: '🇰🇼',
    languages: [
      { code: 'ar', label: 'العربية (Arabic - Native)', flag: '🇰🇼' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'OM',
    name: 'Oman (عُمان)',
    flag: '🇴🇲',
    languages: [
      { code: 'ar', label: 'العربية (Arabic - Native)', flag: '🇴🇲' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'BH',
    name: 'Bahrain (البحرين)',
    flag: '🇧🇭',
    languages: [
      { code: 'ar', label: 'العربية (Arabic - Native)', flag: '🇧🇭' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'EG',
    name: 'Egypt (مصر)',
    flag: '🇪🇬',
    languages: [
      { code: 'ar', label: 'العربية (Arabic - Native)', flag: '🇪🇬' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    languages: [
      { code: 'en', label: 'English (US - Native)', flag: '🇺🇸' },
      { code: 'es', label: 'Español (Spanish)', flag: '🇪🇸' }
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    languages: [
      { code: 'en', label: 'English (UK - Native)', flag: '🇬🇧' },
      { code: 'cy', label: 'Cymraeg (Welsh)', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' }
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    languages: [
      { code: 'en', label: 'English (Native)', flag: '🇨🇦' },
      { code: 'fr', label: 'Français (French)', flag: '🇫🇷' }
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    languages: [
      { code: 'en', label: 'English (AU - Native)', flag: '🇦🇺' }
    ]
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    flag: '🇳🇿',
    languages: [
      { code: 'en', label: 'English (NZ - Native)', flag: '🇳🇿' },
      { code: 'mi', label: 'Te Reo Māori', flag: '🇳🇿' }
    ]
  },
  {
    code: 'IE',
    name: 'Ireland',
    flag: '🇮🇪',
    languages: [
      { code: 'en', label: 'English (IE - Native)', flag: '🇮🇪' },
      { code: 'ga', label: 'Gaeilge (Irish)', flag: '🇮🇪' }
    ]
  },
  {
    code: 'DE',
    name: 'Germany (Deutschland)',
    flag: '🇩🇪',
    languages: [
      { code: 'de', label: 'Deutsch (German - Native)', flag: '🇩🇪' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    languages: [
      { code: 'fr', label: 'Français (French - Native)', flag: '🇫🇷' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'ES',
    name: 'Spain (España)',
    flag: '🇪🇸',
    languages: [
      { code: 'es', label: 'Español (Spanish - Native)', flag: '🇪🇸' },
      { code: 'en', label: 'English (Common)', flag: '🌐' },
      { code: 'ca', label: 'Català (Catalan)', flag: '🇪🇸' }
    ]
  },
  {
    code: 'IT',
    name: 'Italy (Italia)',
    flag: '🇮🇹',
    languages: [
      { code: 'it', label: 'Italiano (Italian - Native)', flag: '🇮🇹' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'NL',
    name: 'Netherlands (Nederland)',
    flag: '🇳🇱',
    languages: [
      { code: 'nl', label: 'Nederlands (Dutch - Native)', flag: '🇳🇱' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'CH',
    name: 'Switzerland (Schweiz)',
    flag: '🇨🇭',
    languages: [
      { code: 'de', label: 'Deutsch (German - Native)', flag: '🇨🇭' },
      { code: 'fr', label: 'Français (French)', flag: '🇫🇷' },
      { code: 'it', label: 'Italiano (Italian)', flag: '🇮🇹' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'SE',
    name: 'Sweden (Sverige)',
    flag: '🇸🇪',
    languages: [
      { code: 'sv', label: 'Svenska (Swedish - Native)', flag: '🇸🇪' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'NO',
    name: 'Norway (Norge)',
    flag: '🇳🇴',
    languages: [
      { code: 'no', label: 'Norsk (Norwegian - Native)', flag: '🇳🇴' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'PL',
    name: 'Poland (Polska)',
    flag: '🇵🇱',
    languages: [
      { code: 'pl', label: 'Polski (Polish - Native)', flag: '🇵🇱' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    languages: [
      { code: 'pt', label: 'Português (Portuguese - Native)', flag: '🇵🇹' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'RU',
    name: 'Russia (Россия)',
    flag: '🇷🇺',
    languages: [
      { code: 'ru', label: 'Русский (Russian - Native)', flag: '🇷🇺' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'JP',
    name: 'Japan (日本)',
    flag: '🇯🇵',
    languages: [
      { code: 'ja', label: '日本語 (Japanese - Native)', flag: '🇯🇵' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'KR',
    name: 'South Korea (대한민국)',
    flag: '🇰🇷',
    languages: [
      { code: 'ko', label: '한국어 (Korean - Native)', flag: '🇰🇷' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'CN',
    name: 'China (中国)',
    flag: '🇨🇳',
    languages: [
      { code: 'zh-CN', label: '中文 (Chinese - Native)', flag: '🇨🇳' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    languages: [
      { code: 'en', label: 'English (Common)', flag: '🇸🇬' },
      { code: 'zh-CN', label: '中文 (Chinese)', flag: '🇨🇳' },
      { code: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' },
      { code: 'ta', label: 'தமிழ் (Tamil)', flag: '🇮🇳' }
    ]
  },
  {
    code: 'ID',
    name: 'Indonesia',
    flag: '🇮🇩',
    languages: [
      { code: 'id', label: 'Bahasa Indonesia (Native)', flag: '🇮🇩' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'MY',
    name: 'Malaysia',
    flag: '🇲🇾',
    languages: [
      { code: 'ms', label: 'Bahasa Melayu (Native)', flag: '🇲🇾' },
      { code: 'en', label: 'English (Common)', flag: '🌐' },
      { code: 'zh-CN', label: '中文 (Chinese)', flag: '🇨🇳' },
      { code: 'ta', label: 'தமிழ் (Tamil)', flag: '🇮🇳' }
    ]
  },
  {
    code: 'TH',
    name: 'Thailand (ไทย)',
    flag: '🇹🇭',
    languages: [
      { code: 'th', label: 'ไทย (Thai - Native)', flag: '🇹🇭' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'VN',
    name: 'Vietnam (Việt Nam)',
    flag: '🇻🇳',
    languages: [
      { code: 'vi', label: 'Tiếng Việt (Vietnamese - Native)', flag: '🇻🇳' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'PH',
    name: 'Philippines (Pilipinas)',
    flag: '🇵🇭',
    languages: [
      { code: 'tl', label: 'Filipino / Tagalog (Native)', flag: '🇵🇭' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'TR',
    name: 'Turkey (Türkiye)',
    flag: '🇹🇷',
    languages: [
      { code: 'tr', label: 'Türkçe (Turkish - Native)', flag: '🇹🇷' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'BR',
    name: 'Brazil (Brasil)',
    flag: '🇧🇷',
    languages: [
      { code: 'pt', label: 'Português (Portuguese - Native)', flag: '🇧🇷' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'MX',
    name: 'Mexico (México)',
    flag: '🇲🇽',
    languages: [
      { code: 'es', label: 'Español (Spanish - Native)', flag: '🇲🇽' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    languages: [
      { code: 'en', label: 'English (Common)', flag: '🇿🇦' },
      { code: 'af', label: 'Afrikaans', flag: '🇿🇦' },
      { code: 'zu', label: 'isiZulu', flag: '🇿🇦' }
    ]
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    languages: [
      { code: 'en', label: 'English (Common)', flag: '🇳🇬' },
      { code: 'yo', label: 'Yorùbá', flag: '🇳🇬' },
      { code: 'ha', label: 'Hausa', flag: '🇳🇬' }
    ]
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    languages: [
      { code: 'sw', label: 'Kiswahili (Native)', flag: '🇰🇪' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'PK',
    name: 'Pakistan (پاکستان)',
    flag: '🇵🇰',
    languages: [
      { code: 'ur', label: 'اردو (Urdu - Native)', flag: '🇵🇰' },
      { code: 'en', label: 'English (Common)', flag: '🌐' },
      { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇵🇰' }
    ]
  },
  {
    code: 'BD',
    name: 'Bangladesh (বাংলাদেশ)',
    flag: '🇧🇩',
    languages: [
      { code: 'bn', label: 'বাংলা (Bengali - Native)', flag: '🇧🇩' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  },
  {
    code: 'NP',
    name: 'Nepal (नेपाल)',
    flag: '🇳🇵',
    languages: [
      { code: 'ne', label: 'नेपाली (Nepali - Native)', flag: '🇳🇵' },
      { code: 'en', label: 'English (Common)', flag: '🌐' },
      { code: 'hi', label: 'हिंदी (Hindi)', flag: '🇮🇳' }
    ]
  },
  {
    code: 'LK',
    name: 'Sri Lanka (ශ්‍රී ලංකා)',
    flag: '🇱🇰',
    languages: [
      { code: 'si', label: 'සිංහල (Sinhala - Native)', flag: '🇱🇰' },
      { code: 'ta', label: 'தமிழ் (Tamil)', flag: '🇱🇰' },
      { code: 'en', label: 'English (Common)', flag: '🌐' }
    ]
  }
];

// All 33+ global languages fallback
export const ALL_LANGUAGES = [
  { code: 'hi', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { code: 'en', label: 'English (Global)', flag: '🌐' },
  { code: 'ar', label: 'العربية (Arabic)', flag: '🇸🇦' },
  { code: 'es', label: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'fr', label: 'Français (French)', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'bn', label: 'বাংলা (Bengali)', flag: '🇧🇩' },
  { code: 'ta', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { code: 'ml', label: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
  { code: 'ur', label: 'اردو (Urdu)', flag: '🇵🇰' },
  { code: 'ru', label: 'Русский (Russian)', flag: '🇷🇺' },
  { code: 'pt', label: 'Português (Portuguese)', flag: '🇧🇷' },
  { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'zh-CN', label: '中文 (Chinese 简体)', flag: '🇨🇳' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tr', label: 'Türkçe (Turkish)', flag: '🇹🇷' },
  { code: 'it', label: 'Italiano (Italian)', flag: '🇮🇹' },
  { code: 'nl', label: 'Nederlands (Dutch)', flag: '🇳🇱' },
  { code: 'pl', label: 'Polski (Polish)', flag: '🇵🇱' },
  { code: 'sv', label: 'Svenska (Swedish)', flag: '🇸🇪' },
  { code: 'no', label: 'Norsk (Norwegian)', flag: '🇳🇴' },
  { code: 'th', label: 'ไทย (Thai)', flag: '🇹🇭' },
  { code: 'vi', label: 'Tiếng Việt (Vietnamese)', flag: '🇻🇳' },
  { code: 'tl', label: 'Filipino (Tagalog)', flag: '🇵🇭' },
  { code: 'ne', label: 'नेपाली (Nepali)', flag: '🇳🇵' },
  { code: 'si', label: 'සිංහල (Sinhala)', flag: '🇱🇰' },
  { code: 'sw', label: 'Kiswahili (Swahili)', flag: '🇰🇪' }
];

// Full Website Seamless Translation Controller
// Sets cookie and triggers Google Translate combo WITHOUT harsh page reloads
export function applyFullWebsiteTranslation(langCode) {
  try {
    if (!langCode) return;
    const isOriginal = langCode === 'original';
    const targetLang = isOriginal ? '' : langCode;
    const cookieVal = isOriginal ? '' : `/auto/${targetLang}`;
    const domain = window.location.hostname;

    // 1. Write cookies
    const expires = isOriginal ? 'expires=Thu, 01 Jan 1970 00:00:00 UTC;' : 'max-age=31536000;';
    document.cookie = `googtrans=${cookieVal}; path=/; ${expires}`;
    if (domain && domain !== 'localhost' && !domain.startsWith('127.')) {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=.${domain}; ${expires}`;
      const rootDomain = domain.replace(/^www\./, '');
      if (rootDomain !== domain) {
        document.cookie = `googtrans=${cookieVal}; path=/; domain=.${rootDomain}; ${expires}`;
      }
    }

    // 2. Dispatch event to combo element
    const triggerCombo = () => {
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        if (combo.value !== targetLang) {
          combo.value = targetLang;
          combo.dispatchEvent(new Event('change', { bubbles: true }));
          combo.dispatchEvent(new Event('input', { bubbles: true }));
          if (typeof combo.onchange === 'function') {
            combo.onchange();
          }
        }
        return true;
      }
      return false;
    };

    // Instant trigger attempt
    if (!triggerCombo()) {
      // Poll smoothly for combo ready (without ever reloading the page!)
      let tries = 0;
      const interval = setInterval(() => {
        tries++;
        if (triggerCombo() || tries > 25) {
          clearInterval(interval);
        }
      }, 100);
    }

    // 3. Re-sweep passes to translate dynamic React DOM nodes as they render
    [250, 650, 1300].forEach((delay) => {
      setTimeout(triggerCombo, delay);
    });
  } catch (err) {
    console.warn('[Full Translate Error]:', err);
  }
}

export default function GlobalLanguagePicker({ isMobile = false }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [selectedLang, setSelectedLang] = useState('hi');
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  // Timezone to default country map
  const detectInitialCountry = () => {
    try {
      const savedCountry = localStorage.getItem('dh_user_country');
      if (savedCountry) return savedCountry;

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Dubai') || tz.includes('Muscat')) return 'AE';
      if (tz.includes('Riyadh')) return 'SA';
      if (tz.includes('Qatar')) return 'QA';
      if (tz.includes('Kuwait')) return 'KW';
      if (tz.includes('Cairo')) return 'EG';
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
      if (tz.includes('Zurich') || tz.includes('Geneva')) return 'CH';
      if (tz.includes('Stockholm')) return 'SE';
      if (tz.includes('Oslo')) return 'NO';
      if (tz.includes('Warsaw')) return 'PL';
      if (tz.includes('Lisbon')) return 'PT';
      if (tz.includes('Tokyo')) return 'JP';
      if (tz.includes('Seoul')) return 'KR';
      if (tz.includes('Shanghai') || tz.includes('Beijing')) return 'CN';
      if (tz.includes('Moscow')) return 'RU';
      if (tz.includes('Sao_Paulo')) return 'BR';
      if (tz.includes('Mexico_City')) return 'MX';
      if (tz.includes('Singapore')) return 'SG';
      if (tz.includes('Jakarta')) return 'ID';
      if (tz.includes('Kuala_Lumpur')) return 'MY';
      if (tz.includes('Bangkok')) return 'TH';
      if (tz.includes('Ho_Chi_Minh')) return 'VN';
      if (tz.includes('Manila')) return 'PH';
      if (tz.includes('Istanbul')) return 'TR';
      if (tz.includes('Johannesburg')) return 'ZA';
      if (tz.includes('Lagos')) return 'NG';
      if (tz.includes('Nairobi')) return 'KE';
      if (tz.includes('Karachi')) return 'PK';
      if (tz.includes('Dhaka')) return 'BD';
      if (tz.includes('Kathmandu')) return 'NP';
      if (tz.includes('Colombo')) return 'LK';
      return 'IN';
    } catch (e) {
      return 'IN';
    }
  };

  useEffect(() => {
    const c = detectInitialCountry();
    setSelectedCountry(c);

    const savedL = localStorage.getItem('dh_user_lang');
    const isLocked = localStorage.getItem('dh_user_lang_locked') === 'true';

    // Auto-pick the native language of user's detected country if not explicitly locked
    let activeL = savedL;
    if (!activeL || !isLocked) {
      const matched = COUNTRY_REGIONS.find(item => item.code === c);
      activeL = matched?.languages?.[0]?.code || 'hi';
    }

    setSelectedLang(activeL);

    // Apply translation seamlessly
    if (!document.cookie.includes(`googtrans=/auto/${activeL}`)) {
      applyFullWebsiteTranslation(activeL);
    }

    // Set HTML lang and dir
    if (typeof document !== 'undefined') {
      document.documentElement.lang = activeL;
      document.documentElement.dir = (activeL === 'ar' || activeL === 'ur' || activeL === 'fa') ? 'rtl' : 'ltr';
    }

    // Listen for custom change events from other components
    const handleSync = (e) => {
      if (e.detail?.lang) {
        setSelectedLang(e.detail.lang);
        applyFullWebsiteTranslation(e.detail.lang);
      }
      if (e.detail?.country) {
        setSelectedCountry(e.detail.country);
      }
    };
    window.addEventListener('dh_language_changed', handleSync);
    return () => window.removeEventListener('dh_language_changed', handleSync);
  }, []);

  // When user selects a Country
  const handleCountrySelect = (countryCode) => {
    setSelectedCountry(countryCode);
    try {
      localStorage.setItem('dh_user_country', countryCode);
    } catch (e) {}

    // Auto-pick the primary language for this newly selected country
    const region = COUNTRY_REGIONS.find(c => c.code === countryCode);
    if (region && region.languages?.length > 0) {
      const primaryLang = region.languages[0].code;
      handleLangSelect(primaryLang, countryCode);
    }
  };

  // When user selects a Language
  const handleLangSelect = (langCode, countryCode = selectedCountry) => {
    setSelectedLang(langCode);
    try {
      localStorage.setItem('dh_user_lang', langCode);
      localStorage.setItem('dh_user_lang_locked', 'true');
      if (countryCode) {
        localStorage.setItem('dh_user_country', countryCode);
      }
    } catch (e) {}

    // 1. Set HTML lang and dir for accessibility and SEO
    if (typeof document !== 'undefined') {
      document.documentElement.lang = langCode;
      document.documentElement.dir = (langCode === 'ar' || langCode === 'ur' || langCode === 'fa') ? 'rtl' : 'ltr';
    }

    // 2. Trigger Full-Website Headless Translation
    applyFullWebsiteTranslation(langCode);

    // 3. Dispatch global event for instant re-render across React components
    window.dispatchEvent(new CustomEvent('dh_language_changed', {
      detail: { lang: langCode, country: countryCode }
    }));

    setDialogOpen(false);
  };

  // Current active country details
  const activeRegion = COUNTRY_REGIONS.find(c => c.code === selectedCountry) || COUNTRY_REGIONS[0];
  const activeLangObj = ALL_LANGUAGES.find(l => l.code === selectedLang) || ALL_LANGUAGES[0];

  return (
    <>
      {/* Navbar Trigger Button */}
      <Button
        onClick={() => setDialogOpen(true)}
        size="small"
        startIcon={<TranslateIcon sx={{ fontSize: 16, color: '#38BDF8' }} />}
        sx={{
          borderRadius: '9999px',
          px: { xs: 1, sm: 1.4 },
          py: 0.35,
          fontSize: '0.78rem',
          fontWeight: 700,
          textTransform: 'none',
          whiteSpace: 'nowrap',
          color: isDark ? '#F3F4F6' : '#111827',
          bgcolor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(243, 244, 246, 0.9)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(75, 85, 99, 0.6)' : 'rgba(209, 213, 219, 0.8)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: isDark ? 'rgba(55, 65, 81, 0.9)' : 'rgba(229, 231, 235, 1)',
            borderColor: '#38BDF8',
            transform: 'translateY(-1px)'
          }
        }}
      >
        <span style={{ marginRight: '4px', fontSize: '0.9rem' }}>{activeRegion.flag}</span>
        {activeLangObj.label.split(' ')[0]}
      </Button>

      {/* Language & Country Selection Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDark ? '#0B0F19' : '#FFFFFF',
            border: '1px solid',
            borderColor: isDark ? '#1E293B' : '#E2E8F0',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            p: 1,
            overflow: 'hidden'
          }
        }}
      >
        {/* Header */}
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PublicIcon sx={{ color: '#0284C7', fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.2 }}>
                🌍 देश व भाषा चुनें (Language & Country)
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                देश चुनते ही उस देश की सभी प्रमुख भाषाएँ नीचे आ जाएँगी
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} size="small" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1, pb: 3 }}>
          {/* 1. Country Selection Bar */}
          <Typography variant="caption" sx={{ fontWeight: 750, color: isDark ? '#38BDF8' : '#0284C7', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            📍 1. देश चुनें (Select Country)
          </Typography>

          <Box sx={{
            display: 'flex',
            gap: 0.8,
            overflowX: 'auto',
            pb: 1.5,
            mb: 2.5,
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: isDark ? '#334155' : '#CBD5E1', borderRadius: 2 }
          }}>
            {COUNTRY_REGIONS.map((c) => {
              const isSelected = selectedCountry === c.code;
              return (
                <Chip
                  key={c.code}
                  label={`${c.flag} ${c.name.split(' ')[0]}`}
                  clickable
                  onClick={() => handleCountrySelect(c.code)}
                  sx={{
                    bgcolor: isSelected ? '#0284C7' : (isDark ? '#1E293B' : '#F1F5F9'),
                    color: isSelected ? '#FFFFFF' : (isDark ? '#E2E8F0' : '#1E293B'),
                    fontWeight: isSelected ? 800 : 600,
                    border: '1px solid',
                    borderColor: isSelected ? '#38BDF8' : (isDark ? '#334155' : '#E2E8F0'),
                    fontSize: '0.8rem',
                    height: 32,
                    '&:hover': {
                      bgcolor: isSelected ? '#0369A1' : (isDark ? '#334155' : '#E2E8F0')
                    }
                  }}
                />
              );
            })}
          </Box>

          {/* 2. Languages for Selected Country */}
          <Box sx={{
            bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC',
            p: 2,
            borderRadius: '16px',
            border: '1px solid',
            borderColor: isDark ? '#1E293B' : '#E2E8F0',
            mb: 2.5
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#34D399' : '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                🗣️ {activeRegion.flag} {activeRegion.name} की प्रमुख भाषाएँ
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                (क्लिक करते ही लागू होगा)
              </Typography>
            </Box>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
              gap: 1.2
            }}>
              {activeRegion.languages.map((lang) => {
                const isActive = selectedLang === lang.code;
                return (
                  <Button
                    key={lang.code}
                    onClick={() => handleLangSelect(lang.code)}
                    variant={isActive ? 'contained' : 'outlined'}
                    sx={{
                      justifyContent: 'space-between',
                      px: 1.5,
                      py: 1,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 800 : 600,
                      bgcolor: isActive ? '#059669' : (isDark ? '#0F172A' : '#FFFFFF'),
                      borderColor: isActive ? '#10B981' : (isDark ? '#334155' : '#CBD5E1'),
                      color: isActive ? '#FFFFFF' : (isDark ? '#F1F5F9' : '#0F172A'),
                      '&:hover': {
                        bgcolor: isActive ? '#047857' : (isDark ? '#1E293B' : '#F1F5F9'),
                        borderColor: '#059669'
                      }
                    }}
                  >
                    <span>{lang.flag} {lang.label}</span>
                    {isActive && <CheckCircleIcon sx={{ fontSize: 16, color: '#FFFFFF' }} />}
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* 3. Expandable All 33+ Languages Section */}
          <Box sx={{ textAlign: 'center' }}>
            <Button
              size="small"
              onClick={() => setShowAllLanguages(!showAllLanguages)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: isDark ? '#94A3B8' : '#64748B',
                fontSize: '0.78rem',
                '&:hover': { color: isDark ? '#F8FAFC' : '#0F172A' }
              }}
            >
              {showAllLanguages ? '▲ कम भाषाएँ दिखाएं' : '▼ विश्व की अन्य सभी 33+ भाषाएँ देखें (More Languages...)'}
            </Button>

            {showAllLanguages && (
              <Box sx={{
                mt: 2,
                p: 1.5,
                bgcolor: isDark ? '#0F172A' : '#F8FAFC',
                borderRadius: '14px',
                border: '1px solid',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
                maxHeight: 220,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                gap: 1
              }}>
                {ALL_LANGUAGES.map((l) => {
                  const isActive = selectedLang === l.code;
                  return (
                    <Button
                      key={l.code}
                      onClick={() => handleLangSelect(l.code)}
                      size="small"
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: isActive ? 800 : 500,
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        color: isActive ? '#38BDF8' : (isDark ? '#CBD5E1' : '#334155'),
                        bgcolor: isActive ? (isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)') : 'transparent',
                        borderRadius: '8px',
                        py: 0.5,
                        px: 1,
                        '&:hover': { bgcolor: isDark ? '#1E293B' : '#E2E8F0' }
                      }}
                    >
                      <span style={{ marginRight: '6px' }}>{l.flag}</span>
                      {l.label}
                    </Button>
                  );
                })}
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
