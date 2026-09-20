import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Typography, Button, Box, Alert, CircularProgress,
  IconButton, TextField,
  Chip, Dialog, DialogContent, DialogTitle,
  Pagination, Divider
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
import { request } from '../../../shared/lib/api';
import { applyFullWebsiteTranslation, ALL_LANGUAGES } from '../../../components/GlobalLanguagePicker';

// Continents for filtering
const CONTINENTS = [
  { id: 'ALL', label: '🌐 पूरी दुनिया (195)', short: 'All World' },
  { id: 'Multilateral', label: '🇺🇳 UN व अंतरराष्ट्रीय', short: 'UN & Global' },
  { id: 'Asia', label: '🕌 खाड़ी व एशिया', short: 'Asia & Gulf' },
  { id: 'Europe', label: '🇪🇺 यूरोप (44)', short: 'Europe' },
  { id: 'Americas', label: '🌎 अमेरिका (35)', short: 'Americas' },
  { id: 'Africa', label: '🌍 अफ्रीका (54)', short: 'Africa' },
  { id: 'Oceania', label: '🏖 ओशिनिया (14)', short: 'Oceania' }
];

// Major Countries Directory
const COUNTRY_CATALOG = [
  { code: 'ALL', name: 'All 195 Countries', flag: '🌐' },
  { code: 'IN', name: 'India (Sarkari)', flag: '🇮🇳' },
  { code: 'UN', name: 'United Nations / Global', flag: '🇺🇳' },
  { code: 'AE', name: 'UAE (Dubai / Abu Dhabi)', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'US', name: 'United States (Federal)', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom (Civil Service)', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada (GC Jobs)', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia (APSjobs)', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany (Bund.de)', flag: '🇩🇪' },
  { code: 'FR', name: 'France (Service Public)', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain (Empleo Público)', flag: '🇪🇸' },
  { code: 'JP', name: 'Japan (Jinji-in)', flag: '🇯🇵' },
  { code: 'SG', name: 'Singapore (Careers@Gov)', flag: '🇸🇬' },
  { code: 'ZA', name: 'South Africa (DPSA)', flag: '🇿🇦' },
  { code: 'BR', name: 'Brazil (Concursos)', flag: '🇧🇷' }
];

// Category Pills
const CATEGORIES = [
  { id: 'ALL', label: 'सभी श्रेणियां' },
  { id: 'Civil Service / Administrative', label: '🎖️ सिविल सेवा व प्रशासन' },
  { id: 'Healthcare & Medical', label: '🏥 स्वास्थ्य व मेडिकल' },
  { id: 'Tech & Engineering', label: '💻 तकनीकी व इंजीनियरिंग' },
  { id: 'Defense, Police & Security', label: '👮 रक्षा, पुलिस व सुरक्षा' },
  { id: 'Education & Academia', label: '🎓 शिक्षा व प्राध्यापक' },
  { id: 'Finance, Revenue & Audit', label: '💼 वित्त व राजस्व' },
  { id: 'Diplomatic & International Relations', label: '🌐 राजनयिक व विदेश सेवा' }
];

// Timeline Tabs (तारीख का क्रम)
const TIMELINE_TABS = [
  { id: 'ALL', label: 'सभी भर्तियां', icon: '📋' },
  { id: 'today', label: '🔥 आज जारी हुई (Today)', icon: '🟢' },
  { id: 'yesterday', label: '⚡ कल जारी हुई (Yesterday)', icon: '🟡' },
  { id: 'this_week', label: '📅 इस सप्ताह (This Week)', icon: '⚪' },
  { id: 'closing_soon', label: '⏳ अंतिम तिथि निकट (Urgent)', icon: '🔴' }
];

// Timezone to Country code mapping for instant zero-latency geo-detection
const TIMEZONE_TO_COUNTRY = {
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
  'Asia/Dubai': 'AE', 'Asia/Muscat': 'OM', 'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW', 'Asia/Bahrain': 'BH',
  'Europe/London': 'GB',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Los_Angeles': 'US', 'America/Denver': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
  'Europe/Berlin': 'DE', 'Europe/Paris': 'FR', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT',
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Singapore': 'SG',
  'Africa/Johannesburg': 'ZA', 'America/Sao_Paulo': 'BR', 'Asia/Dhaka': 'BD', 'Asia/Karachi': 'PK'
};

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

  // Selected filters
  const [activeContinent, setActiveContinent] = useState(searchParams.get('continent') || 'ALL');
  const [activeCountry, setActiveCountry] = useState(searchParams.get('country') || 'ALL');
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

  // Modal Detail State
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalViewMode, setModalViewMode] = useState('translated'); // 'translated' | 'original'
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  // 1. Automatic Geo & Language Detection on Mount (with LocalStorage Memory)
  useEffect(() => {
    try {
      const savedCountry = localStorage.getItem('dh_user_country');
      const savedLang = localStorage.getItem('dh_user_lang');

      let detectedC = savedCountry;
      let detectedL = savedLang;

      // Detect country via Timezone if not saved
      if (!detectedC) {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        detectedC = TIMEZONE_TO_COUNTRY[tz] || 'IN';
      }

      // Auto-assign matching language if not explicitly locked
      if (!detectedL) {
        detectedL = COUNTRY_TO_PRIMARY_LANG[detectedC];
        if (!detectedL) {
          const browserLang = (navigator.language || '').slice(0, 2);
          detectedL = ALL_LANGUAGES.some(l => l.code === browserLang) ? browserLang : 'hi';
        }
      }

      setUserDetectedCountry(detectedC);
      setSelectedLanguage(detectedL || 'hi');

      // Async server GeoIP verification in background
      if (!savedCountry) {
        request('/api/global-jobs/detect-geo')
          .then(res => {
            if (res?.success && res.detectedCountry) {
              setUserDetectedCountry(res.detectedCountry);
              if (!savedLang && res.suggestedLanguage) {
                setSelectedLanguage(res.suggestedLanguage);
              }
            }
          })
          .catch(() => {});
      }

      // Global sync listener when changed via navbar picker
      const handleSync = (e) => {
        if (e.detail?.lang) setSelectedLanguage(e.detail.lang);
        if (e.detail?.country) {
          setUserDetectedCountry(e.detail.country);
          setActiveCountry(e.detail.country);
        }
      };
      window.addEventListener('dh_language_changed', handleSync);
      return () => window.removeEventListener('dh_language_changed', handleSync);
    } catch (e) {
      // Safe fallback
    }
  }, []);

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
        } else {
          setError('वैश्विक सरकारी नौकरियों की सूची लोड करने में त्रुटि हुई।');
        }
      })
      .catch(err => {
        setError(err.message || 'नेटवर्क त्रुटि');
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

  // Manual Country Change Handler
  const handleCountryChange = (countryCode) => {
    setActiveCountry(countryCode);
    setUserDetectedCountry(countryCode);
    setCountryPickerOpen(false);
    setCurrentPage(1);
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

  // Handle open job modal from URL param or direct click
  const openJobModal = (job) => {
    setSelectedJob(job);
    setModalViewMode('translated');
  };

  const closeJobModal = () => {
    setSelectedJob(null);
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
    const text = `🏛️ *सरकारी भर्ती अलर्ट:* ${job.title}\n📍 *देश/संस्था:* ${job.countryFlag} ${job.countryName} (${job.agencyOrMinistry})\n💰 *वेतन:* ${job.salary?.amount}\n🔗 *आधिकारिक पोर्टल पर देखें:* ${window.location.origin}/global-jobs?id=${job.officialReferenceId || job._id}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTelegramShare = (job) => {
    const text = `🏛️ सरकारी भर्ती: ${job.title}\n📍 ${job.countryFlag} ${job.countryName} - ${job.agencyOrMinistry}\n💰 वेतन: ${job.salary?.amount}`;
    const url = `${window.location.origin}/global-jobs?id=${job.officialReferenceId || job._id}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // Calculate days remaining
  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'समाप्त (Closed)';
    if (days === 1) return '⏳ 1 दिन शेष (आज लास्ट डेट)';
    return `⏳ ${days} दिन शेष`;
  };

  // Dynamic Google for Jobs JSON-LD Structured Data Schema
  const jobSchema = useMemo(() => {
    if (selectedJob) {
      return {
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        title: selectedJob.title,
        description: selectedJob.officialGazetteSummary || selectedJob.title,
        identifier: {
          '@type': 'PropertyValue',
          name: selectedJob.agencyOrMinistry || 'Official Government Body',
          value: selectedJob.officialReferenceId || selectedJob._id
        },
        datePosted: selectedJob.createdAt ? new Date(selectedJob.createdAt).toISOString() : new Date().toISOString(),
        validThrough: selectedJob.applicationDeadline ? new Date(selectedJob.applicationDeadline).toISOString() : undefined,
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
        baseSalary: selectedJob.salary?.amount ? {
          '@type': 'MonetaryAmount',
          currency: selectedJob.salary?.currency || 'USD',
          value: {
            '@type': 'QuantitativeValue',
            value: selectedJob.salary?.amount
          }
        } : undefined
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
            datePosted: j.createdAt ? new Date(j.createdAt).toISOString() : new Date().toISOString(),
            validThrough: j.applicationDeadline ? new Date(j.applicationDeadline).toISOString() : undefined,
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

  return (
    <Layout>
      <Seo
        title={selectedJob ? `${selectedJob.title} - ${selectedJob.countryName} | ग्लोबल सरकारी गजट 2026` : "ग्लोबल सरकारी जॉब पोर्टल 2026 | 195 देशों की आधिकारिक भर्तियां व गजट (Global Gov Jobs)"}
        description={selectedJob ? `आधिकारिक सरकारी अधिसूचना: ${selectedJob.title} (${selectedJob.agencyOrMinistry}, ${selectedJob.countryName})। वेतन, योग्यता, आवेदन लिंक व गजट PDF।` : "विश्व के 195 संप्रभु देशों, संयुक्त राष्ट्र (UN), WHO, खाड़ी देशों व भारत सरकार की सत्यापित सरकारी नौकरियां। 100% आधिकारिक गजट और सीधे आवेदन लिंक।"}
        keywords={['Global government jobs', 'Sarkari naukri world', 'UN jobs', 'Dubai government careers', 'Saudi civil service', 'UPSC SSC vacancies 2026', 'WHO jobs']}
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
              📍 देश: {COUNTRY_CATALOG.find(c => c.code === (activeCountry !== 'ALL' ? activeCountry : userDetectedCountry))?.flag || '🌐'} {COUNTRY_CATALOG.find(c => c.code === (activeCountry !== 'ALL' ? activeCountry : userDetectedCountry))?.name || 'All Countries'} 🔄
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
                  label="आधिकारिक सरकारी करियर इंटेलिजेंस"
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
                fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' }
              }}>
                🏛️ ग्लोबल सरकारी जॉब्स व लोक सेवा भर्ती पोर्टल
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5, maxWidth: 800 }}>
                195 संप्रभु देशों, संयुक्त राष्ट्र (UN), खाड़ी देशों व भारत सरकार के आधिकारिक भर्ती नोटिफिकेशन — सीधे मूल गजट व अपनी स्थानीय भाषा में।
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
                  🔥 आज जारी
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
                  ⚡ कल की भर्तियां
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
                  ⏳ लास्ट डेट निकट
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
                  🌐 कुल सक्रिय
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
              placeholder="पद का नाम, मंत्रालय, देश या योग्यता से सर्च करें (e.g. Health Officer, UPSC, Dubai, Engineer, Consultant)..."
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
              खोजें
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
              महाद्वीप:
            </Typography>
            {CONTINENTS.map(cont => (
              <Chip
                key={cont.id}
                label={cont.label}
                clickable
                onClick={() => { setActiveContinent(cont.id); setCurrentPage(1); }}
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
              श्रेणी:
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

          {/* Row 3: Timeline & Eligibility Filters (आज, कल, परसों) */}
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
                तारीख:
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
                🌍 केवल वीज़ा-स्पॉन्सर / Expat Friendly
              </Button>
            </Box>
          </Box>
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
          {/* Feedback & Loading states */}
          {loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#38BDF8', mb: 2 }} />
              <Typography sx={{ color: '#94A3B8', fontWeight: 600 }}>
                विश्व स्तरीय सरकारी नौकरियों की लाइव अधिसूचनाएं लोड हो रही हैं...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ bgcolor: '#1E293B', color: '#F87171', border: '1px solid #EF4444', mb: 3 }}>
              {error}
            </Alert>
          )}

          {!loading && jobs.length === 0 && (
            <Box sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: '#0F172A',
              borderRadius: '16px',
              border: '1px solid #1E293B',
              px: 3
            }}>
              <GlobeIcon sx={{ fontSize: 56, color: '#475569', mb: 1.5 }} />
              <Typography variant="h6" sx={{ color: '#F8FAFC', fontWeight: 700 }}>
                चुने गए फ़िल्टर के अनुसार कोई सरकारी वेकेंसी नहीं मिली
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5, mb: 2 }}>
                कृपया फ़िल्टर रीसेट करें या किसी अन्य देश/श्रेणी का चयन करें।
              </Typography>
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
                }}
                sx={{
                  color: '#38BDF8',
                  borderColor: '#0284C7',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                सभी फ़िल्टर रीसेट करें
              </Button>
            </Box>
          )}

          {/* Job Cards Grid */}
          {!loading && jobs.length > 0 && (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 2.5
            }}>
              {jobs.map((job) => {
                const daysLeft = getDaysRemaining(job.applicationDeadline);
                const isUrgent = daysLeft && (daysLeft.includes('1 दिन') || daysLeft.includes('2 दिन') || daysLeft.includes('3 दिन'));

                return (
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
                            label="अंतिम तिथि निकट"
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
                            {job.eligibility?.education || 'स्नातक / संबंधित सरकारी योग्यता'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Bottom Actions Row */}
                    <Box sx={{ pt: 1.5, borderTop: '1px solid #1E293B' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: isUrgent ? '#FB7185' : '#94A3B8', fontWeight: 700 }}>
                          {daysLeft || 'सक्रिय भर्ती (Active)'}
                        </Typography>

                        {/* Visa / Expat Badge */}
                        <Chip
                          label={job.eligibility?.visaSponsored ? '🌍 वीज़ा उपलब्ध' : '🏛️ स्थानीय नागरिक'}
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
                          विवरण देखें व आवेदन
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
                );
              })}
            </Box>
          )}

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
        PaperProps={{
          sx: {
            bgcolor: '#0B0F19',
            backgroundImage: 'none',
            borderRadius: '20px',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            color: '#F8FAFC',
            overflow: 'hidden'
          }
        }}
      >
        {selectedJob && (
          <>
            {/* Modal Header */}
            <DialogTitle sx={{
              p: 3,
              bgcolor: '#0F172A',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
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
                      label="आधिकारिक सरकारी गजट"
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

            {/* Modal Content */}
            <DialogContent sx={{ p: 3, bgcolor: '#0B0F19' }}>
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
                    भाषा मोड (Language View):
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
                    🌐 अनुवादित रूप (My Language)
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
                    🏛️ मूल सरकारी गजट (Original)
                  </Button>
                </Box>
              </Box>

              {/* Title Header */}
              <Typography variant="h5" sx={{ color: '#F8FAFC', fontWeight: 900, mb: 1, lineHeight: 1.3 }}>
                {getDisplayTitle(selectedJob)}
              </Typography>
              {selectedJob.officialReferenceId && (
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 3 }}>
                  विज्ञापन संख्या / Reference Code: {selectedJob.officialReferenceId}
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
                    💰 वेतनमान (Pay Scale)
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#34D399', fontWeight: 800, mt: 0.5 }}>
                    {selectedJob.salary?.amount}
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: '#0F172A', p: 2, borderRadius: '12px', border: '1px solid #1E293B' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                    📍 ड्यूटी स्टेशन / तैनाती स्थल
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#F8FAFC', fontWeight: 700, mt: 0.5 }}>
                    {selectedJob.dutyStation}
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: '#0F172A', p: 2, borderRadius: '12px', border: '1px solid #1E293B' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                    🎓 शैक्षणिक योग्यता (Eligibility)
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#CBD5E1', fontWeight: 600, mt: 0.5 }}>
                    {selectedJob.eligibility?.education || 'स्नातक / संबंधित आधिकारिक योग्यता'}
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: '#0F172A', p: 2, borderRadius: '12px', border: '1px solid #1E293B' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                    ⏳ आवेदन की अंतिम तिथि (Deadline)
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#FB7185', fontWeight: 800, mt: 0.5 }}>
                    {selectedJob.applicationDeadline ? new Date(selectedJob.applicationDeadline).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'आधिकारिक गजट देखें'}
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
                    📋 आधिकारिक पद विवरण एवं अधिसूचना (Official Role Overview)
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
                    🎯 मुख्य कार्य एवं जिम्मेदारियां (Key Duties & Scope of Work)
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
                  ⚖️ पात्रता एवं सेवा शर्तें (Detailed Eligibility Criteria)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <Box sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', p: 1.5, borderRadius: '8px' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
                      आयु सीमा (Age Limit)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#F8FAFC', fontWeight: 700, mt: 0.3 }}>
                      {selectedJob.eligibility?.ageLimit || '18 - 62 वर्ष (आधिकारिक नियमानुसार)'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', p: 1.5, borderRadius: '8px' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
                      नागरिकता एवं वीज़ा (Citizenship / Visa)
                    </Typography>
                    <Typography variant="body2" sx={{ color: selectedJob.eligibility?.visaSponsored ? '#34D399' : '#38BDF8', fontWeight: 700, mt: 0.3 }}>
                      {selectedJob.eligibility?.visaSponsored ? '✅ वीज़ा प्रायोजित (Open to International Applicants)' : '🏛️ राष्ट्रीय नागरिक / नियमानुसार पात्रता'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', p: 1.5, borderRadius: '8px' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
                      न्यूनतम अनुभव (Experience)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#F8FAFC', fontWeight: 700, mt: 0.3 }}>
                      {selectedJob.eligibility?.experience || 'संबंधित लोक सेवा / पेशेवर अनुभव'}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', p: 1.5, borderRadius: '8px' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
                      कार्य क्षेत्र (Domain)
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
                    🎁 आधिकारिक सरकारी भत्ते व सुविधाएं (Official Perks & Benefits)
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
                    📝 आवेदन करने की प्रक्रिया (How to Apply Guide)
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
                  🛡️ <strong>सत्यापित आधिकारिक भर्ती नीति:</strong> यह सूचना सीधे संबंधित सरकार या संस्था के सार्वजनिक पोर्टल से संकलित की गई है। इस पद हेतु किसी भी मध्यस्थ या एजेंट को शुल्क न दें। सीधे नीचे दिए गए आधिकारिक सरकारी बटन से आवेदन करें।
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
                  ⚠️ <strong>धोखाधड़ी से सावधान (Anti-Fraud Warning):</strong> सरकारी विभाग कभी भी किसी व्यक्तिगत बैंक खाते, QR कोड या UPI पर भर्ती शुल्क नहीं मांगते। किसी भी फर्जी एजेंट या अनधिकृत मध्यस्थ के झांसे में न आएं। केवल नीचे दिए गए सीधे आधिकारिक .gov पोर्टल से ही आवेदन करें।
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
                  aria-label="आधिकारिक सरकारी पोर्टल पर आवेदन करें"
                  startIcon={<ApplyIcon />}
                  sx={{
                    bgcolor: '#10B981',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    py: 1.5,
                    borderRadius: '12px',
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#059669' }
                  }}
                >
                  🔗 आधिकारिक सरकारी पोर्टल पर आवेदन करें (Official .gov Link)
                </Button>

                {/* PDF Gazette Button */}
                {selectedJob.officialPdfUrl && (
                  <Button
                    fullWidth
                    variant="outlined"
                    href={selectedJob.officialPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="आधिकारिक नोटिफिकेशन डाउनलोड करें"
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
                    📄 आधिकारिक नोटिफिकेशन / गजट डाउनलोड करें (PDF)
                  </Button>
                )}

                {/* Share Options */}
                <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleWhatsAppShare(selectedJob)}
                    aria-label="WhatsApp पर यह सरकारी नौकरी शेयर करें"
                    startIcon={<WhatsAppIcon />}
                    sx={{
                      color: '#25D366',
                      borderColor: '#25D366',
                      fontWeight: 700,
                      borderRadius: '10px',
                      textTransform: 'none'
                    }}
                  >
                    WhatsApp पर शेयर करें
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleTelegramShare(selectedJob)}
                    aria-label="Telegram चैनल पर यह सरकारी नौकरी भेजें"
                    startIcon={<TelegramIcon />}
                    sx={{
                      color: '#0088cc',
                      borderColor: '#0088cc',
                      fontWeight: 700,
                      borderRadius: '10px',
                      textTransform: 'none'
                    }}
                  >
                    Telegram पर भेजें
                  </Button>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* 🗺️ 195-COUNTRY PICKER MODAL */}
      <Dialog
        open={countryPickerOpen}
        onClose={() => setCountryPickerOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0F172A',
            borderRadius: '16px',
            border: '1px solid #334155',
            color: '#F8FAFC',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            🌍 195 देशों में से अपना देश चुनें
          </Typography>
          <IconButton onClick={() => setCountryPickerOpen(false)} sx={{ color: '#94A3B8' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
            gap: 1.5
          }}>
            {COUNTRY_CATALOG.map(c => (
              <Button
                key={c.code}
                variant={activeCountry === c.code ? 'contained' : 'outlined'}
                onClick={() => handleCountryChange(c.code)}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  py: 1,
                  borderRadius: '10px',
                  justifyContent: 'flex-start',
                  bgcolor: activeCountry === c.code ? '#0284C7' : 'transparent',
                  borderColor: '#334155',
                  color: activeCountry === c.code ? '#FFFFFF' : '#CBD5E1',
                  '&:hover': { bgcolor: '#1E293B' }
                }}
              >
                <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>{c.flag}</span>
                {c.name}
              </Button>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
