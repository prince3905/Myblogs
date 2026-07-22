import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Box, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Pagination, Tooltip, CircularProgress, Switch, FormControlLabel, TextField } from '@mui/material';
import { ArrowBack, ExpandMore, ExpandLess, ContentCopy, Article, Mail, Comment, Add, Edit, Delete, Forum, MarkEmailRead, Schedule, Visibility, TrendingUp, OfflineBolt } from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import { request } from '../../../shared/lib/api';
import { calculateSeoScore } from '../../../shared/utils/seoAuditor';
import { useToast } from '../../../components/Toast';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [activity, setActivity] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);

  // Search and Calendar Date filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD

  // Filter posts in real-time
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // 1. Search Query Filter (Title match)
      const matchesSearch = searchQuery.trim() === '' || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Date Filter
      let matchesDate = true;
      if (selectedDate) {
        // Match formatted YYYY-MM-DD from post's createdAt timestamp
        const postDateString = new Date(post.createdAt).toISOString().split('T')[0];
        matchesDate = postDateString === selectedDate;
      }
      
      return matchesSearch && matchesDate;
    });
  }, [posts, searchQuery, selectedDate]);

  const perPage = 10;
  const totalPages = Math.ceil(filteredPosts.length / perPage);
  const pagePosts = filteredPosts.slice((page - 1) * perPage, page * perPage);

  function loadPosts() {
    request('/api/admin/posts').then(data => { setPosts(data); setPage(1); }).catch(err => setError(err.message));
  }

  function loadSubscribers() {
    request('/api/admin/subscribers').then(data => setSubscribers(data.subscribers || [])).catch(() => {});
  }

  function loadActivity() {
    request('/api/admin/activity')
      .then(data => setActivity(data))
      .catch(() => {});
  }

  function loadAnalytics() {
    request('/api/admin/analytics')
      .then(data => setAnalytics(data))
      .catch(() => {});
  }

  function loadSettings() {
    request('/api/admin/settings')
      .then(data => {
        if (data?.settings) {
          setAutopilotEnabled(!data.settings.disableAutopilot);
        }
      })
      .catch(() => {});
  }

  useEffect(() => { loadPosts(); loadSubscribers(); loadActivity(); loadAnalytics(); loadSettings(); }, [location.pathname]);

  async function handleAutopilotToggle(e) {
    const val = e.target.checked;
    setAutopilotEnabled(val);
    setError('');
    setSuccessMsg('');
    try {
      await request('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ key: 'disableAutopilot', value: !val })
      });
      setSuccessMsg(val ? 'Autopilot (Auto-Drafting) Chalu kar diya gaya hai! 🤖🚀' : 'Autopilot (Auto-Drafting) Band kar diya gaya hai! ⏸️');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError('Autopilot toggle setting fail ho gayi: ' + err.message);
      setAutopilotEnabled(!val);
    }
  }

  async function handleDelete() {
    await request(`/api/admin/posts/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    loadPosts();
  }

  const [successMsg, setSuccessMsg] = useState('');
  const [indexLoadingId, setIndexLoadingId] = useState(null);
  const [loadingMap, setLoadingMap] = useState({});

  const [psiLoading, setPsiLoading] = useState(false);
  const [psiResult, setPsiResult] = useState(null);
  const [autoFixLoading, setAutoFixLoading] = useState(false);
  const [fixResult, setFixResult] = useState(null);

  const setLoading = (key, val) => setLoadingMap(prev => ({ ...prev, [key]: val }));
  const isLoading = (key) => !!loadingMap[key];

  async function handleRunPagespeedAudit(strategy = 'desktop') {
    setPsiLoading(true);
    setError('');
    try {
      const res = await request('/api/admin/pagespeed-audit', {
        method: 'POST',
        body: JSON.stringify({ targetUrl: 'https://www.digitalhomeblog.in', strategy })
      });
      if (res.success) {
        setPsiResult(res);
        addToast(`PageSpeed (${strategy.toUpperCase()}) Complete! Score: ${res.score}/100, CLS: ${res.metrics.cls}`, 'success');
      } else {
        addToast(res.error || 'PageSpeed audit failed.', 'error');
        setError(res.error || 'PageSpeed audit failed.');
      }
    } catch (err) {
      addToast(err.message || 'Failed to run PageSpeed audit', 'error');
      setError(err.message || 'Failed to run PageSpeed audit');
    } finally {
      setPsiLoading(false);
    }
  }

  async function handleRunAutoFix(strategy = 'desktop') {
    setAutoFixLoading(true);
    setError('');
    try {
      const res = await request('/api/admin/pagespeed-autofix', {
        method: 'POST',
        body: JSON.stringify({ targetUrl: 'https://www.digitalhomeblog.in', strategy })
      });
      if (res.success) {
        setFixResult(res);
        addToast(`Auto-Fix Complete! Score: ${res.before.score} ➔ ${res.after.score}/100`, 'success');
      } else {
        addToast(res.error || 'Auto-fix failed.', 'error');
        setError(res.error || 'Auto-fix failed.');
      }
    } catch (err) {
      addToast(err.message || 'Failed to run Auto-Fix', 'error');
      setError(err.message || 'Failed to run Auto-Fix');
    } finally {
      setAutoFixLoading(false);
    }
  }

  async function handleIndexPing(postId) {
    setIndexLoadingId(postId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await request(`/api/admin/posts/${postId}/index-ping`, { method: 'POST' });
      if (res.success) {
        addToast(res.message || 'Google Indexing request sent successfully!', 'success');
        setSuccessMsg(res.message || 'Google Indexing request sent successfully!');
      } else {
        addToast(res.message || 'Google Indexing request failed.', 'error');
        setError(res.message || 'Google Indexing request failed.');
      }
    } catch (err) {
      addToast(err.message || 'Failed to ping Google Indexing API', 'error');
      setError(err.message || 'Failed to ping Google Indexing API');
    } finally {
      setIndexLoadingId(null);
    }
  }

  async function handleTelegramShare(postId) {
    setLoading(`${postId}-tg`, true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await request(`/api/admin/posts/${postId}/telegram-share`, { method: 'POST' });
      if (res.success) {
        addToast(res.message || '✅ Telegram Channel pe post ho gaya!', 'success');
        setSuccessMsg(res.message || 'Telegram pe post ho gaya!');
      } else {
        addToast(res.message || 'Telegram sharing failed.', 'error');
        setError(res.message || 'Telegram sharing failed.');
      }
    } catch (err) {
      addToast(err.message || 'Failed to share to Telegram', 'error');
      setError(err.message || 'Failed to share to Telegram');
    } finally {
      setLoading(`${postId}-tg`, false);
    }
  }

  async function handleWhatsappShare(postId) {
    setLoading(`${postId}-wa`, true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await request(`/api/admin/posts/${postId}/whatsapp-share`, { method: 'POST' });
      if (res.success) {
        if (res.shareUrl) {
          window.open(res.shareUrl, '_blank', 'noopener,noreferrer');
        }
        addToast('✅ WhatsApp Web khul gaya — Channel pe send karo!', 'success');
        setSuccessMsg('WhatsApp Web open hua — channel me paste karke send karo!');
      } else {
        addToast(res.message || 'WhatsApp sharing failed.', 'error');
        setError(res.message || 'WhatsApp sharing failed.');
      }
    } catch (err) {
      addToast(err.message || 'Failed to share to WhatsApp', 'error');
      setError(err.message || 'Failed to share to WhatsApp');
    } finally {
      setLoading(`${postId}-wa`, false);
    }
  }

  return (
    <>
      {/* Top bar */}
      <Box sx={{
        px: { xs: 2, md: 4 }, py: 2.5, bgcolor: 'white',
        borderBottom: '1px solid', borderColor: '#ECECEC',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>Dashboard</Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.3 }}>Welcome back, {user?.name || 'Admin'}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autopilotEnabled}
                onChange={handleAutopilotToggle}
                color="primary"
                size="small"
              />
            }
            label={
              <Typography sx={{ fontSize: '0.825rem', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                🤖 Autopilot
              </Typography>
            }
            sx={{
              border: '1px solid #ECECEC',
              borderRadius: 3,
              px: 2,
              py: 0.4,
              mr: 0,
              bgcolor: '#F9FAFB'
            }}
          />
          <Button
            component={Link}
            to="/admin/posts/new"
            variant="contained"
            startIcon={<Add />}
            sx={{ fontWeight: 600, borderRadius: 2, px: { xs: 2, md: 3 }, fontSize: { xs: '0.8rem', md: '0.875rem' } }}
          >
            New Post
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 4 } }}>
        {error ? <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}
        {successMsg ? <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert> : null}

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(5,1fr)' }, gap: 3, mb: 4 }}>
          {[
            { label: 'Total Posts', value: posts.length, icon: <Article />, color: '#4F46E5' },
            { label: 'Subscribers', value: subscribers.length, icon: <Mail />, color: '#059669' },
            { label: 'Total Views', value: analytics?.totalViews ?? 0, icon: <Visibility />, color: '#0891B2' },
            { label: 'Pending Comments', value: activity?.pendingComments ?? 0, icon: <Comment />, color: '#D97706' },
            { label: 'Contact Messages', value: activity?.recentMessages?.length ?? 0, icon: <MarkEmailRead />, color: '#DC2626' },
          ].map(stat => (
            <Paper key={stat.label} elevation={0} sx={{
              p: { xs: 2, md: 3 }, borderRadius: 3, border: '1px solid #ECECEC',
              display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 3 },
            }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: 2.5,
                bgcolor: `${stat.color}0d`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: stat.color,
              }}>
                {stat.icon}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 500 }}>{stat.label}</Typography>
                <Typography sx={{ color: '#111827', fontSize: { xs: '1.25rem', md: '1.75rem' }, fontWeight: 700, lineHeight: 1.2 }}>{stat.value}</Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* PageSpeed Live Audit Bar */}
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #ECECEC', bgcolor: '#FFFFFF' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#EEF2FF', borderRadius: 2, color: '#4F46E5', display: 'flex' }}>
                <TrendingUp />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
                  ⚡ Live Google PageSpeed Self-Diagnosis
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
                  Run live Lighthouse performance audit to diagnose speed and layout stability (CLS).
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                disabled={psiLoading}
                onClick={() => handleRunPagespeedAudit('desktop')}
                sx={{
                  bgcolor: '#4F46E5',
                  color: 'white',
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 2.2,
                  py: 0.9,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                  '&:hover': { bgcolor: '#4338CA' }
                }}
              >
                {psiLoading ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : '💻 '}
                {psiLoading ? 'Auditing...' : 'Audit Desktop'}
              </Button>

              <Button
                variant="contained"
                disabled={psiLoading}
                onClick={() => handleRunPagespeedAudit('mobile')}
                sx={{
                  bgcolor: '#059669',
                  color: 'white',
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 2.2,
                  py: 0.9,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                  '&:hover': { bgcolor: '#047857' }
                }}
              >
                {psiLoading ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : '📱 '}
                {psiLoading ? 'Auditing...' : 'Audit Mobile'}
              </Button>

              <Button
                variant="contained"
                disabled={psiLoading || autoFixLoading}
                onClick={() => handleRunAutoFix('desktop')}
                sx={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)',
                  color: 'white',
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 2.2,
                  py: 0.9,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                  '&:hover': { background: 'linear-gradient(135deg, #6D28D9 0%, #A21CAF 100%)' }
                }}
              >
                {autoFixLoading ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : '🛠️ '}
                {autoFixLoading ? 'Auto-Fixing...' : 'Auto-Fix PageSpeed Issues'}
              </Button>
            </Box>
          </Box>

          {psiResult && psiResult.success && (
            <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #ECECEC' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
                <Box sx={{ bgcolor: '#F9FAFB', p: 2, borderRadius: 2, border: '1px solid #ECECEC', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, display: 'block' }}>Performance Score</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: psiResult.score >= 85 ? '#059669' : '#D97706', mt: 0.5 }}>
                    {psiResult.score} / 100
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: '#F9FAFB', p: 2, borderRadius: 2, border: '1px solid #ECECEC', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, display: 'block' }}>CLS (Layout Shift)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: psiResult.metrics.cls < 0.1 ? '#059669' : '#DC2626', mt: 0.5 }}>
                    {psiResult.metrics.cls} {psiResult.metrics.cls < 0.1 ? '✅' : '⚠️'}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: '#F9FAFB', p: 2, borderRadius: 2, border: '1px solid #ECECEC', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, display: 'block' }}>LCP (Largest Render)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mt: 0.5 }}>
                    {psiResult.metrics.lcp}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: '#F9FAFB', p: 2, borderRadius: 2, border: '1px solid #ECECEC', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, display: 'block' }}>TBT (Blocking Time)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mt: 0.5 }}>
                    {psiResult.metrics.tbt}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: '#F9FAFB', p: 2, borderRadius: 2, border: '1px solid #ECECEC', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, display: 'block' }}>Speed Index</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mt: 0.5 }}>
                    {psiResult.metrics.speedIndex}
                  </Typography>
                </Box>
              </Box>

              {/* Detailed Diagnostic Items Breakdown */}
              <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  🔍 Google PageSpeed Diagnostic Findings ({psiResult.targetUrl}):
                </Typography>

                {/* CLS Culprits */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#DC2626', display: 'block', mb: 0.5 }}>
                    🔴 CLS Layout Shift Culprits ({psiResult.diagnostics.clsElements?.length || 0} elements):
                  </Typography>
                  {psiResult.diagnostics.clsElements?.length === 0 ? (
                    <Typography variant="caption" sx={{ color: '#059669', fontStyle: 'italic' }}>
                      No major layout shifts detected on this page! ✅
                    </Typography>
                  ) : (
                    psiResult.diagnostics.clsElements.map((el, idx) => (
                      <Box key={idx} sx={{ bgcolor: 'white', p: 1, mb: 0.8, borderRadius: 1.5, border: '1px solid #F1F5F9', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        <strong>Element:</strong> <code>{el.snippet}</code> | <strong>Score Contribution:</strong> {el.score}
                      </Box>
                    ))
                  )}
                </Box>

                {/* Render Blocking Resources */}
                {psiResult.diagnostics.renderBlocking?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#D97706', display: 'block', mb: 0.5 }}>
                      ⏳ Render Blocking CSS & JS ({psiResult.diagnostics.renderBlocking.length} resources):
                    </Typography>
                    {psiResult.diagnostics.renderBlocking.map((rb, idx) => (
                      <Typography key={idx} variant="caption" sx={{ display: 'block', color: '#475569', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                        • {rb.url.split('/').pop()} ({rb.wastedMs}ms wasted delay)
                      </Typography>
                    ))}
                  </Box>
                )}

                {/* Unused JS Payload */}
                {psiResult.diagnostics.unusedJs?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563EB', display: 'block', mb: 0.5 }}>
                      📦 Unused JavaScript Payloads ({psiResult.diagnostics.unusedJs.length} chunks):
                    </Typography>
                    {psiResult.diagnostics.unusedJs.map((js, idx) => (
                      <Typography key={idx} variant="caption" sx={{ display: 'block', color: '#475569', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                        • {js.url.split('/').pop()} ({js.wastedKb} KB unused)
                      </Typography>
                    ))}
                  </Box>
                )}

                {/* AI Agent Auto-Fix Instruction Box */}
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E40AF', display: 'block', mb: 0.3 }}>
                    🤖 AI Agent Auto-Fix Command Context:
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#1E3A8A', fontSize: '0.72rem', display: 'block', fontFamily: 'monospace' }}>
                    "Bhai PageSpeed Diagnosis me Score: {psiResult.score}, CLS: {psiResult.metrics.cls}. CLS Culprits: {psiResult.diagnostics.clsElements.map(e => e.snippet).slice(0,2).join(', ')}. Inhe auto-fix kar do!"
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Auto-Fix Before vs After Result Log */}
          {fixResult && fixResult.success && (
            <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #ECECEC' }}>
              <Box sx={{ bgcolor: '#FAF5FF', p: 2.5, borderRadius: 2.5, border: '1px solid #E9D5FF' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#6B21A8', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  🎉 Auto-Fix Results ({fixResult.strategy.toUpperCase()}) - Speed & CLS Optimization Applied!
                </Typography>

                {/* Before vs After Comparison Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                  {/* Before Box */}
                  <Box sx={{ bgcolor: '#FEF2F2', p: 2, borderRadius: 2, border: '1px solid #FCA5A5' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#991B1B', display: 'block', mb: 0.5 }}>
                      🔴 BEFORE FIX (Detected Errors):
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#7F1D1D' }}>
                      Performance Score: {fixResult.before.score} / 100
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#991B1B', mt: 0.5 }}>
                      • CLS Layout Shift: {fixResult.before.cls}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#991B1B' }}>
                      • LCP Render Time: {fixResult.before.lcp}
                    </Typography>
                    {fixResult.before.detectedIssues?.length > 0 && (
                      <Typography variant="caption" sx={{ display: 'block', color: '#991B1B', mt: 0.5, fontStyle: 'italic' }}>
                        Issues: {fixResult.before.detectedIssues.map(i => i.snippet.slice(0, 25)).join(', ')}
                      </Typography>
                    )}
                  </Box>

                  {/* After Box */}
                  <Box sx={{ bgcolor: '#ECFDF5', p: 2, borderRadius: 2, border: '1px solid #6EE7B7' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#065F46', display: 'block', mb: 0.5 }}>
                      🟢 AFTER FIX (Optimized & Verified):
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#047857' }}>
                      Performance Score: {fixResult.after.score} / 100 ✅
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#065F46', mt: 0.5 }}>
                      • CLS Layout Shift: {fixResult.after.cls} {fixResult.after.cls < 0.1 ? '✅' : ''}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#065F46' }}>
                      • LCP Render Time: {fixResult.after.lcp}
                    </Typography>
                  </Box>
                </Box>

                {/* Applied Fixes List */}
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#581C87', display: 'block', mb: 0.5 }}>
                  🛠️ Applied Code & Container Fixes:
                </Typography>
                {fixResult.appliedFixes?.map((fix, idx) => (
                  <Box key={idx} sx={{ bgcolor: 'white', p: 1.2, mb: 0.8, borderRadius: 1.5, border: '1px solid #F3E8FF' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#7E22CE', display: 'block' }}>
                      ✅ {fix.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#4B5563', fontSize: '0.73rem', display: 'block' }}>
                      {fix.details}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, mb: 4 }}>
          {/* Recent Comments */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #ECECEC', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #ECECEC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Forum sx={{ fontSize: '1.2rem', color: '#4F46E5' }} /> Recent Comments
              </Typography>
              <Button component={Link} to="/admin/comments" size="small" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#4F46E5', borderRadius: 2 }}>View All</Button>
            </Box>
            <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
              {(activity?.recentComments || []).length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem' }}>No comments yet</Typography>
                </Box>
              ) : activity?.recentComments.map((c, i) => (
                <Box key={c._id} sx={{
                  px: 3, py: 2,
                  borderBottom: i < activity.recentComments.length - 1 ? '1px solid #F3F4F6' : 'none',
                  display: 'flex', gap: 1.5, alignItems: 'flex-start',
                }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '50%', bgcolor: c.approved ? '#D1FAE5' : '#FEF3C7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    color: c.approved ? '#065F46' : '#92400E', fontSize: '0.7rem', fontWeight: 700,
                  }}>
                    {c.name?.charAt(0) || '?'}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>
                      {c.name} <Typography component="span" sx={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 400 }}>
                        on {c.post?.title || 'deleted post'}
                      </Typography>
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#6B7280', mt: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: { xs: 'normal', sm: 'nowrap' } }}>
                      {c.content}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#9CA3AF', mt: 0.3 }}>
                      <Schedule sx={{ fontSize: '0.7rem', verticalAlign: 'middle', mr: 0.3 }} />
                      {new Date(c.createdAt).toLocaleDateString()}
                      {!c.approved && <Chip label="Pending" size="small" sx={{ ml: 1, fontWeight: 600, fontSize: '0.6rem', height: 18, bgcolor: '#FEF3C7', color: '#92400E' }} />}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Recent Contact Messages */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #ECECEC', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #ECECEC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: 1 }}>
                <MarkEmailRead sx={{ fontSize: '1.2rem', color: '#DC2626' }} /> Contact Messages
              </Typography>
            </Box>
            <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
              {(activity?.recentMessages || []).length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem' }}>No messages yet</Typography>
                </Box>
              ) : activity?.recentMessages.map((m, i) => (
                <Box key={m._id} sx={{
                  px: 3, py: 2,
                  borderBottom: i < activity.recentMessages.length - 1 ? '1px solid #F3F4F6' : 'none',
                }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>
                    {m.name} <Typography component="span" sx={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 400 }}>— {m.subject}</Typography>
                  </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#6B7280', mt: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: { xs: 'normal', sm: 'nowrap' } }}>
                      {m.message}
                    </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#9CA3AF', mt: 0.3 }}>
                    <Schedule sx={{ fontSize: '0.7rem', verticalAlign: 'middle', mr: 0.3 }} />
                    {new Date(m.createdAt).toLocaleDateString()} — {m.email}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Top Posts */}
        {analytics?.topPosts?.length > 0 && (
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #ECECEC', overflow: 'hidden', mb: 4 }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #ECECEC' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ fontSize: '1.2rem', color: '#0891B2' }} /> Top Posts by Views
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ '& th': { color: '#6B7280', fontWeight: 600, fontSize: '0.75rem', py: 1.5, px: 3, borderBottom: '1px solid #ECECEC' } }}>
                    <TableCell sx={{ width: '60%' }}>Title</TableCell>
                    <TableCell sx={{ width: '20%' }}>Views</TableCell>
                    <TableCell sx={{ width: '20%' }}>Likes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.topPosts.map((p, i) => (
                    <TableRow key={p._id} sx={{
                      '& td': { py: 1.8, px: 3, borderBottom: i < analytics.topPosts.length - 1 ? '1px solid #ECECEC' : 'none' },
                      '&:hover': { bgcolor: '#F9FAFB' },
                    }}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{p.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem', color: '#0891B2', fontWeight: 700 }}>{p.views || 0}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem', color: '#6B7280' }}>{p.likes || 0}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Posts */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #ECECEC', overflow: 'hidden', mb: 4 }}>
          <Box sx={{ 
            px: 3, 
            py: 2, 
            borderBottom: '1px solid #ECECEC', 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 2 
          }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
              Posts ({filteredPosts.length === posts.length ? posts.length : `${filteredPosts.length}/${posts.length}`})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                placeholder="Search posts..."
                size="small"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                sx={{ 
                  width: { xs: '100%', sm: 220 }, 
                  '& .MuiOutlinedInput-root': { borderRadius: 2 } 
                }}
              />
              <TextField
                type="date"
                size="small"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  width: { xs: '100%', sm: 160 }, 
                  '& .MuiOutlinedInput-root': { borderRadius: 2 } 
                }}
              />
              {(searchQuery || selectedDate) && (
                <Button 
                  variant="text" 
                  color="inherit" 
                  size="small"
                  onClick={() => { setSearchQuery(''); setSelectedDate(''); setPage(1); }}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { color: '#6B7280', fontWeight: 600, fontSize: '0.75rem', py: 1.5, px: 3, borderBottom: '1px solid #ECECEC' } }}>
                  <TableCell sx={{ width: '30%' }}>Title</TableCell>
                  <TableCell sx={{ width: '8%' }}>Status</TableCell>
                  <TableCell sx={{ width: '12%' }}>Category</TableCell>
                  <TableCell sx={{ width: '12%' }}>SEO & Rank</TableCell>
                  <TableCell sx={{ width: '11%' }}>Created</TableCell>
                  <TableCell sx={{ width: '12%' }}>Updated</TableCell>
                  <TableCell sx={{ width: '15%' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagePosts.map((post, i) => {
                  const seoAudit = calculateSeoScore(post);
                  const displayScore = post.seoScore !== undefined && post.seoScore !== null ? post.seoScore : seoAudit.score;
                  const displayPotential = displayScore >= 80 ? 'High' : displayScore >= 50 ? 'Medium' : 'Low';
                  const displayBadgeColor = displayScore >= 80 ? '#10b981' : displayScore >= 50 ? '#f59e0b' : '#ef4444';
                  return (
                    <TableRow key={post._id} sx={{
                      '& td': { py: 1.8, px: 3, borderBottom: i < pagePosts.length - 1 ? '1px solid #ECECEC' : 'none' },
                      '&:hover': { bgcolor: '#F9FAFB' },
                      transition: 'background 0.15s',
                    }}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{post.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={post.status} size="small"
                          sx={{
                            fontWeight: 600, fontSize: '0.7rem', height: 24, borderRadius: 1.5,
                            bgcolor: post.status === 'published' ? '#D1FAE5' : '#F3F4F6',
                            color: post.status === 'published' ? '#065F46' : '#6B7280',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8rem', color: '#6B7280' }}>{post.category || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={seoAudit.rankPrediction.description || ''}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={`${displayScore}%`}
                              size="small"
                              sx={{
                                fontWeight: 700, fontSize: '0.7rem', height: 22,
                                bgcolor: displayScore >= 80 ? '#D1FAE5' : displayScore >= 50 ? '#FEF3C7' : '#FEE2E2',
                                color: displayScore >= 80 ? '#065F46' : displayScore >= 50 ? '#92400E' : '#991B1B',
                              }}
                            />
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: displayBadgeColor }}>
                              {displayPotential} Pot.
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500 }}>
                          {new Date(post.createdAt || post.updatedAt).toLocaleDateString()}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                          {new Date(post.createdAt || post.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500 }}>
                          {new Date(post.updatedAt).toLocaleDateString()}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                          {new Date(post.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {post.status === 'published' && (
                            <Button
                              size="small"
                              disabled={indexLoadingId === post._id}
                              onClick={() => handleIndexPing(post._id)}
                              sx={{
                                minWidth: 0, px: 1.2, py: 0.4, fontSize: '0.75rem', fontWeight: 600,
                                color: '#10B981', borderRadius: 1.5,
                                '&:hover': { bgcolor: '#ECFDF5' }
                              }}
                            >
                              {indexLoadingId === post._id ? (
                                <CircularProgress size={12} color="inherit" sx={{ mr: 0.3 }} />
                              ) : (
                                <OfflineBolt sx={{ fontSize: '0.9rem', mr: 0.3 }} />
                              )}
                              Index
                            </Button>
                          )}
                          {post.status === 'published' && (
                            <>
                              {/* WhatsApp — opens WhatsApp Web with pre-filled message */}
                              <Button
                                size="small"
                                disabled={isLoading(`${post._id}-wa`)}
                                onClick={() => handleWhatsappShare(post._id)}
                                sx={{
                                  minWidth: 0, px: 1.2, py: 0.4, fontSize: '0.75rem', fontWeight: 600,
                                  color: '#16a34a', borderRadius: 1.5,
                                  '&:hover': { bgcolor: '#F0FDF4' }
                                }}
                              >
                                {isLoading(`${post._id}-wa`) ? (
                                  <CircularProgress size={12} color="inherit" sx={{ mr: 0.3 }} />
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px' }}>
                                    <path d="M17.472 14.382C17.11 14.201 15.33 13.325 14.998 13.205C14.667 13.085 14.426 13.025 14.185 13.386C13.944 13.747 13.252 14.56 13.042 14.801C12.831 15.042 12.62 15.072 12.259 14.891C11.898 14.71 10.736 14.33 9.359 13.102C8.28 12.14 7.551 10.952 7.34 10.591C7.129 10.23 7.318 10.035 7.499 9.855C7.662 9.693 7.861 9.432 8.042 9.221C8.223 9.01 8.283 8.86 8.403 8.619C8.524 8.378 8.464 8.167 8.374 7.986C8.284 7.805 7.561 6.031 7.26 5.308C6.967 4.604 6.67 4.7 6.452 4.689C6.246 4.679 6.005 4.678 5.764 4.678C5.523 4.678 5.132 4.768 4.801 5.129C4.47 5.49 3.538 6.362 3.538 8.138C3.538 9.914 4.831 11.629 5.012 11.87C5.193 12.111 7.561 15.748 11.18 17.313C12.041 17.684 12.712 17.907 13.237 18.074C14.101 18.349 14.888 18.31 15.512 18.217C16.208 18.113 17.653 17.342 17.954 16.499C18.255 15.656 18.255 14.934 18.165 14.783C18.075 14.633 17.834 14.543 17.472 14.382Z" fill="currentColor"/>
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 13.891 2.525 15.66 3.438 17.168L2.05 21.737L6.758 20.395C8.217 21.421 9.99 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM4.011 12C4.011 7.588 7.588 4.011 12 4.011C16.412 4.011 19.989 7.588 19.989 12C19.989 16.412 16.412 19.989 12 19.989C10.285 19.989 8.704 19.447 7.411 18.528L4.629 19.324L5.448 16.604C4.536 15.289 4.011 13.705 4.011 12Z" fill="currentColor"/>
                                  </svg>
                                )}
                                WA
                              </Button>

                              {/* Telegram — auto-posts to channel */}
                              <Button
                                size="small"
                                disabled={isLoading(`${post._id}-tg`)}
                                onClick={() => handleTelegramShare(post._id)}
                                sx={{
                                  minWidth: 0, px: 1.2, py: 0.4, fontSize: '0.75rem', fontWeight: 600,
                                  color: '#2563eb', borderRadius: 1.5,
                                  '&:hover': { bgcolor: '#EFF6FF' }
                                }}
                              >
                                {isLoading(`${post._id}-tg`) ? (
                                  <CircularProgress size={12} color="inherit" sx={{ mr: 0.3 }} />
                                ) : (
                                  <Forum sx={{ fontSize: '0.9rem', mr: 0.3 }} />
                                )}
                                TG
                              </Button>
                            </>
                          )}
                          <Button component={Link} to={`/admin/posts/${post._id}/edit`} size="small"
                            sx={{ minWidth: 0, px: 1.2, py: 0.4, fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', borderRadius: 1.5, '&:hover': { bgcolor: '#EEF2FF' } }}
                          >
                            <Edit sx={{ fontSize: '0.9rem', mr: 0.3 }} /> Edit
                          </Button>
                          <Button size="small" onClick={() => setDeleteId(post._id)}
                            sx={{ minWidth: 0, px: 1.2, py: 0.4, fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderRadius: 1.5, '&:hover': { bgcolor: '#FEF2F2' } }}
                          >
                            <Delete sx={{ fontSize: '0.9rem', mr: 0.3 }} /> Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!posts.length ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Article sx={{ fontSize: 40, color: '#D1D5DB', mb: 1 }} />
                      <Typography sx={{ color: '#6B7280', fontWeight: 600 }}>No posts yet</Typography>
                      <Button component={Link} to="/admin/posts/new" variant="contained" size="small" sx={{ mt: 1.5, fontWeight: 600, borderRadius: 2 }}>
                        Create your first post
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" />
            </Box>
          )}
        </Paper>

        {/* Subscribers */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #ECECEC', overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #ECECEC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Subscribers ({subscribers.length})</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { color: '#6B7280', fontWeight: 600, fontSize: '0.75rem', py: 1.5, px: 3, borderBottom: '1px solid #ECECEC' } }}>
                  <TableCell sx={{ width: '60%' }}>Email</TableCell>
                  <TableCell sx={{ width: '40%' }}>Subscribed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscribers.map((s, i) => (
                  <TableRow key={s._id} sx={{
                    '& td': { py: 1.8, px: 3, borderBottom: i < subscribers.length - 1 ? '1px solid #ECECEC' : 'none' },
                    '&:hover': { bgcolor: '#F9FAFB' },
                  }}>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.875rem', color: '#111827', fontWeight: 500 }}>{s.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.8rem', color: '#6B7280' }}>{new Date(s.createdAt).toLocaleDateString()}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {!subscribers.length ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 6 }}>
                      <Mail sx={{ fontSize: 40, color: '#D1D5DB', mb: 1 }} />
                      <Typography sx={{ color: '#6B7280', fontWeight: 600 }}>No subscribers yet</Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Delete Post</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#6B7280' }}>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ color: '#6B7280', fontWeight: 600, borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ fontWeight: 600, borderRadius: 2, px: 3 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
