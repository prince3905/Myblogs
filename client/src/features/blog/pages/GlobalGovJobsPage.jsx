import React, { useEffect, useState, useMemo, Fragment } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import {
  Typography, Button, Box, Alert, CircularProgress,
  IconButton, TextField,
  Chip, Dialog, DialogContent, DialogTitle, DialogActions,
  Pagination, Divider, Slide
} from '@mui/material';
import {
  NotificationsActive as NotificationIcon,
  PictureAsPdf as PdfIcon, Language as WebIcon,
  AssignmentTurnedIn as ApplyIcon, CalendarToday as CalendarIcon,
  LocationOn as LocationIcon, Work as WorkIcon,
  FilterList as FilterIcon, Close as CloseIcon,
  Search as SearchIcon, Public as GlobeIcon,
  Verified as VerifiedIcon, WhatsApp as WhatsAppIcon,
  Telegram as TelegramIcon, Share as ShareIcon,
  AttachMoney as MoneyIcon, School as SchoolIcon,
  Translate as TranslateIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import AdSlot from '../../../components/AdSlot';
import { request } from '../../../shared/lib/api';
import { applyFullWebsiteTranslation, ALL_LANGUAGES } from '../../../components/GlobalLanguagePicker';
import { SOVEREIGN_COUNTRIES_195, getCountryByCode } from '../data/sovereignCountries195';
import { getCountrySeoMeta, buildHreflangMatrix } from '../data/countrySeoConfig';

// Continents for filtering
const CONTINENTS = [
  { id: 'ALL', label: '🌐 All Jurisdictions (195)', short: 'All Jurisdictions' },
  { id: 'Multilateral', label: '🇺🇳 UN & Multilateral', short: 'UN & Global' },
  { id: 'Asia', label: '🕌 Asia & Middle East', short: 'Asia & Gulf' },
  { id: 'Europe', label: '🇪🇺 Europe (44)', short: 'Europe' },
  { id: 'Americas', label: '🌎 Americas (35)', short: 'Americas' },
  { id: 'Africa', label: '🌍 Africa (54)', short: 'Africa' },
  { id: 'Oceania', label: '🏖 Oceania (14)', short: 'Oceania' }
];

// Complete 195 Sovereign Countries Directory
const COUNTRY_CATALOG = SOVEREIGN_COUNTRIES_195;

function getCountryDisplayName(code) {
  if (!code || code === 'ALL') return 'All Countries';
  const found = getCountryByCode(code);
  if (found) return `${found.flag} ${found.name}`;
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    const name = regionNames.of(code.toUpperCase());
    if (name) return name;
  } catch (e) {}
  return code;
}

function getContinentDisplayName(id) {
  if (!id || id === 'ALL') return null;
  const found = CONTINENTS.find(c => c.id === id);
  return found?.short || found?.label || id;
}

// Category Pills
const CATEGORIES = [
  { id: 'ALL', label: 'All Disciplines' },
  { id: 'Civil Service / Administrative', label: '🎖️ Civil Service & Administration' },
  { id: 'Healthcare & Medical', label: '🏥 Healthcare & Medical' },
  { id: 'Tech & Engineering', label: '💻 Tech & Engineering' },
  { id: 'Defense, Police & Security', label: '👮 Defense, Police & Security' },
  { id: 'Education & Academia', label: '🎓 Education & Academia' },
  { id: 'Finance, Revenue & Audit', label: '💼 Finance, Revenue & Audit' },
  { id: 'Diplomatic & International Relations', label: '🌐 Foreign Affairs & Diplomacy' }
];

// Timeline Tabs (Freshness Hierarchy)
const TIMELINE_TABS = [
  { id: 'ALL', label: 'All Notices', icon: '📋' },
  { id: 'today', label: '🔥 Posted Today', icon: '🟢' },
  { id: 'yesterday', label: '⚡ Posted Yesterday', icon: '🟡' },
  { id: 'this_week', label: '📅 This Week', icon: '⚪' },
  { id: 'closing_soon', label: '⏳ Closing Soon', icon: '🔴' }
];

// Timezone to Country code mapping for instant zero-latency geo-detection
const TIMEZONE_TO_COUNTRY = {
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
  'Asia/Dubai': 'AE', 'Asia/Muscat': 'OM', 'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW', 'Asia/Bahrain': 'BH',
  'Europe/London': 'GB',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Los_Angeles': 'US', 'America/Denver': 'US', 'America/Phoenix': 'US', 'America/Detroit': 'US', 'America/Indiana/Indianapolis': 'US', 'America/Boise': 'US', 'America/Anchorage': 'US', 'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Montreal': 'CA', 'America/Edmonton': 'CA', 'America/Winnipeg': 'CA', 'America/Halifax': 'CA',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU',
  'Europe/Berlin': 'DE', 'Europe/Paris': 'FR', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Vienna': 'AT', 'Europe/Zurich': 'CH', 'Europe/Warsaw': 'PL', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Helsinki': 'FI', 'Europe/Dublin': 'IE', 'Europe/Lisbon': 'PT', 'Europe/Athens': 'GR', 'Europe/Bucharest': 'RO', 'Europe/Budapest': 'HU', 'Europe/Prague': 'CZ', 'Europe/Kyiv': 'UA',
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Singapore': 'SG', 'Asia/Hong_Kong': 'HK', 'Asia/Taipei': 'TW', 'Asia/Bangkok': 'TH', 'Asia/Manila': 'PH', 'Asia/Jakarta': 'ID', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Ho_Chi_Minh': 'VN',
  'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE', 'Africa/Cairo': 'EG', 'Africa/Accra': 'GH', 'Africa/Casablanca': 'MA',
  'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX', 'America/Bogota': 'CO', 'America/Buenos_Aires': 'AR', 'America/Santiago': 'CL', 'America/Lima': 'PE',
  'Asia/Dhaka': 'BD', 'Asia/Karachi': 'PK', 'Asia/Colombo': 'LK', 'Asia/Kathmandu': 'NP', 'Asia/Kabul': 'AF'
};

function getHeroBannerContent(activeCountryCode) {
  const code = (activeCountryCode || 'ALL').toUpperCase();

  if (code === 'US') {
    return {
      title: '🇺🇸 Official US Federal Careers (USAJOBS) & Circulars 2026',
      desc: 'Live verified US Federal Government jobs, GS-grade payscales, and civilian agency circulars from USAJOBS and official federal gazettes.',
      pill: 'USAJOBS • Federal Civil Service'
    };
  }
  if (code === 'DE') {
    return {
      title: '🇩🇪 Offizieller Öffentlicher Dienst & Bund.de Stellenangebote 2026',
      desc: 'Offizielle Stellenangebote der Bundesverwaltung (Bund.de). Verifizierte Jobs für Beamte, Referenten und Sachbearbeiter im öffentlichen Dienst (TVöD).',
      pill: 'Bund.de • Bundesverwaltung Deutschland'
    };
  }
  if (code === 'ES') {
    return {
      title: '🇪🇸 Empleo Público Oficial y Convocatorias del Estado 2026',
      desc: 'Convocatorias oficiales de empleo público, plazas del Estado y boletines oficiales (BOE) verificados en España.',
      pill: 'Boletín Oficial del Estado (BOE) • Empleo Público'
    };
  }
  if (code === 'FR') {
    return {
      title: '🇫🇷 Recrutement Fonction Publique & Avis Ministériels 2026',
      desc: 'Avis de recrutement et concours officiels de la fonction publique d’État, territoriale et hospitalière vérifiés.',
      pill: 'Journal Officiel • Fonction Publique'
    };
  }
  if (code === 'SG') {
    return {
      title: '🇸🇬 Careers@Gov Singapore Public Service Vacancies 2026',
      desc: 'Official Singapore Civil Service & statutory board career opportunities from Careers@Gov. Verified public service circulars.',
      pill: 'Careers@Gov • Singapore Public Service Division'
    };
  }
  if (code === 'GB') {
    return {
      title: '🇬🇧 UK Civil Service Jobs & Government Vacancies 2026',
      desc: 'Explore verified UK Civil Service fast-stream, executive agency, and ministry vacancies across England, Scotland, Wales, and Northern Ireland.',
      pill: 'Civil Service Jobs • GOV.UK Official'
    };
  }
  if (code === 'CA') {
    return {
      title: '🇨🇦 Government of Canada Jobs (GC Jobs / Emplois GC) 2026',
      desc: 'Search live verified Government of Canada federal public service opportunities, bilingual roles, and ministerial appointments across all provinces.',
      pill: 'GC Jobs / Emplois GC • Federal Public Service'
    };
  }
  if (code === 'AU') {
    return {
      title: '🇦🇺 Australian Public Service (APS Jobs) Vacancies 2026',
      desc: 'Search live Australian Public Service (APS Level & Executive) vacancies, commonwealth agency roles, and statutory appointments across Australia.',
      pill: 'APSjobs • Australian Public Service Gazette'
    };
  }
  if (code === 'IN') {
    return {
      title: '🇮🇳 India Sarkari Result & Govt Jobs Portal 2026',
      desc: 'UPSC, SSC, Railways, Banking, Defense & State PSC official notifications, verified gazettes and direct .gov.in / .nic.in apply links.',
      pill: 'UPSC • SSC • Indian Civil Services'
    };
  }

  if (code !== 'ALL') {
    const country = getCountryByCode(code);
    const countryName = country ? country.name : code;
    const flag = country ? country.flag : '🏛️';
    return {
      title: `${flag} Official ${countryName} Public Service Vacancies & Gazettes 2026`,
      desc: `Verified public sector circulars, ministry vacancies, and civil service announcements for ${countryName} with 100% direct official links.`,
      pill: `Official Gazette • ${countryName} Public Sector`
    };
  }

  return {
    title: '🌐 Global Government Jobs & Civil Service Circulars 2026',
    desc: 'Official public service circulars, ministerial appointments & multilateral vacancies across 195 sovereign nations with 100% direct official links.',
    pill: '195 Sovereign Nations • Multilateral & Federal'
  };
}

