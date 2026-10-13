import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  TextField,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
  Switch,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import {
  AutoAwesome as SparklesIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  PhoneAndroid as MobileIcon,
  Laptop as DesktopIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingIcon,
  CloudUpload as PushIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { request } from '../../../shared/lib/api';
import { useToast } from '../../../components/Toast';

export default function SeoEngineBox({
  title = '',
  boardName = '',
  lastDate = '',
  category = 'Latest Job',
  slug = '',
  detailsText = '',
  seoEngine = {},
  onChange,
  onSave
}) {
  const { addToast } = useToast();

  // Mode: Auto AI Mode vs Manual Override
  const isAuto = seoEngine?.isAutoMode !== false;
  const setIsAuto = (val) => {
    handleFieldChange('isAutoMode', val);
  };

  // Internal state for keywords input & trends
  const [shortInput, setShortInput] = useState('');
  const [longInput, setLongInput] = useState('');
  const [trendSearch, setTrendSearch] = useState('');
  const [trendSuggestions, setTrendSuggestions] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingRegenerate, setLoadingRegenerate] = useState(false);
  const [pushingIndexing, setPushingIndexing] = useState(false);
  const [serpView, setSerpView] = useState('mobile'); // 'mobile' | 'desktop'

  // Current values with fallbacks
  const customMetaTitle = seoEngine?.customMetaTitle || '';
  const customMetaDescription = seoEngine?.customMetaDescription || '';
  const shortTailKeywords = seoEngine?.shortTailKeywords || [];
  const longTailKeywords = seoEngine?.longTailKeywords || [];
  const faqs = seoEngine?.faqs || [];

  // Recalculate SEO Score dynamically on-the-fly
  const liveScore = useMemo(() => {
    let score = 0;
    const t = (customMetaTitle || title || '').trim();
    const d = (customMetaDescription || '').trim();

    // Title Length (50-70 chars optimal)
    if (t.length >= 50 && t.length <= 70) score += 20;
    else if (t.length >= 38 && t.length <= 85) score += 12;
    else if (t.length > 0) score += 5;

    // Power Words in Title
    if (/\b(OUT|Apply Online|Notification|Direct Link|Form|Vacancy|Recruitment|Result|Admit Card)\b/i.test(t)) {
      score += 15;
    }

    // 2026 Year Mention
    if (/\b2026\b/.test(t) || /\b2026\b/.test(d)) {
      score += 15;
    }

    // Meta Description Length (120-155 chars)
    if (d.length >= 120 && d.length <= 158) score += 20;
    else if (d.length >= 90 && d.length <= 170) score += 12;
    else if (d.length > 0) score += 5;

    // Focus keyword match in description
    const firstWord = (title.split(' ')[0] || '').toLowerCase();
    if (firstWord && d.toLowerCase().includes(firstWord)) {
      score += 15;
    } else if (/\b(apply|notification|eligibility|date)\b/i.test(d)) {
      score += 10;
    }

    // FAQs (3 or more)
    if (faqs.length >= 3) score += 15;
    else if (faqs.length > 0) score += 8;

    return Math.min(100, Math.max(0, score));
  }, [customMetaTitle, customMetaDescription, title, faqs]);

  // Handle updates
  const handleFieldChange = (field, value) => {
    if (!onChange) return;
    onChange({
      ...seoEngine,
      [field]: value,
      seoScore: liveScore
    });
  };

  // Keyword Helpers
  const addShortKeyword = () => {
    const val = shortInput.trim();
    if (!val) return;
    if (!shortTailKeywords.includes(val)) {
      handleFieldChange('shortTailKeywords', [...shortTailKeywords, val]);
    }
    setShortInput('');
  };

  const removeShortKeyword = (kw) => {
    handleFieldChange('shortTailKeywords', shortTailKeywords.filter((k) => k !== kw));
  };

  const addLongKeyword = (valToAdd) => {
    const val = (valToAdd || longInput).trim();
    if (!val) return;
    if (!longTailKeywords.includes(val)) {
      handleFieldChange('longTailKeywords', [...longTailKeywords, val]);
    }
    setLongInput('');
  };

  const removeLongKeyword = (kw) => {
    handleFieldChange('longTailKeywords', longTailKeywords.filter((k) => k !== kw));
  };

  // Fetch Google Autocomplete / Trending Keywords
  const handleFetchGoogleTrends = async () => {
    const q = (trendSearch || title).trim();
    if (!q) {
      addToast('Search query ya post title enter karein', 'warning');
      return;
    }
    setLoadingTrends(true);
    try {
      const res = await request(`/admin/seo-intelligence/suggestions?q=${encodeURIComponent(q)}`);
      if (res?.suggestions) {
        setTrendSuggestions(res.suggestions);
        if (res.suggestions.length === 0) {
          addToast('Google Suggest API se koi naye keywords nahi mile', 'info');
        } else {
          addToast(`${res.suggestions.length} trending search queries mili!`, 'success');
        }
      }
    } catch (err) {
      addToast(err.message || 'Google suggestions load nahi ho sake', 'error');
    } finally {
      setLoadingTrends(false);
    }
  };

  // AI Regenerate Meta
  const handleAiRegenerateMeta = async () => {
    if (!title.trim()) {
      addToast('Pehle title enter karein', 'warning');
      return;
    }
    setLoadingRegenerate(true);
    try {
      const res = await request('/admin/seo-intelligence/generate-meta', {
        method: 'POST',
        body: JSON.stringify({
          title,
          boardName,
          lastDate,
          category,
          slug,
          detailsText
        })
      });

      if (res?.seoEngine) {
        if (onChange) {
          onChange({
            ...res.seoEngine,
            isAutoMode: isAuto
          });
        }
        addToast('🤖 AI Meta Titles, Descriptions & FAQs regenerated!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'AI generation failed', 'error');
    } finally {
      setLoadingRegenerate(false);
    }
  };

  // Save & Push Google Indexing
  const handlePushGoogleIndexing = async () => {
    const canonicalSlug = slug || 'sarkari-jobs';
    setPushingIndexing(true);
    try {
      if (onSave) {
        await onSave();
      }

      const res = await request('/admin/seo-intelligence/push-indexing', {
        method: 'POST',
        body: JSON.stringify({
          slug: canonicalSlug,
          title: customMetaTitle || title
        })
      });

      addToast(res.message || 'Google API & IndexNow signals successfully dispatched!', 'success');
    } catch (err) {
      addToast(err.message || 'Indexing push failed', 'error');
    } finally {
      setPushingIndexing(false);
    }
  };

  // FAQ handlers
  const handleFaqChange = (index, field, value) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    handleFieldChange('faqs', updated);
  };

  const handleAddFaq = () => {
    handleFieldChange('faqs', [
      ...faqs,
      { question: 'New Question?', answer: 'Answer details here...' }
    ]);
  };

  const handleRemoveFaq = (index) => {
    const updated = faqs.filter((_, i) => i !== index);
    handleFieldChange('faqs', updated);
  };

  // Score Badge
  const scoreBadge = useMemo(() => {
    if (liveScore >= 80) return { label: 'Excellent (Green)', color: '#16a34a', bg: '#dcfce7', icon: <CheckIcon fontSize="small" /> };
    if (liveScore >= 50) return { label: 'Moderate (Yellow)', color: '#d97706', bg: '#fef3c7', icon: <WarningIcon fontSize="small" /> };
    return { label: 'Needs Optimization (Red)', color: '#dc2626', bg: '#fee2e2', icon: <ErrorIcon fontSize="small" /> };
  }, [liveScore]);

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 2, sm: 3 },
        mt: 3,
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        bgcolor: '#ffffff',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* ── HEADER & MODE SWITCH ── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            <SparklesIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem', lineHeight: 1.2 }}>
              Universal AI SEO & Keyword Intelligence Engine
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              RankMath & Yoast Architecture • 100% Google SERP Compliant
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f1f5f9', p: 0.6, borderRadius: 2 }}>
          <Button
            size="small"
            variant={isAuto ? 'contained' : 'text'}
            onClick={() => setIsAuto(true)}
            sx={{
              borderRadius: 1.5,
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'none',
              bgcolor: isAuto ? '#4f46e5' : 'transparent',
              color: isAuto ? '#ffffff' : '#64748b',
              '&:hover': { bgcolor: isAuto ? '#4338ca' : '#e2e8f0' }
            }}
          >
            ⚡ Auto AI Mode
          </Button>
          <Button
            size="small"
            variant={!isAuto ? 'contained' : 'text'}
            onClick={() => setIsAuto(false)}
            sx={{
              borderRadius: 1.5,
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'none',
              bgcolor: !isAuto ? '#0f172a' : 'transparent',
              color: !isAuto ? '#ffffff' : '#64748b',
              '&:hover': { bgcolor: !isAuto ? '#1e293b' : '#e2e8f0' }
            }}
          >
            ✍️ Manual Override
          </Button>
        </Box>
      </Box>

      {/* ── REAL-TIME SEO SCORE METER ── */}
      <Box sx={{ p: 2, mb: 3, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
              On-Page SEO Score:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: scoreBadge.color }}>
              {liveScore} / 100
            </Typography>
          </Box>
          <Chip
            icon={scoreBadge.icon}
            label={scoreBadge.label}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              color: scoreBadge.color,
              bgcolor: scoreBadge.bg,
              border: `1px solid ${scoreBadge.color}`
            }}
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={liveScore}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: '#e2e8f0',
            '& .MuiLinearProgress-bar': {
              bgcolor: scoreBadge.color,
              borderRadius: 5
            }
          }}
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5, fontSize: '0.75rem', color: '#64748b' }}>
          <span>• Title: {customMetaTitle.length}/68 chars</span>
          <span>• Meta Desc: {customMetaDescription.length}/155 chars</span>
          <span>• Year 2026: {/\b2026\b/.test(customMetaTitle) ? '✅' : '⚠️'}</span>
          <span>• FAQs: {faqs.length} items</span>
        </Box>
      </Box>

      {/* ── SERP LIVE PREVIEW BOX ── */}
      <Box sx={{ mb: 3, p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #cbd5e1' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
            📱 Google SERP Live Snippet Preview
          </Typography>
          <ToggleButtonGroup
            value={serpView}
            exclusive
            size="small"
            onChange={(_, val) => val && setSerpView(val)}
            sx={{ height: 30 }}
          >
            <ToggleButton value="mobile" sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1 }}>
              <MobileIcon sx={{ fontSize: 16, mr: 0.5 }} /> Mobile
            </ToggleButton>
            <ToggleButton value="desktop" sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1 }}>
              <DesktopIcon sx={{ fontSize: 16, mr: 0.5 }} /> Desktop
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Card Snippet */}
        <Box
          sx={{
            p: 2,
            bgcolor: '#ffffff',
            borderRadius: 2,
            boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
            maxWidth: serpView === 'mobile' ? 380 : '100%',
            border: '1px solid #e2e8f0'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                bgcolor: '#4f46e5',
                color: '#fff',
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800
              }}
            >
              DH
            </Box>
            <Typography variant="caption" sx={{ color: '#202124', fontWeight: 600, fontSize: '0.78rem' }}>
              Digital Home Sarkari Result
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#4d5156', display: 'block', mb: 0.5, fontSize: '0.75rem' }}>
            https://www.digitalhomeblog.in › india › sarkari-jobs › {slug || 'sample-job-2026'}
          </Typography>
          <Typography
            sx={{
              color: '#1a0dab',
              fontWeight: 600,
              fontSize: '1rem',
              lineHeight: 1.3,
              cursor: 'pointer',
              mb: 0.6,
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {customMetaTitle || title || 'Sarkari Result 2026: Recruitment Apply Online Form'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#4d5156', fontSize: '0.85rem', lineHeight: 1.4 }}>
            {customMetaDescription ||
              'Apply online for official recruitment. Check notification, eligibility, age limit, salary, and last date at Digital Home.'}
          </Typography>
        </Box>
      </Box>

      {/* ── META TITLE & DESCRIPTION INPUTS ── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
            SEO Meta Title
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: customMetaTitle.length > 70 ? '#dc2626' : customMetaTitle.length < 50 ? '#d97706' : '#16a34a'
            }}
          >
            {customMetaTitle.length} / 68 Characters {customMetaTitle.length > 70 ? '(Too Long!)' : ''}
          </Typography>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="e.g. Sarkari Result 2026: SSC CGL Recruitment – Apply Online Form"
          value={customMetaTitle}
          disabled={isAuto}
          onChange={(e) => handleFieldChange('customMetaTitle', e.target.value)}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
            SEO Meta Description
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: customMetaDescription.length > 155 ? '#dc2626' : customMetaDescription.length < 120 ? '#d97706' : '#16a34a'
            }}
          >
            {customMetaDescription.length} / 155 Characters {customMetaDescription.length > 155 ? '(Too Long!)' : ''}
          </Typography>
        </Box>
        <TextField
          fullWidth
          multiline
          rows={2}
          size="small"
          placeholder="e.g. Apply online for SSC CGL 2026. Check notification PDF, eligibility, age limit, salary, syllabus, and last date at Digital Home."
          value={customMetaDescription}
          disabled={isAuto}
          onChange={(e) => handleFieldChange('customMetaDescription', e.target.value)}
        />
      </Box>

      {/* ── ACTION BUTTONS: AI REGENERATE & PUSH INDEXING ── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleAiRegenerateMeta}
          disabled={loadingRegenerate}
          startIcon={loadingRegenerate ? <CircularProgress size={16} /> : <SparklesIcon />}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          {loadingRegenerate ? 'Generating...' : '🤖 AI Regenerate Meta'}
        </Button>

        <Button
          variant="contained"
          onClick={handlePushGoogleIndexing}
          disabled={pushingIndexing}
          startIcon={pushingIndexing ? <CircularProgress size={16} color="inherit" /> : <PushIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
          }}
        >
          {pushingIndexing ? 'Pushing Indexing...' : '💾 Save & Push Google Indexing'}
        </Button>
      </Box>

      <Divider sx={{ my: 2.5 }} />

      {/* ── KEYWORD INTELLIGENCE & GOOGLE TRENDS ── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingIcon fontSize="small" sx={{ color: '#4f46e5' }} /> Real-Time Google Search Trends & Autocomplete
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={title ? `Query: ${title}` : 'Type job name or keyword...'}
            value={trendSearch}
            onChange={(e) => setTrendSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetchGoogleTrends()}
          />
          <Button
            variant="contained"
            onClick={handleFetchGoogleTrends}
            disabled={loadingTrends}
            startIcon={loadingTrends ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#4f46e5', minWidth: 160 }}
          >
            {loadingTrends ? 'Fetching...' : 'Fetch Trends'}
          </Button>
        </Box>

        {trendSuggestions.length > 0 && (
          <Box sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#f1f5f9', border: '1px solid #cbd5e1' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
              💡 Click any query to instantly add as Long-Tail Keyword:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {trendSuggestions.map((sug, idx) => (
                <Chip
                  key={idx}
                  label={`+ ${sug}`}
                  size="small"
                  onClick={() => addLongKeyword(sug)}
                  sx={{
                    bgcolor: '#ffffff',
                    border: '1px solid #4f46e5',
                    color: '#4f46e5',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#e0e7ff' }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Short-Tail Keywords */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.8 }}>
          🏷️ Short-Tail Keywords ({shortTailKeywords.length}):
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.5 }}>
          {shortTailKeywords.map((kw, idx) => (
            <Chip
              key={idx}
              label={kw}
              size="small"
              onDelete={!isAuto ? () => removeShortKeyword(kw) : undefined}
              sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 700 }}
            />
          ))}
          {!isAuto && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <TextField
                size="small"
                placeholder="Add short keyword..."
                value={shortInput}
                onChange={(e) => setShortInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addShortKeyword()}
                sx={{ width: 160, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.75rem' } }}
              />
              <IconButton size="small" onClick={addShortKeyword} color="primary">
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Long-Tail Keywords */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.8 }}>
          🎯 Target Long-Tail Keywords ({longTailKeywords.length}):
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.5 }}>
          {longTailKeywords.map((kw, idx) => (
            <Chip
              key={idx}
              label={kw}
              size="small"
              onDelete={!isAuto ? () => removeLongKeyword(kw) : undefined}
              sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}
            />
          ))}
          {!isAuto && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <TextField
                size="small"
                placeholder="Add long-tail query..."
                value={longInput}
                onChange={(e) => setLongInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLongKeyword()}
                sx={{ width: 200, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.75rem' } }}
              />
              <IconButton size="small" onClick={() => addLongKeyword()} color="primary">
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 2.5 }} />

      {/* ── RICH FAQS SCHEMA (SERP ACCORDION) ── */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
            ❓ Structured FAQ Schema (Google SERP Accordion Rich Results)
          </Typography>
          {!isAuto && (
            <Button size="small" startIcon={<AddIcon />} onClick={handleAddFaq} sx={{ textTransform: 'none', fontWeight: 700 }}>
              Add FAQ
            </Button>
          )}
        </Box>

        {faqs.map((faq, idx) => (
          <Accordion key={idx} sx={{ mb: 1, border: '1px solid #e2e8f0', borderRadius: '8px !important', boxShadow: 'none' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Q{idx + 1}: {faq.question || 'Empty Question'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <TextField
                fullWidth
                size="small"
                label="Question"
                value={faq.question}
                disabled={isAuto}
                onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                sx={{ mb: 1.5 }}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Answer"
                value={faq.answer}
                disabled={isAuto}
                onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
              />
              {!isAuto && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleRemoveFaq(idx)}>
                    Remove FAQ
                  </Button>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}

        {faqs.length === 0 && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No FAQs generated yet. Click <strong>"🤖 AI Regenerate Meta"</strong> to auto-build core FAQ schema!
          </Alert>
        )}
      </Box>
    </Paper>
  );
}
