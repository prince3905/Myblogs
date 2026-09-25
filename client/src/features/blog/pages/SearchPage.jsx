import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Typography, Box, CircularProgress, Alert, TextField, Chip, Paper,
  InputAdornment, IconButton, Button, Dialog, DialogTitle, DialogContent,
  Tabs, Tab, Divider, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import LaunchIcon from '@mui/icons-material/Launch';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VerifiedIcon from '@mui/icons-material/Verified';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Telegram';
import PublicIcon from '@mui/icons-material/Public';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import AdSlot from '../../../components/AdSlot';
import { request } from '../../../shared/lib/api';

const TRENDING_SEARCH_PILLS = [
  { label: '🔥 Latest Sarkari Jobs', q: 'recruitment' },
  { label: '🚆 Railway RRB', q: 'railway' },
  { label: '⚡ SSC CGL / CHSL', q: 'ssc' },
  { label: '🛡️ Police & Defence', q: 'police' },
  { label: '🏛️ UPSC / State PSC', q: 'upsc' },
  { label: '📝 Sarkari Admit Card', q: 'admit card' },
  { label: '🏆 Sarkari Result', q: 'result' },
  { label: '📖 Sarkari Syllabus', q: 'syllabus' },
  { label: '🌐 Global & UN Jobs', q: 'global' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const qParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(qParam);

  // Results state
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'alerts' | 'global' | 'posts'
  const [alerts, setAlerts] = useState([]);
  const [globalJobs, setGlobalJobs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postTotal, setPostTotal] = useState(0);

  // Featured initial live vacancies for empty state
  const [popularAlerts, setPopularAlerts] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Sync query input when URL search params change externally
  useEffect(() => {
    if (qParam !== query) {
      setQuery(qParam);
    }
  }, [qParam]);

  // Debounced URL param updater
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed) {
        setSearchParams({ q: trimmed });
      } else {
        setSearchParams({});
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, setSearchParams]);

  // Initial load of latest vacancies for empty state
  useEffect(() => {
    request('/api/public/live-alerts?status=all&limit=8')
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setPopularAlerts(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Main Unified Fast Search Fetcher
  useEffect(() => {
    const q = qParam.trim();
    if (!q) {
      setAlerts([]);
      setGlobalJobs([]);
      setPosts([]);
      setPostTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const searchAlertsPromise = request(`/api/public/live-alerts?status=all&search=${encodeURIComponent(q)}&limit=18`)
      .then(res => (res.success && Array.isArray(res.data) ? res.data : []))
      .catch(() => []);

    const searchGlobalJobsPromise = request(`/api/global-jobs?search=${encodeURIComponent(q)}&limit=10`)
      .then(res => (res.success && Array.isArray(res.data) ? res.data : []))
      .catch(() => []);

    const searchPostsPromise = request(`/api/posts/search?q=${encodeURIComponent(q)}&page=1&limit=6`)
      .then(res => ({ posts: res.posts || [], total: res.total || 0 }))
      .catch(() => ({ posts: [], total: 0 }));

    Promise.all([searchAlertsPromise, searchGlobalJobsPromise, searchPostsPromise])
      .then(([alertList, globalList, postsData]) => {
        setAlerts(alertList);
        setGlobalJobs(globalList);
        setPosts(postsData.posts);
        setPostTotal(postsData.total);
      })
      .catch(err => {
        setError(err.message || 'Error occurred while searching');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [qParam]);

  const totalResultsCount = alerts.length + globalJobs.length + posts.length;

  const handleShare = (channel, alert) => {
    if (!alert) return;
    const title = alert.title || 'Sarkari Job Alert';
    const board = alert.boardName || 'Govt Department';
    const lastDate = alert.lastDate && alert.lastDate !== 'N/A' ? `📅 अंतिम तिथि: ${alert.lastDate}\n` : '';
    const link = `https://www.digitalhomeblog.in/india/sarkari-jobs?alertId=${alert._id}`;
    const text = `🏛️ *${board} Recruitment Update*\n📌 *${title}*\n${lastDate}🔗 *100% सत्यापित अधिसूचना व ऑनलाइन आवेदन:*\n${link}`;

    if (channel === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    } else if (channel === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    }
  };

  const getCategoryColor = (category = '') => {
    const c = category.toLowerCase();
    if (c.includes('result')) return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
    if (c.includes('admit')) return { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' };
    if (c.includes('answer')) return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
    if (c.includes('syllabus')) return { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE' };
    if (c.includes('admission')) return { bg: '#CCFBF1', text: '#0F766E', border: '#5EEAD4' };
    return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
  };

  return (
    <Layout>
      <Seo
        title={qParam ? `खोज परिणाम: ${qParam} | Sarkari Jobs & Global Vacancies` : 'Search Sarkari Jobs & Global Vacancies | Digital Home'}
        description="Search active Indian Sarkari Vacancies, UPSC, SSC, Railways, State PSC, Global Government Jobs, and Career Guides in one place."
        noindex={true}
      />

      <Box sx={{ maxWidth: '1240px', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        {/* Search Header Banner */}
        <Box sx={{ textAlign: 'center', pt: { xs: 2, md: 4 }, pb: 2 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.2rem' },
              color: 'text.primary',
              letterSpacing: -0.5,
              mb: 1
            }}
          >
            🎯 Search Sarkari Jobs & Global Vacancies
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.85rem', md: '0.98rem' },
              maxWidth: 680,
              mx: 'auto',
              lineHeight: 1.5
            }}
          >
            खोजें सभी भारतीय सरकारी भर्तियां, एडमिट कार्ड, परीक्षा परिणाम व अंतर्राष्ट्रीय पद एक ही जगह
          </Typography>
        </Box>

        {/* Central Search Input Box (Ultra-Smooth Focus & Micro-animation) */}
        <Box sx={{ maxWidth: 740, mx: 'auto', mb: 3 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: '24px',
              border: '2px solid',
              borderColor: query.trim() ? '#2563EB' : 'divider',
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'background.paper',
              position: 'relative',
              overflow: 'hidden',
              p: 0.5,
              boxShadow: query.trim() ? '0 10px 30px rgba(37, 99, 235, 0.15)' : '0 4px 16px rgba(0,0,0,0.04)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:focus-within': {
                borderColor: '#2563EB',
                boxShadow: '0 12px 32px rgba(37, 99, 235, 0.2)'
              }
            }}
          >
            <Box sx={{ pl: 2, display: 'flex', alignItems: 'center', color: '#2563EB' }}>
              <SearchIcon sx={{ fontSize: '1.6rem' }} />
            </Box>
            <TextField
              fullWidth
              placeholder="Search by Exam, Board, Job Title (e.g. Railway, SSC CGL, Police, UPSC)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: {
                  px: 1.5,
                  py: 1.2,
                  fontSize: { xs: '0.92rem', md: '1.05rem' },
                  fontWeight: 600,
                  '&::placeholder': { color: 'text.disabled', opacity: 0.85 }
                },
                endAdornment: query ? (
                  <InputAdornment position="end">
                    <Tooltip title="Clear Search">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setQuery('');
                          setSearchParams({});
                        }}
                        sx={{ color: 'text.secondary', mr: 0.5 }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ) : null
              }}
            />
            <Button
              variant="contained"
              onClick={() => {
                if (query.trim()) setSearchParams({ q: query.trim() });
              }}
              sx={{
                bgcolor: '#2563EB',
                color: '#FFFFFF',
                borderRadius: '20px',
                px: { xs: 2.2, sm: 3.5 },
                py: { xs: 0.9, sm: 1.2 },
                fontWeight: 800,
                fontSize: { xs: '0.82rem', sm: '0.9rem' },
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#1D4ED8' }
              }}
            >
              Search
            </Button>
          </Paper>
        </Box>

        {/* 1-Click Fast Trending Topic Pills */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 4, maxWidth: 900, mx: 'auto' }}>
          {TRENDING_SEARCH_PILLS.map((pill, idx) => {
            const isSelected = query.toLowerCase() === pill.q.toLowerCase();
            return (
              <Chip
                key={idx}
                label={pill.label}
                clickable
                onClick={() => setQuery(pill.q)}
                sx={{
                  bgcolor: isSelected ? '#2563EB' : 'background.paper',
                  color: isSelected ? '#FFFFFF' : 'text.primary',
                  border: '1.5px solid',
                  borderColor: isSelected ? '#2563EB' : 'divider',
                  fontWeight: 750,
                  fontSize: '0.78rem',
                  py: 1.8,
                  px: 0.6,
                  borderRadius: '24px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.18s ease',
                  '&:hover': {
                    bgcolor: isSelected ? '#1D4ED8' : 'rgba(37, 99, 235, 0.08)',
                    borderColor: '#2563EB'
                  }
                }}
              />
            );
          })}
        </Box>

        {/* In-Search Ad Unit */}
        <AdSlot format="horizontal" style={{ mb: 3 }} />

        {error ? (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
        ) : null}

        {/* Search Results State */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={44} sx={{ color: '#2563EB', mb: 2 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              खोज रहे हैं सक्रिय सरकारी नौकरियां व अंतर्राष्ट्रीय पद...
            </Typography>
          </Box>
        ) : qParam.trim() ? (
          <>
            {/* Filter Tabs & Summary Row */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 3,
                pb: 1,
                borderBottom: '1.5px solid',
                borderColor: 'divider'
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(e, val) => setActiveTab(val)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 38,
                  '& .MuiTab-root': {
                    minHeight: 38,
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    borderRadius: '10px',
                    mr: 1,
                    px: 1.8
                  }
                }}
              >
                <Tab label={`All Results (${totalResultsCount})`} value="all" />
                <Tab label={`🇮🇳 Sarkari Alerts (${alerts.length})`} value="alerts" />
                <Tab label={`🌐 Global Jobs (${globalJobs.length})`} value="global" />
                <Tab label={`📚 Career Guides (${postTotal})`} value="posts" />
              </Tabs>

              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                Showing results for &ldquo;<strong>{qParam}</strong>&rdquo;
              </Typography>
            </Box>

            {totalResultsCount === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 6,
                  px: 3,
                  bgcolor: 'background.paper',
                  borderRadius: '16px',
                  border: '1px dashed',
                  borderColor: 'divider',
                  my: 3
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1 }}>
                  🔍 कोई परिणाम नहीं मिला (No Results Found)
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 460, mx: 'auto', mb: 3 }}>
                  &ldquo;{qParam}&rdquo; के लिए कोई सक्रिय अधिसूचना नहीं मिली। कृपया कोई अन्य कीवर्ड जैसे <strong>Railway, SSC, Police, UPSC</strong> खोजें।
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setQuery('railway')}
                  sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700 }}
                >
                  Try &ldquo;Railway&rdquo; Search
                </Button>
              </Box>
            ) : (
              <>
                {/* 🎯 SECTION 1: LIVE SARKARI ALERTS (PEHLE AANA CHAHIYE - PRIORITY #1) */}
                {(activeTab === 'all' || activeTab === 'alerts') && alerts.length > 0 && (
                  <Box sx={{ mb: 5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 850, fontSize: { xs: '1rem', md: '1.15rem' }, color: '#1E3A8A' }}>
                          🏛️ Live Sarkari Alerts & Government Vacancies
                        </Typography>
                        <Chip
                          label={`${alerts.length} ${alerts.length === 1 ? 'भर्ती' : 'भर्तियां'}`}
                          size="small"
                          sx={{ bgcolor: '#2563EB', color: '#FFFFFF', fontWeight: 800, fontSize: '0.72rem' }}
                        />
                      </Box>
                      <Button
                        component={Link}
                        to="/india/sarkari-jobs"
                        size="small"
                        sx={{ fontWeight: 750, textTransform: 'none', fontSize: '0.8rem' }}
                      >
                        सभी 940+ Sarkari Alerts देखें ↗
                      </Button>
                    </Box>

                    {/* Alert Cards Grid */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                          lg: 'repeat(3, 1fr)'
                        },
                        gap: 2
                      }}
                    >
                      {alerts.map((alert, idx) => {
                        const catStyle = getCategoryColor(alert.category);
                        const lastDate = alert.lastDate;
                        const hasLastDate = lastDate && lastDate !== 'N/A' && lastDate !== 'Check Detail Page' && lastDate !== 'अधिसूचना देखें';
                        const postDate = alert.parsedPostDate || alert.createdAt;

                        return (
                          <Paper
                            key={alert._id || idx}
                            elevation={0}
                            onClick={() => setSelectedAlert(alert)}
                            sx={{
                              p: 2,
                              borderRadius: '16px',
                              border: '1.5px solid #E2E8F0',
                              bgcolor: 'background.paper',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'translateY(-3px)',
                                borderColor: '#2563EB',
                                boxShadow: '0 10px 25px rgba(37, 99, 235, 0.12)'
                              }
                            }}
                          >
                            {/* Card Top: Board & Category Badge */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 850,
                                  color: '#0F172A',
                                  textTransform: 'uppercase',
                                  fontSize: '0.68rem',
                                  letterSpacing: 0.3,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {alert.boardName || 'Govt Department'}
                              </Typography>
                              <Chip
                                label={alert.category || 'Latest Job'}
                                size="small"
                                sx={{
                                  bgcolor: catStyle.bg,
                                  color: catStyle.text,
                                  border: `1px solid ${catStyle.border}`,
                                  fontWeight: 800,
                                  fontSize: '0.64rem',
                                  height: 20
                                }}
                              />
                            </Box>

                            {/* Card Middle: Title */}
                            <Typography
                              sx={{
                                fontWeight: 750,
                                fontSize: '0.88rem',
                                color: '#1E293B',
                                lineHeight: 1.4,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                mb: 2
                              }}
                            >
                              {alert.title}
                            </Typography>

                            {/* Card Footer: State & Last Date */}
                            <Box sx={{ pt: 1, borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.3, fontSize: '0.72rem', fontWeight: 600 }}>
                                <LocationOnIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
                                {alert.state || 'Central/All India'}
                              </Typography>

                              {hasLastDate ? (
                                <Typography variant="caption" sx={{ color: '#DC2626', bgcolor: '#FEE2E2', px: 0.8, py: 0.2, borderRadius: '4px', fontWeight: 800, fontSize: '0.68rem' }}>
                                  ⏳ {lastDate}
                                </Typography>
                              ) : (
                                <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 800, fontSize: '0.72rem' }}>
                                  विवरण देखें ↗
                                </Typography>
                              )}
                            </Box>
                          </Paper>
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {/* 🌐 SECTION 2: GLOBAL GOVT VACANCIES */}
                {(activeTab === 'all' || activeTab === 'global') && globalJobs.length > 0 && (
                  <Box sx={{ mb: 5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 850, fontSize: { xs: '1rem', md: '1.15rem' }, color: '#0F766E' }}>
                          🌐 Global & International Government Vacancies
                        </Typography>
                        <Chip
                          label={`${globalJobs.length} Positions`}
                          size="small"
                          sx={{ bgcolor: '#0D9488', color: '#FFFFFF', fontWeight: 800, fontSize: '0.72rem' }}
                        />
                      </Box>
                      <Button
                        component={Link}
                        to="/global-jobs"
                        size="small"
                        sx={{ fontWeight: 750, textTransform: 'none', fontSize: '0.8rem', color: '#0D9488' }}
                      >
                        195 देशों के पद देखें ↗
                      </Button>
                    </Box>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                          lg: 'repeat(3, 1fr)'
                        },
                        gap: 2
                      }}
                    >
                      {globalJobs.map((job, idx) => (
                        <Paper
                          key={job._id || idx}
                          elevation={0}
                          component="a"
                          href={job.officialNoticeUrl || '/global-jobs'}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            p: 2,
                            borderRadius: '16px',
                            border: '1.5px solid #E2E8F0',
                            bgcolor: 'background.paper',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'all 0.22s ease',
                            '&:hover': {
                              transform: 'translateY(-3px)',
                              borderColor: '#0D9488',
                              boxShadow: '0 10px 25px rgba(13, 148, 136, 0.12)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Typography sx={{ fontSize: '1.2rem' }}>{job.countryFlag || '🌐'}</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 850, color: '#0F172A', fontSize: '0.72rem' }}>
                                {job.countryName || 'International'}
                              </Typography>
                            </Box>
                            <Chip
                              label={job.jobType || 'Public Service'}
                              size="small"
                              sx={{ bgcolor: '#CCFBF1', color: '#0F766E', fontWeight: 800, fontSize: '0.62rem', height: 20 }}
                            />
                          </Box>

                          <Typography
                            sx={{
                              fontWeight: 750,
                              fontSize: '0.88rem',
                              color: '#1E293B',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              mb: 2
                            }}
                          >
                            {job.title}
                          </Typography>

                          <Box sx={{ pt: 1, borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600 }}>
                              🏛️ {job.agencyOrMinistry || 'Federal Commission'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#0D9488', fontWeight: 800, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                              Apply Direct <LaunchIcon sx={{ fontSize: 12 }} />
                            </Typography>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* 📚 SECTION 3: CAREER GUIDES & ARTICLES */}
                {(activeTab === 'all' || activeTab === 'posts') && posts.length > 0 && (
                  <Box sx={{ mb: 5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 850, fontSize: { xs: '1rem', md: '1.15rem' }, color: 'text.primary' }}>
                          📚 Career Guidance & Exam Preparation Articles
                        </Typography>
                        <Chip
                          label={`${postTotal} Guides`}
                          size="small"
                          sx={{ bgcolor: '#6366F1', color: '#FFFFFF', fontWeight: 800, fontSize: '0.72rem' }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: '20px' }}>
                      {posts.map(post => <PostCard key={post._id} post={post} />)}
                    </Box>
                  </Box>
                )}
              </>
            )}
          </>
        ) : (
          /* Empty / Default State: Shows Popular Current Vacancies so Candidates Never Land on Empty Screen */
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 850, fontSize: { xs: '1rem', md: '1.2rem' }, color: '#1E293B' }}>
                🔥 Live Verified Sarkari Vacancies (आज के प्रमुख पद)
              </Typography>
              <Button
                component={Link}
                to="/india/sarkari-jobs"
                size="small"
                sx={{ fontWeight: 750, textTransform: 'none', color: '#2563EB' }}
              >
                सभी सरकारी रिजल्ट देखें ↗
              </Button>
            </Box>

            {popularAlerts.length > 0 ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    lg: 'repeat(4, 1fr)'
                  },
                  gap: 2,
                  mb: 5
                }}
              >
                {popularAlerts.map((alert, idx) => {
                  const catStyle = getCategoryColor(alert.category);
                  const lastDate = alert.lastDate;
                  const hasLastDate = lastDate && lastDate !== 'N/A' && lastDate !== 'Check Detail Page' && lastDate !== 'अधिसूचना देखें';

                  return (
                    <Paper
                      key={alert._id || idx}
                      elevation={0}
                      onClick={() => setSelectedAlert(alert)}
                      sx={{
                        p: 1.8,
                        borderRadius: '16px',
                        border: '1px solid #E2E8F0',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          borderColor: '#2563EB',
                          boxShadow: '0 8px 20px rgba(37, 99, 235, 0.1)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 850,
                            color: '#0F172A',
                            textTransform: 'uppercase',
                            fontSize: '0.64rem',
                            letterSpacing: 0.3
                          }}
                        >
                          {alert.boardName || 'Govt Department'}
                        </Typography>
                        <Chip
                          label={alert.category || 'Latest Job'}
                          size="small"
                          sx={{
                            bgcolor: catStyle.bg,
                            color: catStyle.text,
                            border: `1px solid ${catStyle.border}`,
                            fontWeight: 800,
                            fontSize: '0.6rem',
                            height: 18
                          }}
                        />
                      </Box>

                      <Typography
                        sx={{
                          fontWeight: 750,
                          fontSize: '0.82rem',
                          color: '#1E293B',
                          lineHeight: 1.35,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          mb: 1.5
                        }}
                      >
                        {alert.title}
                      </Typography>

                      <Box sx={{ pt: 0.8, borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem', fontWeight: 600 }}>
                          📍 {alert.state || 'All India'}
                        </Typography>
                        {hasLastDate ? (
                          <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 800, fontSize: '0.65rem' }}>
                            ⏳ {lastDate}
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 800, fontSize: '0.68rem' }}>
                            Apply ↗
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            ) : null}
          </Box>
        )}
      </Box>

      {/* 🛡️ ULTRA-PREMIUM OBSIDIAN DETAILS DIALOG MODAL */}
      <Dialog
        open={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: { xs: '16px', sm: '24px' },
            p: 0,
            bgcolor: '#070B18 !important',
            backgroundColor: '#070B18 !important',
            backgroundImage: 'linear-gradient(180deg, #0D1629 0%, #060A14 100%) !important',
            color: '#FFFFFF !important',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderTop: '6px solid #38BDF8',
            boxShadow: '0 35px 90px rgba(0, 0, 0, 0.95)',
            margin: { xs: '8px auto', sm: '20px auto' },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' },
            maxHeight: { xs: 'calc(100dvh - 20px)', sm: 'calc(100dvh - 40px)' },
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto !important'
          }
        }}
      >
        {selectedAlert && (
          <>
            <DialogTitle
              sx={{
                p: { xs: 2, sm: 2.5 },
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, pr: 1 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    bgcolor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    flexShrink: 0
                  }}
                >
                  🏛️
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ color: '#38BDF8', fontWeight: 850, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {selectedAlert.boardName || 'Government Department'}
                    </Typography>
                    <Chip
                      label="100% Verified Official Gazette"
                      size="small"
                      icon={<VerifiedIcon sx={{ fontSize: '13px !important', color: '#10B981 !important' }} />}
                      sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', fontWeight: 750, fontSize: '0.65rem', height: 20 }}
                    />
                  </Box>
                  <Typography sx={{ color: '#F8FAFC', fontWeight: 800, fontSize: { xs: '1rem', sm: '1.15rem' }, mt: 0.5, lineHeight: 1.3 }}>
                    {selectedAlert.title}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={() => setSelectedAlert(null)}
                sx={{ color: '#94A3B8', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Quick Facts Grid */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 1.5,
                  mb: 3
                }}
              >
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontWeight: 600 }}>Category</Typography>
                  <Typography sx={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.88rem' }}>{selectedAlert.category || 'Latest Job'}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontWeight: 600 }}>Location / State</Typography>
                  <Typography sx={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.88rem' }}>{selectedAlert.state || 'All India'}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontWeight: 600 }}>Release Date</Typography>
                  <Typography sx={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.88rem' }}>
                    {new Date(selectedAlert.parsedPostDate || selectedAlert.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <Typography variant="caption" sx={{ color: '#F87171', display: 'block', fontWeight: 600 }}>Closing Deadline</Typography>
                  <Typography sx={{ color: '#FCA5A5', fontWeight: 850, fontSize: '0.88rem' }}>{selectedAlert.lastDate || 'As per notice'}</Typography>
                </Box>
              </Box>

              {/* Anti-Fraud Candidate Advisory */}
              <Box
                sx={{
                  mb: 3,
                  p: 1.8,
                  borderRadius: '12px',
                  bgcolor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}
              >
                <Typography sx={{ fontSize: '1.4rem' }}>⚠️</Typography>
                <Typography sx={{ color: '#FDE68A', fontSize: '0.78rem', lineHeight: 1.4, fontWeight: 600 }}>
                  <strong>धोखाधड़ी से सावधान:</strong> सरकारी विभाग कभी भी किसी व्यक्तिगत बैंक खाते, QR कोड या UPI पर भर्ती शुल्क नहीं मांगते। केवल आधिकारिक .gov/.nic.in पोर्टल से ही आवेदन करें।
                </Typography>
              </Box>

              {/* Verified Action Buttons */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                {(selectedAlert.officialApplyUrl || selectedAlert.officialUrl) && (
                  <Button
                    variant="contained"
                    component="a"
                    href={selectedAlert.officialApplyUrl || selectedAlert.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<LaunchIcon />}
                    sx={{
                      flex: 1,
                      minWidth: 200,
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      fontWeight: 850,
                      textTransform: 'none',
                      py: 1.3,
                      borderRadius: '12px',
                      boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
                      '&:hover': { background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)' }
                    }}
                  >
                    Apply on Official Portal (Direct .gov Link) ↗
                  </Button>
                )}

                {selectedAlert.officialPdfUrl && (
                  <Button
                    variant="outlined"
                    component="a"
                    href={selectedAlert.officialPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<PictureAsPdfIcon sx={{ color: '#EF4444' }} />}
                    sx={{
                      color: '#F8FAFC',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      fontWeight: 750,
                      textTransform: 'none',
                      py: 1.3,
                      px: 2.5,
                      borderRadius: '12px',
                      '&:hover': { borderColor: '#EF4444', bgcolor: 'rgba(239, 68, 68, 0.1)' }
                    }}
                  >
                    Official PDF Gazette ⬇
                  </Button>
                )}
              </Box>

              {/* Viral Student Community Sharing */}
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                <Typography sx={{ color: '#CBD5E1', fontSize: '0.82rem', fontWeight: 700 }}>
                  📢 दोस्तों के साथ शेयर करें (Share with Aspirants):
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => handleShare('whatsapp', selectedAlert)}
                    startIcon={<WhatsAppIcon sx={{ color: '#22C55E' }} />}
                    sx={{
                      bgcolor: 'rgba(34, 197, 94, 0.12)',
                      color: '#4ADE80',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      fontWeight: 750,
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      borderRadius: '8px',
                      '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.25)' }
                    }}
                  >
                    WhatsApp
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleShare('telegram', selectedAlert)}
                    startIcon={<TelegramIcon sx={{ color: '#38BDF8' }} />}
                    sx={{
                      bgcolor: 'rgba(56, 189, 248, 0.12)',
                      color: '#38BDF8',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      fontWeight: 750,
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      borderRadius: '8px',
                      '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.25)' }
                    }}
                  >
                    Telegram
                  </Button>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Layout>
  );
}