// Country code to primary official language mapping
const COUNTRY_TO_PRIMARY_LANG = {
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

export default function GlobalGovJobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { country: routeCountry, id: routeJobId } = useParams();

  // Selected filters
  const [activeContinent, setActiveContinent] = useState(searchParams.get('continent') || 'ALL');
  const [activeCountry, setActiveCountry] = useState(routeCountry && routeCountry.length === 2 ? routeCountry.toUpperCase() : (searchParams.get('country') || 'ALL'));
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'ALL');
  const [activeTimeline, setActiveTimeline] = useState(searchParams.get('timeline') || 'ALL');
  const [activeCitizenship, setActiveCitizenship] = useState(searchParams.get('citizenship') || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Active language & Geo-detection state
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [userDetectedCountry, setUserDetectedCountry] = useState('IN');

  // Data states
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ totalActive: 0, todayCount: 0, yesterdayCount: 0, closingSoonCount: 0 });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFallbackToInternational, setIsFallbackToInternational] = useState(false);

  // 🔔 Subtle Intent Alert State (Non-intrusive 40s / 50% scroll alert)
  const [showIntentAlert, setShowIntentAlert] = useState(false);
  const [intentSubscribed, setIntentSubscribed] = useState(false);

  // Modal Detail State
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalViewMode, setModalViewMode] = useState('translated'); // 'translated' | 'original'
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [countryModalContinent, setCountryModalContinent] = useState('ALL');

  const filtered195Countries = useMemo(() => {
    const q = countrySearchQuery.trim().toLowerCase();
    return SOVEREIGN_COUNTRIES_195.filter(c => {
      const matchesContinent = countryModalContinent === 'ALL' || c.continent === countryModalContinent || c.code === 'ALL';
      const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.continent.toLowerCase().includes(q);
      return matchesContinent && matchesQuery;
    });
  }, [countrySearchQuery, countryModalContinent]);

  // 1. Automatic Geo & Language Detection on Mount (with LocalStorage Memory)
  useEffect(() => {
    try {
      const savedCountry = localStorage.getItem('dh_user_country');
      const savedLang = localStorage.getItem('dh_user_lang');

      let detectedC = savedCountry;
      let detectedL = savedLang;

      const hasExplicitUrlFilter = Boolean(
        (routeCountry && routeCountry.length === 2) ||
        searchParams.get('country') ||
        searchParams.get('continent')
      );

      // Detect country via Timezone if not saved
      if (!detectedC) {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        detectedC = TIMEZONE_TO_COUNTRY[tz] || 'US';
      }

      // Auto-assign matching language
      if (!detectedL) {
        detectedL = COUNTRY_TO_PRIMARY_LANG[detectedC] || 'en';
      }

      setUserDetectedCountry(detectedC);
      setSelectedLanguage(detectedL || 'en');

      // Async server GeoIP verification in background (sets userDetectedCountry for geo-priority ranking without filtering out global jobs)
      if (!savedCountry) {
        request('/api/global-jobs/detect-geo')
          .then(res => {
            if (res?.success && res.detectedCountry) {
              setUserDetectedCountry(res.detectedCountry);
            }
          })
          .catch(() => {});
      }

      // Global sync listener when changed via navbar picker
      const handleSync = (e) => {
        if (e.detail?.lang) setSelectedLanguage(e.detail.lang);
        if (e.detail?.country) {
          setUserDetectedCountry(e.detail.country);
        }
      };
      window.addEventListener('dh_language_changed', handleSync);
      return () => window.removeEventListener('dh_language_changed', handleSync);
    } catch (e) {
      // Safe fallback
    }
  }, []);

  // 🔔 Subtle Intent Alert Listener (40s timer OR 50% scroll)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('dh_intent_alert_dismissed') === 'true') return;

    let triggered = false;
    const triggerAlert = () => {
      if (triggered) return;
      triggered = true;
      setShowIntentAlert(true);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };

    const timer = setTimeout(triggerAlert, 40000);

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 300 && window.scrollY / scrollHeight >= 0.5) {
        triggerAlert();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleDismissIntent = () => {
    setShowIntentAlert(false);
    sessionStorage.setItem('dh_intent_alert_dismissed', 'true');
  };

  const handleSubscribeIntent = async () => {
    setIntentSubscribed(true);
    try {
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          if (OneSignal.Notifications) {
            await OneSignal.Notifications.requestPermission();
          }
        });
      } else if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
    } catch (e) {}

    setTimeout(() => {
      setShowIntentAlert(false);
      sessionStorage.setItem('dh_intent_alert_dismissed', 'true');
    }, 2000);
  };

  // Fetch Stats
  useEffect(() => {
    request('/api/global-jobs/stats')
      .then(res => {
        if (res?.success && res.stats) {
          setStats(res.stats);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Jobs
  useEffect(() => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams({
      page: currentPage,
      limit: 18,
      continent: activeContinent,
      country: activeCountry,
      category: activeCategory,
      timeline: activeTimeline,
      citizenship: activeCitizenship,
      userCountry: userDetectedCountry
    });

    if (searchTerm.trim()) {
      queryParams.append('search', searchTerm.trim());
    }

    request(`/api/global-jobs?${queryParams.toString()}`)
      .then(res => {
        if (res?.success) {
          setJobs(res.data || []);
          setPagination(res.pagination || { total: 0, totalPages: 1 });
          setIsFallbackToInternational(Boolean(res.fallbackToInternational));
        } else {
          setError('Error loading verified global government vacancies. Please retry.');
        }
      })
      .catch(err => {
        setError(err.message || 'Network connection issue');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeContinent, activeCountry, activeCategory, activeTimeline, activeCitizenship, currentPage, userDetectedCountry]);

  // Sync URL query params
  useEffect(() => {
    const params = {};
    if (activeContinent !== 'ALL') params.continent = activeContinent;
    if (activeCountry !== 'ALL') params.country = activeCountry;
    if (activeCategory !== 'ALL') params.category = activeCategory;
    if (activeTimeline !== 'ALL') params.timeline = activeTimeline;
    if (activeCitizenship !== 'ALL') params.citizenship = activeCitizenship;
    setSearchParams(params, { replace: true });
  }, [activeContinent, activeCountry, activeCategory, activeTimeline, activeCitizenship, setSearchParams]);

  // Dedicated Continent Change Handler to fix state desynchronization
  const handleContinentChange = (continentId) => {
    setActiveContinent(continentId);
    setActiveCountry('ALL');
    setCurrentPage(1);

    if (routeCountry) {
      navigate('/global-jobs', { replace: true });
    }

    const nextParams = {};
    if (continentId !== 'ALL') nextParams.continent = continentId;
    if (activeCategory !== 'ALL') nextParams.category = activeCategory;
    if (activeTimeline !== 'ALL') nextParams.timeline = activeTimeline;
    if (activeCitizenship !== 'ALL') nextParams.citizenship = activeCitizenship;
    setSearchParams(nextParams, { replace: true });
  };

  // Manual Country Change Handler (195 Nations)
  const handleCountryChange = (countryCode) => {
    setActiveCountry(countryCode);
    setActiveContinent('ALL'); // Reset continent conflict
    setUserDetectedCountry(countryCode);
    setCountryPickerOpen(false);
    setCountrySearchQuery('');
    setCurrentPage(1);

    if (countryCode === 'ALL') {
      navigate('/global-jobs', { replace: true });
    } else {
      navigate(`/global-jobs/${countryCode}`, { replace: true });
    }

    try {
      localStorage.setItem('dh_user_country', countryCode);
      // Auto-switch language to this country's primary language if user hasn't explicitly locked another language
      const targetLang = COUNTRY_TO_PRIMARY_LANG[countryCode] || 'en';
      const isLangLocked = localStorage.getItem('dh_user_lang_locked') === 'true';
      if (targetLang && !isLangLocked) {
        setSelectedLanguage(targetLang);
        applyFullWebsiteTranslation(targetLang);
        window.dispatchEvent(new CustomEvent('dh_language_changed', {
          detail: { country: countryCode, lang: targetLang }
        }));
      } else {
        window.dispatchEvent(new CustomEvent('dh_language_changed', {
          detail: { country: countryCode }
        }));
      }
    } catch (e) {}
  };

  // Deep-link auto-opener when visiting direct job URL (/global-jobs/view/:id)
  useEffect(() => {
    const targetId = routeJobId || searchParams.get('id');
    if (targetId) {
      request(`/api/global-jobs/${encodeURIComponent(targetId)}`)
        .then(res => {
          if (res?.success && res.job) {
            setSelectedJob(res.job);
            setModalViewMode('translated');
          }
        })
        .catch(err => console.warn('Failed to load deep-linked global job:', err));
    }
  }, [routeJobId, searchParams]);

  // Handle open job modal from URL param or direct click with browser history update
  const openJobModal = (job) => {
    setSelectedJob(job);
    setModalViewMode('translated');
    const ref = job.officialReferenceId || job._id;
    window.history.pushState(null, '', `/global-jobs/view/${ref}`);
  };

  const closeJobModal = () => {
    setSelectedJob(null);
    const base = activeCountry && activeCountry !== 'ALL' ? `/global-jobs/${activeCountry}` : '/global-jobs';
    window.history.pushState(null, '', base);
  };

  // Helper to get localized title
  const getDisplayTitle = (job) => {
    if (!job) return '';
    if (modalViewMode === 'original') return job.originalTitle || job.title;
    if (selectedLanguage === 'hi' && job.translations?.hi?.title) {
      return job.translations.hi.title;
    }
    if (selectedLanguage === 'ar' && job.translations?.ar?.title) {
      return job.translations.ar.title;
    }
    if (selectedLanguage === 'es' && job.translations?.es?.title) {
      return job.translations.es.title;
    }
    return job.title;
  };

  // Share helpers
  const handleWhatsAppShare = (job) => {
    const text = `🏛️ *Official Career Notice:* ${job.title}\n📍 *Jurisdiction:* ${job.countryFlag} ${job.countryName} (${job.agencyOrMinistry})\n💰 *Payscale:* ${job.salary?.amount || 'Statutory Public Scale'}\n🔗 *Verified Official Notice:* ${window.location.origin}/global-jobs?id=${job.officialReferenceId || job._id}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTelegramShare = (job) => {
    const text = `🏛️ *Official Career Notice:* ${job.title}\n📍 *Agency:* ${job.countryFlag} ${job.countryName} - ${job.agencyOrMinistry}\n💰 *Payscale:* ${job.salary?.amount || 'Statutory Scale'}`;
    const url = `${window.location.origin}/global-jobs?id=${job.officialReferenceId || job._id}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // Calculate days remaining
  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Closed / Expired';
    if (days === 1) return '⏳ 1 Day Left (Closing Soon)';
    return `⏳ ${days} Days Left`;
  };

  // Helper to extract clean quantitative salary for Google Jobs schema
  const parseSalaryValue = (salaryStr, currency = 'USD') => {
    if (!salaryStr) return undefined;
    const nums = (salaryStr.match(/\d[\d,]*/g) || []).map(n => parseInt(n.replace(/,/g, ''), 10)).filter(n => !isNaN(n) && n > 0);
    if (nums.length === 0) return undefined;
    const isMonth = /month/i.test(salaryStr);
    const unitText = isMonth ? 'MONTH' : 'YEAR';
    return {
      '@type': 'MonetaryAmount',
      currency: currency || 'USD',
      value: {
        '@type': 'QuantitativeValue',
        minValue: nums[0],
        maxValue: nums[1] || nums[0],
        unitText
      }
    };
  };

  const safeIsoDate = (val, fallback = undefined) => {
    if (!val) return fallback;
    const d = new Date(val);
    return !isNaN(d.getTime()) ? d.toISOString() : fallback;
  };

  // Dynamic Google for Jobs JSON-LD Structured Data Schema
  const jobSchema = useMemo(() => {
    if (selectedJob) {
      const salaryObj = parseSalaryValue(selectedJob.salary?.amount, selectedJob.salary?.currency);
      return {
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        title: selectedJob.title,
        description: selectedJob.description || selectedJob.officialGazetteSummary || selectedJob.title,
        identifier: {
          '@type': 'PropertyValue',
          name: selectedJob.agencyOrMinistry || 'Official Government Body',
          value: selectedJob.officialReferenceId || selectedJob._id
        },
        datePosted: safeIsoDate(selectedJob.createdAt, new Date().toISOString()),
        validThrough: safeIsoDate(selectedJob.applicationDeadline),
        employmentType: 'FULL_TIME',
        hiringOrganization: {
          '@type': 'Organization',
          name: selectedJob.agencyOrMinistry || selectedJob.countryName,
          sameAs: selectedJob.officialNoticeUrl
        },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressCountry: selectedJob.countryCode || 'IN',
            addressLocality: selectedJob.dutyStation || selectedJob.countryName
          }
        },
        baseSalary: salaryObj
      };
    }

    if (jobs && jobs.length > 0) {
      return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: jobs.slice(0, 10).map((j, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          item: {
            '@type': 'JobPosting',
            title: j.title,
            description: j.officialGazetteSummary || j.title,
            datePosted: safeIsoDate(j.createdAt, new Date().toISOString()),
            validThrough: safeIsoDate(j.applicationDeadline),
            hiringOrganization: {
              '@type': 'Organization',
              name: j.agencyOrMinistry || j.countryName,
              sameAs: j.officialNoticeUrl
            },
            jobLocation: {
              '@type': 'Place',
              address: {
                '@type': 'PostalAddress',
                addressCountry: j.countryCode || 'IN'
              }
            }
          }
        }))
      };
    }
    return null;
  }, [selectedJob, jobs]);

  // Country-Tailored Hero Banner Content
  const heroContent = useMemo(() => {
    return getHeroBannerContent(activeCountry);
  }, [activeCountry]);

  // Dynamic International SEO Metadata, Canonical & Hreflang Matrix
  const seoMeta = useMemo(() => {
    return getCountrySeoMeta(activeCountry);
  }, [activeCountry]);

  const hreflangMatrix = useMemo(() => {
    return buildHreflangMatrix(activeCountry);
  }, [activeCountry]);

  const pageCanonical = useMemo(() => {
    if (selectedJob) {
      const ref = selectedJob.officialReferenceId || selectedJob._id;
      return `https://www.digitalhomeblog.in/global-jobs/view/${encodeURIComponent(ref)}`;
    }
    return seoMeta.canonical;
  }, [selectedJob, seoMeta]);

  return (
    <Layout>
      <Seo
        title={selectedJob ? `${selectedJob.title} (${selectedJob.agencyOrMinistry}) - ${selectedJob.countryName} | Global Gov Jobs 2026` : seoMeta.title}
        description={selectedJob ? `Official vacancy circular: ${selectedJob.title} under ${selectedJob.agencyOrMinistry}, ${selectedJob.countryName}. Check payscale, qualifications & apply online.` : seoMeta.description}
        canonical={pageCanonical}
        keywords={seoMeta.keywords}
        hreflangs={hreflangMatrix}
        jsonLd={jobSchema}
      />

      {/* 🟢 TOP STATUS & LANGUAGE BAR */}
      <Box sx={{
        bgcolor: '#0B0F19',
        borderBottom: '1px solid #1E293B',
        py: 1,
        px: { xs: 2, md: 4 }
      }}>
        <Box sx={{
          maxWidth: 1400,
          mx: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5
        }}>
          {/* Live Sync Pulse */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#10B981',
              boxShadow: '0 0 10px #10B981',
              animation: 'pulse 2s infinite'
            }} />
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
              🟢 195 Sovereign Countries Live Sync Active • Zero Fake Links Policy
            </Typography>
          </Box>

          {/* Controls: Country Picker Flare (Language is handled centrally in Navbar) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Quick Country Flare */}
            <Button
              size="small"
              onClick={() => setCountryPickerOpen(true)}
              startIcon={<GlobeIcon sx={{ color: '#38BDF8', fontSize: 16 }} />}
              sx={{
                bgcolor: '#1E293B',
                color: '#F8FAFC',
                textTransform: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: '8px',
                px: 1.5,
                border: '1px solid #334155',
                '&:hover': { bgcolor: '#334155' }
              }}
            >
              📍 {activeCountry !== 'ALL'
                ? getCountryDisplayName(activeCountry)
                : (activeContinent !== 'ALL'
                    ? `${getContinentDisplayName(activeContinent)} Hub`
                    : '🌐 Global Careers (195 Nations)')} 🔄
            </Button>
          </Box>
        </Box>
      </Box>

      {/* 🏛️ HERO BAR (Live Alerts Style with Quick Stats) */}
      <Box sx={{
        background: 'linear-gradient(180deg, #0B0F19 0%, #0F172A 100%)',
        borderBottom: '1px solid #1E293B',
        pt: { xs: 3, md: 4 },
        pb: 3,
        px: { xs: 2, md: 4 }
      }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          {/* Main Title Banner */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Chip
                  label={heroContent.pill}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38BDF8',
                    fontWeight: 700,
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontSize: '0.75rem'
                  }}
                />
                <Chip
                  icon={<VerifiedIcon sx={{ fontSize: '14px !important', color: '#10B981 !important' }} />}
                  label="100% Verified Official Gazettes"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.12)',
                    color: '#34D399',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              </Box>
              <Typography variant="h4" sx={{
                color: '#F8FAFC',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.3rem', sm: '1.75rem', md: '2.15rem' }
              }}>
                {heroContent.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5, maxWidth: 850, lineHeight: 1.6 }}>
                {heroContent.desc}
              </Typography>
            </Box>

            {/* Quick Stats Grid */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap'
            }}>
              <Box sx={{
                bgcolor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '10px',
                px: 2,
                py: 1,
                textAlign: 'center'
              }}>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontWeight: 600 }}>
                  🔥 New Today
                </Typography>
                <Typography variant="h6" sx={{ color: '#38BDF8', fontWeight: 800, lineHeight: 1 }}>
                  {stats.todayCount || 18}
                </Typography>
              </Box>
              <Box sx={{
                bgcolor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '10px',
                px: 2,
                py: 1,
                textAlign: 'center'
              }}>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontWeight: 600 }}>
                  ⚡ Yesterday
                </Typography>
                <Typography variant="h6" sx={{ color: '#FBBF24', fontWeight: 800, lineHeight: 1 }}>
                  {stats.yesterdayCount || 24}
                </Typography>
              </Box>
              <Box sx={{
                bgcolor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '10px',
                px: 2,
                py: 1,
                textAlign: 'center'
              }}>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontWeight: 600 }}>
                  ⏳ Closing Soon
                </Typography>
                <Typography variant="h6" sx={{ color: '#F43F5E', fontWeight: 800, lineHeight: 1 }}>
                  {stats.closingSoonCount || 11}
                </Typography>
              </Box>
              <Box sx={{
                bgcolor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '10px',
                px: 2,
                py: 1,
                textAlign: 'center'
              }}>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontWeight: 600 }}>
                  🌐 Total Active
                </Typography>
                <Typography variant="h6" sx={{ color: '#34D399', fontWeight: 800, lineHeight: 1 }}>
                  {stats.totalActive || 150}+
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Search Box */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by job title, ministry, department, duty station, or reference ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setCurrentPage(1); }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#64748B', mr: 1 }} />
              }}
              sx={{
                bgcolor: '#0B0F19',
                borderRadius: '10px',
                '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#38BDF8' },
                input: { color: '#F8FAFC', fontSize: '0.9rem' }
              }}
            />
            <Button
              variant="contained"
              onClick={() => setCurrentPage(1)}
              sx={{
                bgcolor: '#0284C7',
                color: '#FFFFFF',
                fontWeight: 700,
                px: 3,
                borderRadius: '10px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#0369A1' }
              }}
            >
              Search
            </Button>
          </Box>
        </Box>
      </Box>

      {/* 🧭 FILTER SYSTEM (3 Responsive Rows) */}
      <Box sx={{
        bgcolor: '#0F172A',
        borderBottom: '1px solid #1E293B',
        py: 2,
        px: { xs: 2, md: 4 }
      }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Row 1: Continents & World Hubs */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            pb: 0.5,
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#334155', borderRadius: 2 }
          }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, whiteSpace: 'nowrap', mr: 1 }}>
              Region / Continent:
            </Typography>
            {CONTINENTS.map(cont => (
              <Chip
                key={cont.id}
                label={cont.label}
                clickable
                onClick={() => handleContinentChange(cont.id)}
                sx={{
                  bgcolor: activeContinent === cont.id ? '#0284C7' : '#1E293B',
                  color: activeContinent === cont.id ? '#FFFFFF' : '#CBD5E1',
                  fontWeight: activeContinent === cont.id ? 700 : 500,
                  border: '1px solid',
                  borderColor: activeContinent === cont.id ? '#38BDF8' : '#334155',
                  fontSize: '0.8rem',
                  height: 32,
                  '&:hover': { bgcolor: activeContinent === cont.id ? '#0369A1' : '#334155' }
                }}
              />
            ))}

            {/* Clean trigger button for 195 Sovereign Countries modal */}
            <Button
              variant="outlined"
              size="small"
              onClick={() => setCountryPickerOpen(true)}
              startIcon={<SearchIcon sx={{ fontSize: '15px !important', color: '#38BDF8' }} />}
              sx={{
                textTransform: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                height: 32,
                px: 1.5,
                whiteSpace: 'nowrap',
                color: activeCountry !== 'ALL' ? '#38BDF8' : '#CBD5E1',
                borderColor: activeCountry !== 'ALL' ? '#0284C7' : '#334155',
                bgcolor: activeCountry !== 'ALL' ? 'rgba(2, 132, 199, 0.2)' : '#1E293B',
                borderRadius: '16px',
                flexShrink: 0,
                '&:hover': { bgcolor: '#334155', borderColor: '#38BDF8' }
              }}
            >
              {activeCountry !== 'ALL' ? getCountryDisplayName(activeCountry) : '🌍 Select Jurisdiction (195 Nations)'}
            </Button>
          </Box>

          {/* Row 2: Categories / Sector Pills */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            pb: 0.5,
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#334155', borderRadius: 2 }
          }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, whiteSpace: 'nowrap', mr: 1 }}>
              Discipline / Category:
            </Typography>
            {CATEGORIES.map(cat => (
              <Chip
                key={cat.id}
                label={cat.label}
                clickable
                onClick={() => { setActiveCategory(cat.id); setCurrentPage(1); }}
                sx={{
                  bgcolor: activeCategory === cat.id ? '#4F46E5' : '#1E293B',
                  color: activeCategory === cat.id ? '#FFFFFF' : '#94A3B8',
                  fontWeight: activeCategory === cat.id ? 700 : 500,
                  border: '1px solid',
                  borderColor: activeCategory === cat.id ? '#6366F1' : '#334155',
                  fontSize: '0.78rem',
                  height: 28,
                  '&:hover': { bgcolor: activeCategory === cat.id ? '#4338CA' : '#334155' }
                }}
              />
            ))}
          </Box>

          {/* Row 3: Timeline & Eligibility Filters */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            pt: 0.5
          }}>
            {/* Timeline Tabs */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflowX: 'auto' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, whiteSpace: 'nowrap', mr: 0.5 }}>
                Timeline / Freshness:
              </Typography>
              {TIMELINE_TABS.map(tab => (
                <Chip
                  key={tab.id}
                  label={tab.label}
                  clickable
                  onClick={() => { setActiveTimeline(tab.id); setCurrentPage(1); }}
                  sx={{
                    bgcolor: activeTimeline === tab.id ? '#10B981' : '#1E293B',
                    color: activeTimeline === tab.id ? '#FFFFFF' : '#94A3B8',
                    fontWeight: activeTimeline === tab.id ? 700 : 500,
                    border: '1px solid',
                    borderColor: activeTimeline === tab.id ? '#34D399' : '#334155',
                    fontSize: '0.78rem',
                    height: 28,
                    '&:hover': { bgcolor: activeTimeline === tab.id ? '#059669' : '#334155' }
                  }}
                />
              ))}
            </Box>

            {/* Expat / Citizenship Toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant={activeCitizenship === 'expat' ? 'contained' : 'outlined'}
                onClick={() => {
                  setActiveCitizenship(activeCitizenship === 'expat' ? 'ALL' : 'expat');
                  setCurrentPage(1);
                }}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  height: 28,
                  borderRadius: '6px',
                  bgcolor: activeCitizenship === 'expat' ? '#059669' : 'transparent',
                  borderColor: '#059669',
                  color: activeCitizenship === 'expat' ? '#FFFFFF' : '#34D399',
                  '&:hover': { bgcolor: '#059669', color: '#FFFFFF' }
                }}
              >
                🌍 Visa Sponsored / International Friendly
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 🟢 High-CTR Responsive Google AdSense Banner below Filter Controls */}
      <Box sx={{ bgcolor: '#0B0F19', pt: 2.5, pb: 1, px: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto', textAlign: 'center' }}>
          <AdSlot format="horizontal" style={{ my: 1 }} />
        </Box>
      </Box>

      {/* 💼 MAIN CONTENT: JOB GRID */}
      <Box sx={{
        bgcolor: '#0B0F19',
        minHeight: '60vh',
        py: 4,
        px: { xs: 2, md: 4 }
      }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          {/* 🇮🇳 Special Indian Candidate Advisory: Direct 1-Click Access to 940+ Sarkari Live Alerts */}
          {userDetectedCountry === 'IN' && (
            <Box sx={{
              mb: 3,
              p: { xs: 2, sm: 2.5 },
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(16, 185, 129, 0.12) 100%)',
              border: '1.5px solid rgba(249, 115, 22, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 280 }}>
                <Box sx={{
                  width: 46,
                  height: 46,
                  borderRadius: '12px',
                  bgcolor: 'rgba(249, 115, 22, 0.2)',
                  border: '1px solid rgba(249, 115, 22, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.7rem',
                  flexShrink: 0
                }}>
                  🇮🇳
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ color: '#F8FAFC', fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                      भारतीय सरकारी नौकरी (Sarkari Alert) खोज रहे हैं?
                    </Typography>
                    <Chip
                      label="940+ सक्रिय सरकारी भर्तियां"
                      size="small"
                      sx={{ bgcolor: '#10B981', color: '#FFFFFF', fontWeight: 750, fontSize: '0.68rem', height: 20 }}
                    />
                  </Box>
                  <Typography sx={{ color: '#CBD5E1', fontSize: '0.8rem', mt: 0.4, lineHeight: 1.4 }}>
                    UPSC, SSC, रेलवे, बैंक व सभी राज्य लोक सेवा आयोगों (State PSCs) के लाइव सरकारी रिजल्ट व आवेदन फॉर्म।
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                onClick={() => navigate('/india/sarkari-jobs')}
                sx={{
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  fontWeight: 850,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 3,
                  py: 1.1,
                  boxShadow: '0 4px 18px rgba(249, 115, 22, 0.45)',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                🇮🇳 सभी भारतीय सरकारी रिजल्ट व भर्तियां देखें ↗
              </Button>
            </Box>
          )}

          {/* Feedback & Loading states */}
          {loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#38BDF8', mb: 2 }} />
              <Typography sx={{ color: '#94A3B8', fontWeight: 600 }}>
                Loading verified global government vacancies & official gazettes...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ bgcolor: '#1E293B', color: '#F87171', border: '1px solid #EF4444', mb: 3 }}>
              {error}
            </Alert>
          )}

          {!loading && jobs.length === 0 && (() => {
            const activeRegionName = (activeCountry && activeCountry !== 'ALL')
              ? getCountryDisplayName(activeCountry)
              : (activeContinent && activeContinent !== 'ALL')
                ? (getContinentDisplayName(activeContinent) || activeContinent)
                : null;

            return (
              <Box sx={{
                textAlign: 'center',
                py: 6,
                px: { xs: 2.5, sm: 4 },
                bgcolor: '#0F172A',
                borderRadius: '16px',
                border: '1px solid #1E293B',
                maxWidth: 720,
                mx: 'auto',
                my: 3
              }}>
                <GlobeIcon sx={{ fontSize: 56, color: '#38BDF8', mb: 1.5, opacity: 0.85 }} />
                <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 800 }}>
                  {activeRegionName
                    ? `No direct vacancies in ${activeRegionName} right now.`
                    : "No government vacancies found as per the selected filter."}
                </Typography>
                <Typography variant="body2" sx={{ color: '#94A3B8', mt: 1, mb: 3 }}>
                  {activeRegionName
                    ? `Official gazette notifications for ${activeRegionName} are being actively tracked. In the meantime, explore verified open international & multilateral vacancies:`
                    : "Please reset filters or select another country or category."}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setActiveCountry('UN');
                      setActiveContinent('ALL');
                      setActiveCategory('ALL');
                      setActiveTimeline('ALL');
                      setActiveCitizenship('ALL');
                      setSearchTerm('');
                      setCurrentPage(1);
                      navigate('/global-jobs/UN', { replace: true });
                    }}
                    sx={{
                      bgcolor: '#0284C7',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 3,
                      py: 1.2,
                      borderRadius: '10px',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                      '&:hover': { bgcolor: '#0369A1' }
                    }}
                  >
                    Explore Multilateral / UN & Remote Global Jobs →
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setActiveContinent('ALL');
                      setActiveCountry('ALL');
                      setActiveCategory('ALL');
                      setActiveTimeline('ALL');
                      setActiveCitizenship('ALL');
                      setSearchTerm('');
                      setCurrentPage(1);
                      if (routeCountry) {
                        navigate('/global-jobs', { replace: true });
                      } else {
                        setSearchParams({}, { replace: true });
                      }
                    }}
                    sx={{
                      color: '#CBD5E1',
                      borderColor: '#334155',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2.5,
                      py: 1.2,
                      borderRadius: '10px',
                      '&:hover': { borderColor: '#64748B', color: '#F8FAFC', bgcolor: 'rgba(255,255,255,0.03)' }
                    }}
                  >
                    🌐 All 195 Countries
                  </Button>
                </Box>
              </Box>
            );
          })()}

          {/* High-Yield Top Feed AdSense Unit */}
          <AdSlot format="incontent" style={{ my: 3 }} />

          {/* Smart Universal Fallback Notice for All 195 Countries */}
          {!loading && isFallbackToInternational && activeCountry !== 'ALL' && (
            <Box sx={{
              mb: 3,
              p: 2.5,
              borderRadius: '16px',
              bgcolor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 2.5
            }}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                bgcolor: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <GlobeIcon sx={{ color: '#38BDF8', fontSize: 28 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#F8FAFC', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <span>{getCountryDisplayName(activeCountry)}</span>
                  <Chip
                    label="24/7 Official Gazette Tracking Active"
                    size="small"
                    sx={{ bgcolor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', fontWeight: 700, fontSize: '0.72rem' }}
                  />
                </Typography>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem', mt: 0.5, lineHeight: 1.5 }}>
                  Official gazette circulars for {getCountryDisplayName(activeCountry)} are actively tracked 24/7. Verified multilateral, UN, and international civil service vacancies currently open to applicants worldwide are displayed below:
                </Typography>
              </Box>
            </Box>
          )}

          {/* Job Cards Grid */}
          {!loading && jobs.length > 0 && (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 2.5
            }}>
              {jobs.map((job, idx) => {
                const daysLeft = getDaysRemaining(job.applicationDeadline);
                const isUrgent = daysLeft && (daysLeft.includes('1 ') || daysLeft.includes('2 ') || daysLeft.includes('3 ') || daysLeft.includes('Day'));

                return (
                  <Fragment key={job._id || job.officialReferenceId || idx}>
                    {/* Native In-Feed Ad Slot between Card #3 and Card #4 */}
                    {idx === 3 && (
                      <Box sx={{
                        bgcolor: '#0F172A',
                        border: '1px solid #1E293B',
                        borderRadius: '16px',
                        p: 2.5,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: 340,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: 'rgba(56, 189, 248, 0.4)',
                          boxShadow: '0 12px 24px -10px rgba(56, 189, 248, 0.15)'
                        }
                      }}>
                        <Box sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 3,
                          background: 'linear-gradient(90deg, #38BDF8, #818CF8, #34D399)'
                        }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '6px',
                              bgcolor: 'rgba(56, 189, 248, 0.12)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <VerifiedIcon sx={{ fontSize: 16, color: '#38BDF8' }} />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: '0.04em' }}>
                              OFFICIAL CAREER ADVISORY
                            </Typography>
                          </Box>
                          <Chip
                            label="Sponsored Notice"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(251, 191, 36, 0.1)',
                              color: '#FBBF24',
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              height: 22,
                              border: '1px solid rgba(251, 191, 36, 0.25)'
                            }}
                          />
                        </Box>
                        <Box sx={{ my: 'auto', py: 1.5, textAlign: 'center' }}>
                          <AdSlot format="infeed" />
                        </Box>
                        <Box sx={{ pt: 1.5, borderTop: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
                            Advertisement • Google Certified Public Ads
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 600, fontSize: '0.72rem' }}>
                            Trusted Partner
                          </Typography>
                        </Box>
                      </Box>
                    )}

                  <Box
                    key={job._id || job.officialReferenceId}
                    sx={{
                      bgcolor: '#0F172A',
                      border: '1px solid #1E293B',
                      borderRadius: '16px',
                      p: 2.5,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        borderColor: '#38BDF8',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 24px -10px rgba(56, 189, 248, 0.2)'
                      }
                    }}
                  >
                    {/* Top Flare Bar */}
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      bgcolor: job.countryCode === 'IN' ? '#F97316' : (job.continent === 'Multilateral' ? '#0284C7' : '#10B981')
                    }} />

                    {/* Top Row: Country + Ministry Badge + Verification */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
                        <Chip
                          label={`${job.countryFlag || '🌐'} ${job.countryName}`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(56, 189, 248, 0.1)',
                            color: '#38BDF8',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            border: '1px solid rgba(56, 189, 248, 0.2)'
                          }}
                        />

                        {/* Status Badges */}
                        {isUrgent ? (
                          <Chip
                            label="Closing Soon"
                            size="small"
                            sx={{ bgcolor: 'rgba(244, 63, 94, 0.2)', color: '#FB7185', fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        ) : (
                          <Chip
                            icon={<VerifiedIcon sx={{ fontSize: '13px !important', color: '#10B981 !important' }} />}
                            label="Verified Gazette"
                            size="small"
                            sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#34D399', fontWeight: 600, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>

                      {/* Ministry / Department */}
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        {job.agencyOrMinistry}
                      </Typography>

                      {/* Job Title */}
                      <Typography
                        variant="h6"
                        onClick={() => openJobModal(job)}
                        sx={{
                          color: '#F8FAFC',
                          fontWeight: 800,
                          fontSize: '1.05rem',
                          lineHeight: 1.35,
                          cursor: 'pointer',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          '&:hover': { color: '#38BDF8' }
                        }}
                      >
                        {selectedLanguage === 'hi' && job.translations?.hi?.title ? job.translations.hi.title : job.title}
                      </Typography>

                      {/* Key Facts Pills */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2, mb: 2 }}>
                        {/* Salary */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MoneyIcon sx={{ color: '#10B981', fontSize: 18 }} />
                          <Typography variant="body2" sx={{ color: '#34D399', fontWeight: 700, fontSize: '0.85rem' }}>
                            {job.salary?.amount || 'As per Official Rules'}
                          </Typography>
                        </Box>

                        {/* Duty Station */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon sx={{ color: '#64748B', fontSize: 18 }} />
                          <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.8rem' }}>
                            {job.dutyStation}
                          </Typography>
                        </Box>

                        {/* Education / Eligibility */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon sx={{ color: '#64748B', fontSize: 18 }} />
                          <Typography variant="caption" sx={{
                            color: '#94A3B8',
                            fontSize: '0.78rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {job.eligibility?.education || 'University Degree or statutory qualification'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Bottom Actions Row */}
                    <Box sx={{ pt: 1.5, borderTop: '1px solid #1E293B' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: isUrgent ? '#FB7185' : '#94A3B8', fontWeight: 700 }}>
                          {daysLeft || 'Active Notice'}
                        </Typography>

                        {/* Visa / Expat Badge */}
                        <Chip
                          label={job.eligibility?.visaSponsored ? '🌍 Visa Sponsored' : '🏛️ Citizen / Statutory'}
                          size="small"
                          sx={{
                            bgcolor: job.eligibility?.visaSponsored ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                            color: job.eligibility?.visaSponsored ? '#34D399' : '#94A3B8',
                            fontWeight: 600,
                            fontSize: '0.68rem',
                            height: 22
                          }}
                        />
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={() => openJobModal(job)}
                          startIcon={<ApplyIcon sx={{ fontSize: 18 }} />}
                          sx={{
                            bgcolor: '#0284C7',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            textTransform: 'none',
                            borderRadius: '8px',
                            py: 0.8,
                            '&:hover': { bgcolor: '#0369A1' }
                          }}
                        >
                          View Verified Notice & Apply ↗
                        </Button>

                        {/* WhatsApp Share */}
                        <IconButton
                          size="small"
                          onClick={() => handleWhatsAppShare(job)}
                          sx={{
                            bgcolor: 'rgba(37, 211, 102, 0.12)',
                            color: '#25D366',
                            borderRadius: '8px',
                            '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.25)' }
                          }}
                        >
                          <WhatsAppIcon sx={{ fontSize: 18 }} />
                        </IconButton>

                        {/* Telegram Share */}
                        <IconButton
                          size="small"
                          onClick={() => handleTelegramShare(job)}
                          sx={{
                            bgcolor: 'rgba(0, 136, 204, 0.12)',
                            color: '#0088cc',
                            borderRadius: '8px',
                            '&:hover': { bgcolor: 'rgba(0, 136, 204, 0.25)' }
                          }}
                        >
                          <TelegramIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                  </Fragment>
                );
              })}
            </Box>
          )}

          {/* High-Yield In-Feed / After-Feed AdSense Unit */}
          <AdSlot format="afterpost" style={{ my: 4 }} />

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <Pagination
                count={pagination.totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                sx={{
                  '.MuiPaginationItem-root': {
                    color: '#94A3B8',
                    borderColor: '#334155',
                    fontWeight: 600,
                    '&.Mui-selected': { bgcolor: '#0284C7', color: '#FFFFFF' },
                    '&:hover': { bgcolor: '#1E293B' }
                  }
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* 🌟 ULTRA-PREMIUM OBSIDIAN DETAIL MODAL (Popup Drawer) */}
      <Dialog
        open={Boolean(selectedJob)}
        onClose={closeJobModal}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            bgcolor: '#0B0F19',
            backgroundImage: 'none',
            borderRadius: { xs: '18px', sm: '24px' },
            border: '1px solid #334155',
            boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.9)',
            color: '#F8FAFC',
            margin: { xs: 1, sm: 3 },
            height: { xs: '90vh', sm: '86vh' },
            maxHeight: { xs: '90vh', sm: '86vh' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        }}
      >
        {selectedJob && (
          <>
            {/* Modal Header */}
            <DialogTitle sx={{
              p: { xs: 2, sm: 2.5 },
              bgcolor: '#0F172A',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  bgcolor: '#1E293B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  border: '1px solid #334155'
                }}>
                  {selectedJob.countryFlag || '🏛️'}
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#38BDF8', fontWeight: 700 }}>
                      {selectedJob.countryName} • {selectedJob.continent}
                    </Typography>
                    <Chip
                      icon={<VerifiedIcon sx={{ fontSize: '13px !important', color: '#10B981 !important' }} />}
                      label="Official Gazette Circular"
                      size="small"
                      sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#34D399', fontWeight: 600, height: 20, fontSize: '0.68rem' }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                    {selectedJob.agencyOrMinistry}
                  </Typography>
                </Box>
              </Box>

              <IconButton onClick={closeJobModal} sx={{ color: '#94A3B8', '&:hover': { color: '#F8FAFC' } }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            {/* Modal Content - Scrollable */}
            <DialogContent
              id="global-gov-job-modal-content"
              dividers
              sx={{
                p: { xs: 2, sm: 3 },
                bgcolor: '#0B0F19',
                borderColor: '#1E293B',
                flex: '1 1 auto',
                minHeight: 0,
                overflowY: 'auto !important',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                '&::-webkit-scrollbar': { width: '8px' },
                '&::-webkit-scrollbar-track': { background: '#0B0F19' },
                '&::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: '4px' },
                '&::-webkit-scrollbar-thumb:hover': { background: '#475569' }
              }}
            >
              {/* Dual Language Switcher inside Modal */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: '#0F172A',
                p: 1.5,
                borderRadius: '12px',
                border: '1px solid #1E293B',
                mb: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TranslateIcon sx={{ color: '#A855F7', fontSize: 20 }} />
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                    Language Mode:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant={modalViewMode === 'translated' ? 'contained' : 'outlined'}
                    onClick={() => setModalViewMode('translated')}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      bgcolor: modalViewMode === 'translated' ? '#4F46E5' : 'transparent',
                      color: modalViewMode === 'translated' ? '#FFFFFF' : '#A5B4FC',
                      borderColor: '#4F46E5'
                    }}
                  >
                    🌐 Translated View
                  </Button>
                  <Button
                    size="small"
                    variant={modalViewMode === 'original' ? 'contained' : 'outlined'}
                    onClick={() => setModalViewMode('original')}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      bgcolor: modalViewMode === 'original' ? '#0284C7' : 'transparent',
                      color: modalViewMode === 'original' ? '#FFFFFF' : '#7DD3FC',
                      borderColor: '#0284C7'
                    }}
                  >
                    🏛️ Original Official Gazette
                  </Button>
                </Box>
              </Box>

              {/* Title Header */}
              <Typography variant="h5" sx={{ color: '#F8FAFC', fontWeight: 900, mb: 1, lineHeight: 1.3 }}>
                {getDisplayTitle(selectedJob)}
              </Typography>
              {selectedJob.officialReferenceId && (
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 3 }}>
                  Reference Code: {selectedJob.officialReferenceId}
                </Typography>
              )}

              {/* Fact Highlights Grid */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 2,
                mb: 3
              }}>
                <Box sx={{ bgcolor: '#0F172A', p: 2, borderRadius: '12px', border: '1px solid #1E293B' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                    💰 Payscale / Grade
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#34D399', fontWeight: 800, mt: 0.5 }}>
                    {selectedJob.salary?.amount}
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: '#0F172A', p: 2, borderRadius: '12px', border: '1px solid #1E293B' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                    📍 Official Duty Station
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#F8FAFC', fontWeight: 700, mt: 0.5 }}>
                    {selectedJob.dutyStation}
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: '#0F172A', p: 2, borderRadius: '12px', border: '1px solid #1E293B' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                    🎓 Educational Qualification
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#CBD5E1', fontWeight: 600, mt: 0.5 }}>
                    {selectedJob.eligibility?.education || 'University Degree or recognized statutory qualification'}
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: '#0F172A', p: 2, borderRadius: '12px', border: '1px solid #1E293B' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                    ⏳ Application Deadline
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#FB7185', fontWeight: 800, mt: 0.5 }}>
                    {selectedJob.applicationDeadline ? new Date(selectedJob.applicationDeadline).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Refer to Official Gazette'}
                  </Typography>
                </Box>
              </Box>

              {/* Detailed Description / Gazette Summary */}
              {(selectedJob.description || selectedJob.officialGazetteSummary) && (
                <Box sx={{
                  bgcolor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  p: 2.5,
                  mb: 3
                }}>
                  <Typography variant="subtitle2" sx={{ color: '#38BDF8', fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📋 Official Role Overview & Gazette Summary
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#CBD5E1', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {selectedJob.description || selectedJob.officialGazetteSummary}
                  </Typography>
                </Box>
              )}

              {/* Key Responsibilities */}
              {selectedJob.keyResponsibilities && selectedJob.keyResponsibilities.length > 0 && (
                <Box sx={{
                  bgcolor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  p: 2.5,
                  mb: 3
                }}>
                  <Typography variant="subtitle2" sx={{ color: '#F59E0B', fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🎯 Key Duties & Scope of Work
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedJob.keyResponsibilities.map((resp, idx) => (
                      <Typography component="li" key={idx} variant="body2" sx={{ color: '#CBD5E1', lineHeight: 1.6 }}>
                        {resp}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Comprehensive Eligibility Breakdown */}
              <Box sx={{
                bgcolor: '#0F172A',
                border: '1px solid #1E293B',
                borderRadius: '12px',
                p: 2.5,
                mb: 3
              }}>
                <Typography variant="subtitle2" sx={{ color: '#A855F7', fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  ⚖️ Detailed Eligibility Criteria
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <Box sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', p: 1.5, borderRadius: '8px' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
                      Age Limit
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#F8FAFC', fontWeight: 700, mt: 0.3 }}>
                      {selectedJob.eligibility?.ageLimit || 'Statutory public service age guidelines'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', p: 1.5, borderRadius: '8px' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
                      Citizenship / Visa Status
                    </Typography>
                    <Typography variant="body2" sx={{ color: selectedJob.eligibility?.visaSponsored ? '#34D399' : '#38BDF8', fontWeight: 700, mt: 0.3 }}>
                      {selectedJob.eligibility?.visaSponsored ? '✅ Open to International Applicants (Visa Sponsored)' : '🏛️ Citizen / Statutory Eligibility Criteria'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', p: 1.5, borderRadius: '8px' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
                      Minimum Experience
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#F8FAFC', fontWeight: 700, mt: 0.3 }}>
                      {selectedJob.eligibility?.experience || 'Relevant public sector / professional experience'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', p: 1.5, borderRadius: '8px' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
                      Career Track
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#F8FAFC', fontWeight: 700, mt: 0.3 }}>
                      {selectedJob.jobType || selectedJob.category || 'Civil Service'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Benefits & Allowances */}
              {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                <Box sx={{
                  bgcolor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  p: 2.5,
                  mb: 3
                }}>
                  <Typography variant="subtitle2" sx={{ color: '#10B981', fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🎁 Official Allowances & Statutory Perks
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    {selectedJob.benefits.map((benefit, idx) => (
                      <Typography component="li" key={idx} variant="body2" sx={{ color: '#34D399', fontWeight: 600, lineHeight: 1.5 }}>
                        {benefit}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {/* How to Apply Guide */}
              {selectedJob.howToApply && (
                <Box sx={{
                  bgcolor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '12px',
                  p: 2.5,
                  mb: 3
                }}>
                  <Typography variant="subtitle2" sx={{ color: '#38BDF8', fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📝 Official Application Procedure
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#CBD5E1', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {selectedJob.howToApply}
                  </Typography>
                </Box>
              )}

              {/* Official Verification Notice */}
              <Box sx={{
                bgcolor: 'rgba(2, 132, 199, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '12px',
                p: 2,
                mb: 2
              }}>
                <Typography variant="body2" sx={{ color: '#E2E8F0', fontWeight: 500, fontSize: '0.85rem' }}>
                  🛡️ <strong>Verified Official Recruitment Standards:</strong> This vacancy circular is directly aggregated from public gazettes and ministry databases. Never pay fees to private recruitment consultants or intermediaries. Proceed only via the verified official button below.
                </Typography>
              </Box>

              {/* Anti-Fraud & Scam Warning Advisory */}
              <Box sx={{
                bgcolor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
                p: 2,
                mb: 3
              }}>
                <Typography variant="body2" sx={{ color: '#FCA5A5', fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.6 }}>
                  ⚠️ <strong>Anti-Fraud Advisory:</strong> Government departments and multilateral agencies never request candidate fees via personal bank accounts, QR codes, or wire transfers. Always apply exclusively through the verified official portal linked below.
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Apply Button */}
                <Button
                  fullWidth
                  variant="contained"
                  href={selectedJob.officialNoticeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Apply on Official Government Portal"
                  startIcon={<VerifiedIcon sx={{ fontSize: 22, color: '#34D399' }} />}
                  sx={{
                    bgcolor: '#10B981',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '1rem',
                    py: 1.6,
                    borderRadius: '12px',
                    textTransform: 'none',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                    '&:hover': { bgcolor: '#059669' }
                  }}
                >
                  Apply on Official Portal ↗ (Verified .gov Link)
                </Button>

                {/* Trust Badges Row */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                  py: 1,
                  px: 1.5,
                  borderRadius: '8px',
                  bgcolor: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <Typography variant="caption" sx={{ color: '#34D399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    🛡️ 100% Verified Government Portal
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    🔒 Zero Fee / No Intermediaries
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#A7F3D0', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    📄 Official PDF Gazette Available
                  </Typography>
                </Box>

                {/* PDF Gazette Button */}
                {selectedJob.officialPdfUrl && (
                  <Button
                    fullWidth
                    variant="outlined"
                    href={selectedJob.officialPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Download Official Gazette Circular"
                    startIcon={<PdfIcon />}
                    sx={{
                      color: '#38BDF8',
                      borderColor: '#0284C7',
                      fontWeight: 700,
                      py: 1.2,
                      borderRadius: '12px',
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.1)', borderColor: '#38BDF8' }
                    }}
                  >
                    📄 Download Official Gazette / Circular (<span className="notranslate" translate="no">PDF</span>)
                  </Button>
                )}

                {/* Share Options */}
                <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleWhatsAppShare(selectedJob)}
                    aria-label="Share via WhatsApp"
                    startIcon={<WhatsAppIcon />}
                    sx={{
                      color: '#25D366',
                      borderColor: '#25D366',
                      fontWeight: 700,
                      borderRadius: '10px',
                      textTransform: 'none'
                    }}
                  >
                    Share via <span className="notranslate" translate="no">WhatsApp</span>
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleTelegramShare(selectedJob)}
                    aria-label="Share via Telegram"
                    startIcon={<TelegramIcon />}
                    sx={{
                      color: '#0088cc',
                      borderColor: '#0088cc',
                      fontWeight: 700,
                      borderRadius: '10px',
                      textTransform: 'none'
                    }}
                  >
                    Share via <span className="notranslate" translate="no">Telegram</span>
                  </Button>
                </Box>
              </Box>
            </DialogContent>

            {/* 🌟 PINNED STICKY BOTTOM ACTION BAR */}
            <DialogActions sx={{
              p: { xs: 1.5, sm: 2 },
              bgcolor: '#0F172A',
              borderTop: '1px solid #1E293B',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              width: '100%',
              boxSizing: 'border-box',
              flexShrink: 0
            }}>
              {/* Left on desktop: Share & PDF */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                {selectedJob.officialPdfUrl && (
                  <Button
                    variant="outlined"
                    href={selectedJob.officialPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<PdfIcon />}
                    sx={{
                      color: '#38BDF8',
                      borderColor: '#0284C7',
                      fontWeight: 750,
                      fontSize: '0.82rem',
                      borderRadius: '10px',
                      textTransform: 'none',
                      px: 1.8,
                      py: 0.8,
                      whiteSpace: 'nowrap',
                      flex: { xs: 1, sm: 'none' },
                      '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.1)', borderColor: '#38BDF8' }
                    }}
                  >
                    Official <span className="notranslate" translate="no">PDF</span>
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={() => handleWhatsAppShare(selectedJob)}
                  aria-label="Share via WhatsApp"
                  startIcon={<WhatsAppIcon sx={{ fontSize: '1.1rem' }} />}
                  sx={{
                    color: '#25D366',
                    borderColor: 'rgba(37, 211, 102, 0.4)',
                    bgcolor: 'rgba(37, 211, 102, 0.08)',
                    fontWeight: 750,
                    fontSize: '0.82rem',
                    borderRadius: '10px',
                    textTransform: 'none',
                    px: 1.5,
                    py: 0.8,
                    flex: { xs: 1, sm: 'none' },
                    '&:hover': { bgcolor: '#25D366', color: '#FFFFFF', borderColor: '#25D366' }
                  }}
                >
                  <span className="notranslate" translate="no">WhatsApp</span>
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleTelegramShare(selectedJob)}
                  aria-label="Share via Telegram"
                  startIcon={<TelegramIcon sx={{ fontSize: '1.1rem' }} />}
                  sx={{
                    color: '#38BDF8',
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                    bgcolor: 'rgba(56, 189, 248, 0.08)',
                    fontWeight: 750,
                    fontSize: '0.82rem',
                    borderRadius: '10px',
                    textTransform: 'none',
                    px: 1.5,
                    py: 0.8,
                    flex: { xs: 1, sm: 'none' },
                    '&:hover': { bgcolor: '#0284C7', color: '#FFFFFF', borderColor: '#0284C7' }
                  }}
                >
                  <span className="notranslate" translate="no">Telegram</span>
                </Button>
              </Box>

              {/* Right: Big Prominent Apply Button */}
              <Button
                variant="contained"
                href={selectedJob.officialNoticeUrl}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<VerifiedIcon sx={{ fontSize: 20, color: '#34D399' }} />}
                sx={{
                  bgcolor: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 850,
                  fontSize: '0.92rem',
                  py: 1.1,
                  px: 3,
                  borderRadius: '10px',
                  textTransform: 'none',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                  width: { xs: '100%', sm: 'auto' },
                  '&:hover': { bgcolor: '#059669', transform: 'translateY(-1px)' }
                }}
              >
                Apply on Official Portal ↗ (Verified .gov)
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 🗺️ SEARCHABLE 195-SOVEREIGN COUNTRY PICKER MODAL */}
      <Dialog
        open={countryPickerOpen}
        onClose={() => setCountryPickerOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0F172A',
            borderRadius: '20px',
            border: '1px solid #334155',
            color: '#F8FAFC',
            p: { xs: 1, sm: 2 }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #1E293B' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GlobeIcon sx={{ color: '#38BDF8', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              🌍 Select Jurisdiction (195 Sovereign Nations)
            </Typography>
          </Box>
          <IconButton onClick={() => setCountryPickerOpen(false)} sx={{ color: '#94A3B8' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {/* Real-time Country Search Input */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search by country name, ISO code, or continent (e.g. United States, Germany, Singapore, France)..."
            value={countrySearchQuery}
            onChange={e => setCountrySearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: '#38BDF8', mr: 1, fontSize: 20 }} />
            }}
            sx={{
              mb: 2,
              bgcolor: '#1E293B',
              borderRadius: '10px',
              '& .MuiOutlinedInput-root': {
                color: '#F8FAFC',
                '& fieldset': { borderColor: '#334155' },
                '&:hover fieldset': { borderColor: '#38BDF8' },
                '&.Mui-focused fieldset': { borderColor: '#38BDF8' }
              }
            }}
          />

          {/* Continent Filter Tabs inside Modal */}
          <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', pb: 1, mb: 2 }}>
            {['ALL', 'Asia', 'Europe', 'Americas', 'Africa', 'Oceania'].map(cont => (
              <Chip
                key={cont}
                label={cont === 'ALL' ? '🌐 All (195)' : cont}
                size="small"
                clickable
                onClick={() => setCountryModalContinent(cont)}
                sx={{
                  bgcolor: countryModalContinent === cont ? '#0284C7' : '#1E293B',
                  color: countryModalContinent === cont ? '#FFFFFF' : '#CBD5E1',
                  fontWeight: countryModalContinent === cont ? 700 : 500,
                  border: '1px solid',
                  borderColor: countryModalContinent === cont ? '#38BDF8' : '#334155',
                  fontSize: '0.78rem'
                }}
              />
            ))}
          </Box>

          {/* Filtered 195 Country Grid */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 1.2,
            maxHeight: '52vh',
            overflowY: 'auto',
            pr: 0.5,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#334155', borderRadius: 3 }
          }}>
            {filtered195Countries.map(c => (
              <Button
                key={c.code}
                variant={activeCountry === c.code ? 'contained' : 'outlined'}
                onClick={() => handleCountryChange(c.code)}
                sx={{
                  textTransform: 'none',
                  py: 1,
                  px: 1.5,
                  borderRadius: '10px',
                  justifyContent: 'flex-start',
                  bgcolor: activeCountry === c.code ? '#0284C7' : '#1E293B',
                  borderColor: activeCountry === c.code ? '#38BDF8' : '#334155',
                  color: activeCountry === c.code ? '#FFFFFF' : '#CBD5E1',
                  transition: 'all 0.15s ease',
                  '&:hover': { bgcolor: '#334155', borderColor: '#38BDF8' }
                }}
              >
                <span style={{ fontSize: '1.3rem', marginRight: '10px' }}>{c.flag}</span>
                <Box sx={{ textAlign: 'left', overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: activeCountry === c.code ? '#E0F2FE' : '#94A3B8', fontSize: '0.7rem' }}>
                    {c.continent} • {c.currency}
                  </Typography>
                </Box>
              </Button>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
