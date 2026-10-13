import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  Tune as SettingsIcon,
  Language as GlobeIcon,
  Send as TelegramIcon,
  CloudDone as IndexingIcon,
  AutoAwesome as SparklesIcon,
  Refresh as RefreshIcon,
  RocketLaunch as RocketIcon,
  PhoneAndroid as MobileIcon,
  Laptop as DesktopIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Share as ShareIcon,
  Search as SearchIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { request } from '../../../shared/lib/api';
import { useToast } from '../../../components/Toast';

export default function GlobalSeoSettingsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [serpView, setSerpView] = useState('mobile'); // 'mobile' | 'desktop'

  // Keywords State
  const [shortInput, setShortInput] = useState('');
  const [longInput, setLongInput] = useState('');

  // Autocomplete Suggestions State
  const [suggestionQuery, setSuggestionQuery] = useState('sarkari result 2026');
  const [suggestions, setSuggestions] = useState([]);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);

  // Global Config
  const [config, setConfig] = useState({
    siteMetaTitle: 'Sarkari Result 2026: Latest Sarkari Naukri, Online Form, Admit Card & Results',
    siteMetaDescription: 'Digital Home Sarkari Result: Get latest online forms, government jobs alerts 2026, admit cards, answer keys, syllabus, and results for 10th, 12th, and graduate.',
    siteShortTailKeywords: [
      'Sarkari Result',
      'Sarkari Job 2026',
      'Sarkari Naukri',
      'Free Job Alert',
      'Online Form'
    ],
    siteLongTailKeywords: [
      'latest sarkari job 2026 apply online',
      'sarkari result admit card 10th 12th pass',
      'up police ssc railway bharti notification'
    ],
    jobTitlePattern: 'Sarkari Result 2026: {title} – Apply Online Form',
    jobMetaPattern: 'Apply online for {title}. Check notification, eligibility, age limit, salary, and last date at Digital Home.',
    defaultOgBanner: '/og-sarkari-banner-1200x675.webp',
    autoExtractKeywords: true,
    autoPingIndexingApi: true,
    autoDispatchTelegram: false
  });

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await request('/admin/seo-intelligence/config');
      if (res?.config) {
        setConfig((prev) => ({
          ...prev,
          ...res.config,
          siteShortTailKeywords: Array.isArray(res.config.siteShortTailKeywords) && res.config.siteShortTailKeywords.length > 0
            ? res.config.siteShortTailKeywords
            : prev.siteShortTailKeywords,
          siteLongTailKeywords: Array.isArray(res.config.siteLongTailKeywords) && res.config.siteLongTailKeywords.length > 0
            ? res.config.siteLongTailKeywords
            : prev.siteLongTailKeywords
        }));
      }
    } catch (err) {
      addToast(err.message || 'Failed to load SEO configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    fetchGoogleSuggestions('sarkari result 2026');
  }, []);

  const handleChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await request('/admin/seo-intelligence/config', {
        method: 'PUT',
        body: JSON.stringify(config)
      });
      addToast(res.message || 'Global SEO Settings saved successfully!', 'success');
      if (res?.config) {
        setConfig((prev) => ({
          ...prev,
          ...res.config
        }));
      }
    } catch (err) {
      addToast(err.message || 'Failed to save SEO settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePingHomepage = async () => {
    setPinging(true);
    try {
      const res = await request('/admin/seo-intelligence/ping-homepage', {
        method: 'POST'
      });
      addToast(res.message || '🚀 Homepage indexing signals successfully sent to Google API & IndexNow!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to ping homepage indexing', 'error');
    } finally {
      setPinging(false);
    }
  };

  // Keyword Management Helpers
  const addShortKeyword = () => {
    const val = shortInput.trim();
    if (!val) return;
    const current = config.siteShortTailKeywords || [];
    if (!current.includes(val)) {
      handleChange('siteShortTailKeywords', [...current, val]);
    }
    setShortInput('');
  };

  const removeShortKeyword = (kw) => {
    const current = config.siteShortTailKeywords || [];
    handleChange('siteShortTailKeywords', current.filter((k) => k !== kw));
  };

  const addLongKeyword = (val) => {
    const clean = (val || longInput).trim();
    if (!clean) return;
    const current = config.siteLongTailKeywords || [];
    if (!current.includes(clean)) {
      handleChange('siteLongTailKeywords', [...current, clean]);
      addToast(`Added "${clean}" to Long-Tail Keywords!`, 'success');
    }
    setLongInput('');
  };

  const removeLongKeyword = (kw) => {
    const current = config.siteLongTailKeywords || [];
    handleChange('siteLongTailKeywords', current.filter((k) => k !== kw));
  };

  const fetchGoogleSuggestions = async (q) => {
    const query = q !== undefined ? q : suggestionQuery;
    if (!query.trim()) return;
    setFetchingSuggestions(true);
    try {
      const res = await request(`/admin/seo-intelligence/suggestions?q=${encodeURIComponent(query.trim())}`);
      if (Array.isArray(res?.suggestions)) {
        setSuggestions(res.suggestions);
      }
    } catch (err) {
      console.warn('Failed to fetch suggestions:', err.message);
    } finally {
      setFetchingSuggestions(false);
    }
  };

  // Live Metrics Calculations
  const titleLength = (config.siteMetaTitle || '').length;
  const descLength = (config.siteMetaDescription || '').length;

  const isTitleOptimal = titleLength >= 45 && titleLength <= 60;
  const isTitleWarning = titleLength > 60;
  const isDescOptimal = descLength >= 120 && descLength <= 155;
  const isDescWarning = descLength > 155;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={42} sx={{ color: '#4f46e5' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* ── 1. TOP ACTION BAR ── */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 4,
          pb: 2,
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 18px rgba(79, 70, 229, 0.35)'
            }}
          >
            <SettingsIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 850, color: '#0f172a', letterSpacing: '-0.02em' }}>
              🌐 Global Site SEO Engine & Brand SERP Hub
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, mt: 0.3 }}>
              Full RankMath & Yoast-Style Brand Management, Live Google SERP Preview & Instant Indexing
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={handlePingHomepage}
            disabled={pinging}
            startIcon={pinging ? <CircularProgress size={16} color="inherit" /> : <RocketIcon />}
            sx={{
              px: 2.2,
              py: 1,
              borderRadius: 2.5,
              fontWeight: 750,
              fontSize: '0.85rem',
              textTransform: 'none',
              color: '#0284c7',
              borderColor: '#38bdf8',
              bgcolor: '#f0f9ff',
              '&:hover': {
                bgcolor: '#e0f2fe',
                borderColor: '#0284c7'
              }
            }}
          >
            {pinging ? 'Pinging Google & Bing...' : '🚀 Ping Google & Bing for Homepage'}
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2.5,
              fontWeight: 800,
              fontSize: '0.88rem',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)'
              }
            }}
          >
            {saving ? 'Saving Settings...' : '💾 Save Global Settings'}
          </Button>
        </Box>
      </Box>

      {/* ── 2. LIVE GOOGLE SERP PREVIEW CARD (HOMEPAGE VIEW) ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3.5,
          border: '1px solid #e2e8f0',
          mb: 4,
          bgcolor: '#ffffff',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
              <GlobeIcon sx={{ color: '#4f46e5' }} /> Live Google Search SERP Snippet Preview (Homepage)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Real-time representation of how your main domain appears on Google Search results.
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={serpView}
            exclusive
            onChange={(_, val) => val && setSerpView(val)}
            size="small"
            sx={{ bgcolor: '#f1f5f9', borderRadius: 2 }}
          >
            <ToggleButton value="mobile" sx={{ px: 1.5, py: 0.4, textTransform: 'none', fontWeight: 700, gap: 0.6 }}>
              <MobileIcon sx={{ fontSize: 16 }} /> Mobile
            </ToggleButton>
            <ToggleButton value="desktop" sx={{ px: 1.5, py: 0.4, textTransform: 'none', fontWeight: 700, gap: 0.6 }}>
              <DesktopIcon sx={{ fontSize: 16 }} /> Desktop
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Authentic Google SERP Box */}
        <Box
          sx={{
            p: serpView === 'mobile' ? 2 : 2.5,
            maxWidth: serpView === 'mobile' ? 440 : 660,
            bgcolor: '#ffffff',
            borderRadius: serpView === 'mobile' ? 3 : 2,
            border: '1px solid #dadce0',
            boxShadow: '0 1px 6px rgba(32, 33, 36, 0.1)',
            mb: 3,
            transition: 'max-width 0.25s ease'
          }}
        >
          {/* Breadcrumb line */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.6 }}>
            <Box
              component="img"
              src="/logo.webp"
              alt="Favicon"
              sx={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'contain', bgcolor: '#f1f5f9' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <Box>
              <Typography sx={{ fontSize: '0.8rem', color: '#202124', fontWeight: 600, lineHeight: 1.2 }}>
                Digital Home
              </Typography>
              <Typography sx={{ fontSize: '0.74rem', color: '#4d5156', lineHeight: 1.2 }}>
                https://www.digitalhomeblog.in
              </Typography>
            </Box>
          </Box>

          {/* Clickable Blue Title */}
          <Typography
            sx={{
              color: '#1a0dab',
              fontSize: serpView === 'mobile' ? '1.05rem' : '1.25rem',
              fontWeight: 400,
              lineHeight: 1.3,
              cursor: 'pointer',
              mb: 0.6,
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {config.siteMetaTitle || 'Sarkari Result 2026: Latest Sarkari Naukri, Online Form, Admit Card & Results'}
          </Typography>

          {/* Snippet Description */}
          <Typography
            sx={{
              color: '#4d5156',
              fontSize: '0.88rem',
              lineHeight: 1.55,
              display: '-webkit-box',
              WebkitLineClamp: serpView === 'mobile' ? 3 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {config.siteMetaDescription || 'Digital Home Sarkari Result: Get latest online forms, government jobs alerts 2026, admit cards, answer keys, syllabus, and results for 10th, 12th, and graduate.'}
          </Typography>
        </Box>

        {/* Character Gauges & Editors */}
        <Grid container spacing={3}>
          {/* Title Editor & Progress */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Homepage Meta Title
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    color: isTitleOptimal ? '#16a34a' : isTitleWarning ? '#dc2626' : '#d97706'
                  }}
                >
                  {titleLength} / 60 characters
                </Typography>
                {isTitleOptimal ? (
                  <CheckIcon sx={{ fontSize: 16, color: '#16a34a' }} />
                ) : (
                  <WarningIcon sx={{ fontSize: 16, color: isTitleWarning ? '#dc2626' : '#d97706' }} />
                )}
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (titleLength / 60) * 100)}
              sx={{
                height: 5,
                borderRadius: 2,
                mb: 1.2,
                bgcolor: '#e2e8f0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: isTitleOptimal ? '#16a34a' : isTitleWarning ? '#dc2626' : '#f59e0b',
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              value={config.siteMetaTitle || ''}
              onChange={(e) => handleChange('siteMetaTitle', e.target.value)}
              placeholder="e.g. Sarkari Result 2026: Latest Sarkari Naukri, Online Form, Admit Card & Results"
              helperText="Google typically truncates titles over 60 characters (approx 600px)."
              sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}
            />
          </Grid>

          {/* Description Editor & Progress */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Homepage Meta Description
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    color: isDescOptimal ? '#16a34a' : isDescWarning ? '#dc2626' : '#d97706'
                  }}
                >
                  {descLength} / 155 characters
                </Typography>
                {isDescOptimal ? (
                  <CheckIcon sx={{ fontSize: 16, color: '#16a34a' }} />
                ) : (
                  <WarningIcon sx={{ fontSize: 16, color: isDescWarning ? '#dc2626' : '#d97706' }} />
                )}
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (descLength / 155) * 100)}
              sx={{
                height: 5,
                borderRadius: 2,
                mb: 1.2,
                bgcolor: '#e2e8f0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: isDescOptimal ? '#16a34a' : isDescWarning ? '#dc2626' : '#f59e0b',
                  borderRadius: 2
                }
              }}
            />
            <TextField
              fullWidth
              multiline
              rows={2.5}
              value={config.siteMetaDescription || ''}
              onChange={(e) => handleChange('siteMetaDescription', e.target.value)}
              placeholder="e.g. Digital Home Sarkari Result: Get latest online forms, government jobs alerts 2026..."
              helperText="Optimal description length for desktop and mobile SERPs is between 120 and 155 characters."
              sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ── 3. GLOBAL BRAND KEYWORDS MATRIX ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3.5,
          border: '1px solid #e2e8f0',
          mb: 4,
          bgcolor: '#ffffff',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <SparklesIcon sx={{ color: '#06b6d4' }} /> Global Brand Keywords Matrix & Autocomplete Intelligence
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 3 }}>
          High-intent keywords used to hydrate the Homepage <code>&lt;meta name="keywords"&gt;</code> and anchor signals.
        </Typography>

        <Grid container spacing={3}>
          {/* Primary Short-Tail Brand Keywords */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    🏷️ Primary Short-Tail Keywords
                  </Typography>
                  <Chip
                    label={`${(config.siteShortTailKeywords || []).length} keywords`}
                    size="small"
                    sx={{ fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569', height: 22, fontSize: '0.72rem' }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                  High-volume core brand tokens (e.g. Sarkari Result, Free Job Alert, Online Form).
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5, minHeight: 48 }}>
                  {(config.siteShortTailKeywords || []).map((kw) => (
                    <Chip
                      key={kw}
                      label={kw}
                      onDelete={() => removeShortKeyword(kw)}
                      size="small"
                      sx={{
                        bgcolor: '#ede9fe',
                        color: '#6d28d9',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        borderRadius: 2,
                        '& .MuiChip-deleteIcon': { color: '#8b5cf6', '&:hover': { color: '#6d28d9' } }
                      }}
                    />
                  ))}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Add short-tail keyword..."
                    value={shortInput}
                    onChange={(e) => setShortInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addShortKeyword();
                      }
                    }}
                    sx={{ bgcolor: '#f8fafc' }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={addShortKeyword}
                    startIcon={<AddIcon />}
                    sx={{
                      borderRadius: 2,
                      px: 2,
                      fontWeight: 700,
                      textTransform: 'none',
                      bgcolor: '#6d28d9',
                      '&:hover': { bgcolor: '#5b21b6' }
                    }}
                  >
                    Add
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Secondary Long-Tail Intent Keywords */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    🎯 Secondary Long-Tail Intent Queries
                  </Typography>
                  <Chip
                    label={`${(config.siteLongTailKeywords || []).length} queries`}
                    size="small"
                    sx={{ fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569', height: 22, fontSize: '0.72rem' }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                  Conversational search phrases driving long-tail intent traffic from Google.
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5, minHeight: 48 }}>
                  {(config.siteLongTailKeywords || []).map((kw) => (
                    <Chip
                      key={kw}
                      label={kw}
                      onDelete={() => removeLongKeyword(kw)}
                      size="small"
                      sx={{
                        bgcolor: '#e0f2fe',
                        color: '#0369a1',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        borderRadius: 2,
                        '& .MuiChip-deleteIcon': { color: '#38bdf8', '&:hover': { color: '#0369a1' } }
                      }}
                    />
                  ))}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Add long-tail query..."
                    value={longInput}
                    onChange={(e) => setLongInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLongKeyword(longInput);
                      }
                    }}
                    sx={{ bgcolor: '#f8fafc' }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => addLongKeyword(longInput)}
                    startIcon={<AddIcon />}
                    sx={{
                      borderRadius: 2,
                      px: 2,
                      fontWeight: 700,
                      textTransform: 'none',
                      bgcolor: '#0284c7',
                      '&:hover': { bgcolor: '#0369a1' }
                    }}
                  >
                    Add
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Live Google Autocomplete Suggestions Integration */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: 2.5,
                bgcolor: '#f8fafc',
                borderRadius: 3,
                border: '1px solid #e2e8f0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingIcon sx={{ color: '#f59e0b' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    ⚡ Real-Time Google Autocomplete Suggestions
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    value={suggestionQuery}
                    onChange={(e) => setSuggestionQuery(e.target.value)}
                    placeholder="Search Google autocomplete..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        fetchGoogleSuggestions(suggestionQuery);
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{ width: { xs: 200, sm: 260 }, bgcolor: '#ffffff' }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => fetchGoogleSuggestions(suggestionQuery)}
                    disabled={fetchingSuggestions}
                    startIcon={fetchingSuggestions ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 2,
                      borderColor: '#cbd5e1',
                      color: '#475569'
                    }}
                  >
                    Fetch
                  </Button>
                </Box>
              </Box>

              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
                Click any suggestion badge below to instantly add it to your site's Long-Tail Keywords:
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {fetchingSuggestions ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Querying Google Suggest API in real time...
                    </Typography>
                  </Box>
                ) : suggestions.length > 0 ? (
                  suggestions.map((sug) => {
                    const isAdded = (config.siteLongTailKeywords || []).includes(sug);
                    return (
                      <Chip
                        key={sug}
                        label={`+ ${sug}`}
                        clickable
                        onClick={() => addLongKeyword(sug)}
                        disabled={isAdded}
                        size="small"
                        sx={{
                          bgcolor: isAdded ? '#f1f5f9' : '#ffffff',
                          color: isAdded ? '#94a3b8' : '#0f172a',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: isAdded ? '#e2e8f0' : '#cbd5e1',
                          '&:hover': {
                            bgcolor: isAdded ? '#f1f5f9' : '#e0f2fe',
                            borderColor: '#38bdf8'
                          }
                        }}
                      />
                    );
                  })
                ) : (
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    Type a query above and click Fetch to view live keyword recommendations from Google.
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ── 4. SOCIAL & OPENGRAPH PREVIEW CARD ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3.5,
          border: '1px solid #e2e8f0',
          mb: 4,
          bgcolor: '#ffffff',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <ShareIcon sx={{ color: '#16a34a' }} /> Social & OpenGraph Card Preview (WhatsApp, Twitter, LinkedIn)
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 3 }}>
          Ensure compliance with Google Discover and social preview specifications (1200x675, 16:9 ratio).
        </Typography>

        <Grid container spacing={3} alignItems="center">
          {/* Visual Social Card Mockup */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                maxWidth: 440,
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                bgcolor: '#ffffff'
              }}
            >
              {/* Banner Thumbnail (16:9) */}
              <Box sx={{ width: '100%', height: 210, bgcolor: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                <Box
                  component="img"
                  src={config.defaultOgBanner || '/og-sarkari-banner-1200x675.webp'}
                  alt="Social Banner"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = '/og-sarkari-banner-1200x675.webp';
                  }}
                />
                <Chip
                  label="1200 x 675 (16:9)"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    bgcolor: 'rgba(15, 23, 42, 0.8)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    backdropFilter: 'blur(4px)'
                  }}
                />
              </Box>

              {/* Card Meta Text */}
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                  DIGITALHOMEBLOG.IN
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.94rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    lineHeight: 1.3,
                    mb: 0.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {config.siteMetaTitle || 'Sarkari Result 2026: Latest Sarkari Naukri, Online Form, Admit Card & Results'}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    color: '#475569',
                    lineHeight: 1.45,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {config.siteMetaDescription || 'Digital Home Sarkari Result: Get latest online forms, government jobs alerts 2026, admit cards, answer keys, syllabus, and results for 10th, 12th, and graduate.'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Social Banner Setting */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Default OpenGraph Banner URL"
              value={config.defaultOgBanner || ''}
              onChange={(e) => handleChange('defaultOgBanner', e.target.value)}
              helperText="High-contrast 1200x675 (16:9) WebP image required for Google Discover eligibility."
              sx={{ bgcolor: '#f8fafc', borderRadius: 2, mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleChange('defaultOgBanner', '/og-sarkari-banner-1200x675.webp')}
                sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', fontWeight: 700 }}
              >
                Use Official 1200x675 Banner
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ── 5. TEMPLATE PATTERNS & AUTOMATION SWITCHES ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3.5,
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <SettingsIcon sx={{ color: '#4f46e5' }} /> Dynamic Patterns & Post-Publish Automations
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 3 }}>
          Configure fallback vacancy title patterns and automated background indexing triggers.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Job Meta Title Pattern"
              value={config.jobTitlePattern || ''}
              onChange={(e) => handleChange('jobTitlePattern', e.target.value)}
              helperText="Default: Sarkari Result 2026: {title} – Apply Online Form"
              sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Job Meta Description Pattern"
              value={config.jobMetaPattern || ''}
              onChange={(e) => handleChange('jobMetaPattern', e.target.value)}
              helperText="Default: Apply online for {title}. Check notification, eligibility, age limit, salary, and last date at Digital Home."
              sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          {/* Toggle 1: Auto Keyword Extraction */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    Auto-Extract Short-Tail & Long-Tail Keywords
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Automatically tag government organization names, power words, and query candidates on post-save.
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.autoExtractKeywords !== false}
                      onChange={(e) => handleChange('autoExtractKeywords', e.target.checked)}
                      color="primary"
                    />
                  }
                  label=""
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Toggle 2: Auto Ping Indexing API */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <IndexingIcon sx={{ color: '#16a34a' }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                      Auto-Ping Google Indexing API & IndexNow (Bing/Yandex)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Sends instant URL_UPDATED notification upon publishing any active live alert or blog post.
                    </Typography>
                  </Box>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.autoPingIndexingApi !== false}
                      onChange={(e) => handleChange('autoPingIndexingApi', e.target.checked)}
                      color="success"
                    />
                  }
                  label=""
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Toggle 3: Auto Dispatch Telegram */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <TelegramIcon sx={{ color: '#0284c7' }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                      Auto-Dispatch to Official Telegram Channel
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Automatically broadcasts markdown recruitment alerts to @SarkariJob_DigitalHome when published.
                    </Typography>
                  </Box>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(config.autoDispatchTelegram)}
                      onChange={(e) => handleChange('autoDispatchTelegram', e.target.checked)}
                      color="info"
                    />
                  }
                  label=""
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
