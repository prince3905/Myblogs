import { useEffect, useState, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Grid, Paper, Chip, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Alert, Card, CardContent, IconButton, InputAdornment, Tooltip,
} from '@mui/material';
import {
  TravelExplore as ExploreIcon, TrendingUp as TrendIcon, Search as SearchIcon,
  AutoAwesome as AiIcon, ArrowForward as ArrowIcon, OpenInNew as OpenIcon,
  Psychology as IntentIcon, Analytics as SerpIcon, ContentCopy as CopyIcon,
  Visibility as ViewIcon, KeyboardArrowDown as ExpandIcon, KeyboardArrowUp as CollapseIcon,
} from '@mui/icons-material';
import { request } from '../../../shared/lib/api';
import { useToast } from '../../../components/Toast';

const CATEGORY_COLORS = {
  'Sarkari Jobs & Exams': '#dc2626',
  'Health & Wellness': '#059669',
  'Tech & Tutorials': '#2563eb',
  'AI & Web Tools': '#7c3aed',
  'News & Trends': '#d97706',
  'Finance & Business': '#0891b2',
};

const INTENT_COLORS = {
  informational: { bg: '#e0f2fe', color: '#0369a1', icon: '🔍' },
  commercial: { bg: '#fef3c7', color: '#92400e', icon: '🛒' },
  transactional: { bg: '#dcfce7', color: '#166534', icon: '⚡' },
  navigational: { bg: '#f3e8ff', color: '#6d28d9', icon: '🧭' },
};

export default function KeywordResearchPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState({});
  const [error, setError] = useState('');
  const [newsTopics, setNewsTopics] = useState([]);
  const [trendTopics, setTrendTopics] = useState([]);
  const [suggestQuery, setSuggestQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [exploreResult, setExploreResult] = useState(null);
  const [keywordHistory, setKeywordHistory] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [expandedRow, setExpandedRow] = useState(null);
  const [serpCache, setSerpCache] = useState({});
  const [serpLoading, setSerpLoading] = useState(null);

  const loadDiscovery = useCallback(async () => {
    setLoading(p => ({ ...p, discovery: true }));
    setError('');
    try {
      const res = await request('/api/admin/topics/discover');
      if (res?.success) {
        setNewsTopics(res.data.news || []);
        setTrendTopics(res.data.trends || []);
      }
    } catch (err) {
      setError('Discovery fetch failed: ' + err.message);
    } finally {
      setLoading(p => ({ ...p, discovery: false }));
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(p => ({ ...p, history: true }));
    try {
      const res = await request('/api/admin/keywords');
      if (res?.success) setKeywordHistory(res.data || []);
    } catch {} finally {
      setLoading(p => ({ ...p, history: false }));
    }
  }, []);

  useEffect(() => {
    loadDiscovery();
    loadHistory();
  }, [loadDiscovery, loadHistory]);

  async function handleSuggest() {
    if (!suggestQuery.trim()) return;
    setLoading(p => ({ ...p, suggest: true }));
    setExploreResult(null);
    setError('');
    setFilterType('all');
    setExpandedRow(null);
    setSerpCache({});
    try {
      const res = await request('/api/admin/topics/explore?q=' + encodeURIComponent(suggestQuery.trim()));
      if (res?.success) {
        setSuggestions(res.data.suggestions || []);
        setExploreResult(res.data.keywordResearch || null);
      }
    } catch (err) {
      setError('Search failed: ' + err.message);
    } finally {
      setLoading(p => ({ ...p, suggest: false }));
    }
  }

  function handleSuggestionClick(sug) {
    setSuggestQuery(sug);
    setTimeout(() => handleSuggest(), 100);
  }

  async function handleCreatePost(topic) {
    setLoading(p => ({ ...p, serp: topic }));
    try {
      const serpRes = await request('/api/admin/topics/serp-analyze', {
        method: 'POST',
        body: JSON.stringify({ keyword: topic }),
        headers: { 'Content-Type': 'application/json' },
      });
      navigate('/admin/posts/new', {
        state: {
          preselectedTitle: topic,
          serpData: serpRes?.success ? serpRes.data : null,
        },
      });
    } catch {
      navigate('/admin/posts/new', { state: { preselectedTitle: topic } });
    } finally {
      setLoading(p => ({ ...p, serp: false }));
    }
  }

  function handleViewHistoryItem(item) {
    setSuggestQuery(item.topic);
    const formattedResult = {
      all: item.keywords || [],
      filtered: (item.keywords || []).filter(k => k.kd <= 35 || k.keyword.toLowerCase().trim() === item.topic.toLowerCase().trim()),
      filteredKeywords: item.filteredKeywords || []
    };
    setExploreResult(formattedResult);
    setFilterType('all');
    setTab(1);
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast(`"${text}" copied to clipboard! 📋`, 'success');
  };

  async function toggleExpandRow(keyword) {
    if (expandedRow === keyword) {
      setExpandedRow(null);
      return;
    }
    setExpandedRow(keyword);
    if (serpCache[keyword]) return;

    setSerpLoading(keyword);
    try {
      const res = await request('/api/admin/topics/serp-analyze', {
        method: 'POST',
        body: JSON.stringify({ keyword }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (res?.success) {
        setSerpCache(prev => ({ ...prev, [keyword]: res.data }));
      }
    } catch (err) {
      addToast('SEO Outline failed to load: ' + err.message, 'error');
    } finally {
      setSerpLoading(null);
    }
  }

  function handleTabChange(_, v) {
    setTab(v);
    if (v === 2) loadHistory();
  }

  function catColor(cat) {
    return CATEGORY_COLORS[cat] || '#6b7280';
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto', width: '100%', height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <ExploreIcon sx={{ fontSize: 32, color: '#4F46E5' }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Keyword Research & Topic Discovery</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<TrendIcon />} label="Topic Discovery" iconPosition="start" />
        <Tab icon={<SearchIcon />} label="Search Suggestions" iconPosition="start" />
        <Tab icon={<ExploreIcon />} label="Keyword History" iconPosition="start" />
      </Tabs>

      {/* TAB 1: Topic Discovery */}
      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Trending Topics</Typography>
            <Button size="small" onClick={loadDiscovery} disabled={loading.discovery}>
              {loading.discovery ? <CircularProgress size={16} /> : 'Refresh'}
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <img src="https://www.google.com/favicon.ico" alt="" style={{ width: 16, height: 16 }} />
                  Google News — India
                  <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary', ml: 'auto' }}>
                    {newsTopics.length > 0 && newsTopics[0]?.pubDate
                      ? 'Latest: ' + new Date(newsTopics[0].pubDate).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
                      : ''}
                  </Typography>
                </Typography>
                {loading.discovery ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
                ) : newsTopics.length === 0 ? (
                  <Typography color="text.secondary">No news topics fetched</Typography>
                ) : (
                  newsTopics.slice(0, 12).map((item, i) => {
                    const cleanTitle = item.title.toLowerCase().trim();
                    const historyMatch = keywordHistory.find(h => {
                      const hTopic = h.topic.toLowerCase().trim();
                      return cleanTitle.includes(hTopic) || hTopic.includes(cleanTitle);
                    });
                    const matchKd = historyMatch?.keywords?.length
                      ? Math.round(historyMatch.keywords.reduce((s, k) => s + k.kd, 0) / historyMatch.keywords.length)
                      : null;
                    const kdColor = matchKd === null ? null : matchKd <= 22 ? '#059669' : matchKd <= 35 ? '#d97706' : '#dc2626';

                    return (
                      <Card key={i} sx={{ mb: 1, '&:hover': { bgcolor: '#f9fafb' } }}>
                        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                {item.title}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Chip label={item.category} size="small" sx={{
                                  color: '#fff', bgcolor: catColor(item.category), fontSize: '0.65rem', height: 20,
                                }} />
                                {matchKd !== null ? (
                                  <Chip
                                    label={`KD: ${matchKd}%`}
                                    size="small"
                                    onClick={() => handleSuggestionClick(item.title)}
                                    sx={{
                                      fontSize: '0.65rem',
                                      height: 20,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      bgcolor: kdColor + '15',
                                      color: kdColor,
                                      border: `1px solid ${kdColor}`
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    label="🔍 Check KD"
                                    size="small"
                                    onClick={() => handleSuggestionClick(item.title)}
                                    sx={{
                                      fontSize: '0.65rem',
                                      height: 20,
                                      cursor: 'pointer',
                                      bgcolor: '#f1f5f9',
                                      color: '#475569',
                                      '&:hover': { bgcolor: '#e2e8f0' }
                                    }}
                                  />
                                )}
                                {item.pubDate && (
                                  <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                                    {new Date(item.pubDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Research KD & Volume">
                                <IconButton size="small" onClick={() => handleSuggestionClick(item.title)} color="secondary">
                                  <SearchIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Create Post with AI">
                                <IconButton size="small" onClick={() => handleCreatePost(item.title)} color="primary">
                                  <ArrowIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendIcon sx={{ color: '#ea580c' }} />
                  Google Trends — India
                  <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary', ml: 'auto' }}>
                    {trendTopics.length > 0 && trendTopics[0]?.fetchedAt
                      ? 'Fetched: ' + new Date(trendTopics[0].fetchedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
                      : ''}
                  </Typography>
                </Typography>
                {loading.discovery ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
                ) : trendTopics.length === 0 ? (
                  <Typography color="text.secondary">No trending topics fetched</Typography>
                ) : (
                  trendTopics.slice(0, 12).map((item, i) => {
                    const cleanTitle = item.title.toLowerCase().trim();
                    const historyMatch = keywordHistory.find(h => {
                      const hTopic = h.topic.toLowerCase().trim();
                      return cleanTitle.includes(hTopic) || hTopic.includes(cleanTitle);
                    });
                    const matchKd = historyMatch?.keywords?.length
                      ? Math.round(historyMatch.keywords.reduce((s, k) => s + k.kd, 0) / historyMatch.keywords.length)
                      : null;
                    const kdColor = matchKd === null ? null : matchKd <= 22 ? '#059669' : matchKd <= 35 ? '#d97706' : '#dc2626';

                    return (
                      <Card key={i} sx={{ mb: 1, '&:hover': { bgcolor: '#f9fafb' } }}>
                        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {item.title}
                                </Typography>
                                {item.traffic && (
                                  <Chip label={`🔥 Vol: ${item.traffic}`} size="small" sx={{
                                    bgcolor: '#fef3c7', color: '#92400e', fontSize: '0.6rem', height: 18, fontWeight: 700
                                  }} />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                <Chip label={item.category} size="small" sx={{
                                  color: '#fff', bgcolor: catColor(item.category), fontSize: '0.65rem', height: 20,
                                }} />
                                {matchKd !== null ? (
                                  <Chip
                                    label={`KD: ${matchKd}%`}
                                    size="small"
                                    onClick={() => handleSuggestionClick(item.title)}
                                    sx={{
                                      fontSize: '0.65rem',
                                      height: 20,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      bgcolor: kdColor + '15',
                                      color: kdColor,
                                      border: `1px solid ${kdColor}`
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    label="🔍 Check KD"
                                    size="small"
                                    onClick={() => handleSuggestionClick(item.title)}
                                    sx={{
                                      fontSize: '0.65rem',
                                      height: 20,
                                      cursor: 'pointer',
                                      bgcolor: '#f1f5f9',
                                      color: '#475569',
                                      '&:hover': { bgcolor: '#e2e8f0' }
                                    }}
                                  />
                                )}
                                {item.fetchedAt && (
                                  <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                                    {new Date(item.fetchedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                  </Typography>
                                )}
                              </Box>
                              {item.related?.length > 0 && (
                                <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {item.related.slice(0, 3).map((r, j) => (
                                    <Chip key={j} label={r} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }}
                                      onClick={() => handleSuggestionClick(r)} />
                                  ))}
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Research KD & Volume">
                                <IconButton size="small" onClick={() => handleSuggestionClick(item.title)} color="secondary">
                                  <SearchIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Create Post with AI">
                                <IconButton size="small" onClick={() => handleCreatePost(item.title)} color="primary">
                                  <ArrowIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* TAB 2: Search Suggestions */}
      {tab === 1 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 2 }}>Google Search Suggestions</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <TextField
                label="Topic search karo..."
                value={suggestQuery}
                onChange={e => setSuggestQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSuggest()}
                sx={{ flex: 1, minWidth: 280 }}
                size="small"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                }}
              />
              <Button variant="contained" onClick={handleSuggest} disabled={loading.suggest}
                sx={{ height: 40, px: 3 }}>
                {loading.suggest ? <CircularProgress size={20} color="inherit" /> : 'Research'}
              </Button>
            </Box>
          </Paper>

          {suggestions.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.9rem' }}>
                Google Search Suggestions for "{suggestQuery}"
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {suggestions.map((s, i) => (
                  <Chip key={i} label={s} onClick={() => handleSuggestionClick(s)}
                    variant="outlined" color="primary" clickable />
                ))}
              </Box>
            </Paper>
          )}

          {exploreResult && (() => {
            const allKeywords = exploreResult.all || [];
            const filteredKeywords = exploreResult.filtered || [];
            const displayKeywords = filterType === 'easy' ? filteredKeywords : allKeywords;

            const focusKw = allKeywords.find(k => k.keyword.toLowerCase().trim() === suggestQuery.toLowerCase().trim()) || allKeywords[0] || null;
            const avgKd = allKeywords.length 
              ? Math.round(allKeywords.reduce((sum, kw) => sum + kw.kd, 0) / allKeywords.length) 
              : 0;
            const totalTraffic = allKeywords.reduce((sum, kw) => sum + (kw.searchVolume || 0), 0) || 0;
            const compColor = avgKd <= 22 ? '#059669' : avgKd <= 35 ? '#d97706' : '#dc2626';
            const compStatus = avgKd <= 22 ? 'Very Low 🟢' : avgKd <= 35 ? 'Low-Medium 🟡' : 'High 🔴';

            return (
              <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                {/* KPI DASHBOARD */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', 
                      borderRadius: 3, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      border: '1px solid #C7D2FE'
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1 }}>
                          🎯 Focus Keyword
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, color: '#1E1B4B', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {focusKw ? focusKw.keyword : suggestQuery}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Chip label={`Vol: ${focusKw?.searchVolume?.toLocaleString() || 'N/A'}`} size="small" sx={{ bgcolor: '#fff', fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                          <Chip label={focusKw ? focusKw.intent?.toUpperCase() : 'N/A'} size="small" sx={{ bgcolor: '#fff', fontWeight: 600, fontSize: '0.65rem', height: 20, color: '#7c3aed' }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', 
                      borderRadius: 3, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      border: '1px solid #A7F3D0'
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: 1 }}>
                          📊 Topic Difficulty
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#064E3B' }}>
                          {avgKd}%
                        </Typography>
                        <Box sx={{ width: '100%', bgcolor: '#e2e8f0', borderRadius: 1.5, height: 6, mt: 1, overflow: 'hidden' }}>
                          <Box sx={{ width: `${avgKd}%`, height: '100%', bgcolor: compColor, borderRadius: 1.5 }} />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: compColor, mt: 1, fontSize: '0.85rem' }}>
                          Competition: {compStatus}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)', 
                      borderRadius: 3, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      border: '1px solid #FBCFE8'
                    }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#DB2777', textTransform: 'uppercase', letterSpacing: 1 }}>
                          📈 Traffic Potential
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#831843' }}>
                          {totalTraffic.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9D174D', mt: 0.5, fontSize: '0.85rem' }}>
                          Searches/month across keywords
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 2 }}>
                  <Typography sx={{ fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IntentIcon sx={{ fontSize: 20, color: '#7c3aed' }} />
                    Keywords Analyzed ({displayKeywords.length})
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, bgcolor: '#f1f5f9', p: 0.5, borderRadius: 2.5 }}>
                    <Button
                      size="small"
                      onClick={() => setFilterType('all')}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        py: 0.5,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        bgcolor: filterType === 'all' ? 'white' : 'transparent',
                        color: filterType === 'all' ? '#1e293b' : '#64748b',
                        boxShadow: filterType === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        '&:hover': { bgcolor: filterType === 'all' ? 'white' : 'rgba(0,0,0,0.04)' }
                      }}
                    >
                      All ({allKeywords.length})
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setFilterType('easy')}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        py: 0.5,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        bgcolor: filterType === 'easy' ? 'white' : 'transparent',
                        color: filterType === 'easy' ? '#166534' : '#64748b',
                        boxShadow: filterType === 'easy' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        '&:hover': { bgcolor: filterType === 'easy' ? 'white' : 'rgba(0,0,0,0.04)' }
                      }}
                    >
                      Low KD (≤35%) ({filteredKeywords.length})
                    </Button>
                  </Box>

                  <Button size="small" variant="contained" onClick={() => handleCreatePost(suggestQuery)}
                    startIcon={loading.serp === suggestQuery ? <CircularProgress size={16} color="inherit" /> : <AiIcon />}
                    disabled={loading.serp === suggestQuery}
                    sx={{ borderRadius: 2, px: 2.5 }}>
                    {loading.serp === suggestQuery ? 'Analyzing...' : 'Create Post'}
                  </Button>
                </Box>

                {displayKeywords && displayKeywords.length > 0 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: 48, color: '#4f46e5', fontWeight: 700, fontSize: '0.7rem' }}>SERP</TableCell>
                          <TableCell>#</TableCell>
                          <TableCell>Keyword</TableCell>
                          <TableCell align="right">Volume</TableCell>
                          <TableCell align="right">KD%</TableCell>
                          <TableCell>SEO Opportunity</TableCell>
                          <TableCell>
                            <Tooltip title="Informational / Commercial / Transactional">
                              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                                <IntentIcon sx={{ fontSize: 14 }} /> Intent
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Trend</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {displayKeywords.slice(0, 30).map((kw, i) => {
                          const oppScore = Math.round((kw.searchVolume * (100 - kw.kd)) / 100);
                          const oppColor = oppScore > 2000 ? '#10b981' : oppScore > 500 ? '#f59e0b' : '#64748b';
                          const isFocus = kw.keyword.toLowerCase().trim() === suggestQuery.toLowerCase().trim();

                          return (
                            <Fragment key={i}>
                            <TableRow hover sx={{ bgcolor: isFocus ? '#f8fafc' : 'inherit' }}>
                              <TableCell>
                                <Tooltip title={expandedRow === kw.keyword ? "Collapse Details" : "Show Competitors & AI Outline Blueprint"}>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => toggleExpandRow(kw.keyword)}
                                    sx={{ 
                                      color: '#4f46e5', 
                                      bgcolor: '#f0f2ff',
                                      border: '1px solid #c7d2fe',
                                      width: 28,
                                      height: 28,
                                      '&:hover': { bgcolor: '#e0e7ff' } 
                                    }}
                                  >
                                    {expandedRow === kw.keyword ? <CollapseIcon sx={{ fontSize: 18 }} /> : <ExpandIcon sx={{ fontSize: 18 }} />}
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell sx={{ fontWeight: isFocus ? 700 : 500 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {kw.keyword}
                                  {isFocus && (
                                    <Chip label="★ Focus" size="small" sx={{
                                      ml: 0.5, height: 18, fontSize: '0.6rem', fontWeight: 700,
                                      bgcolor: '#dc2626', color: '#fff',
                                    }} />
                                  )}
                                  <Tooltip title="Copy keyword">
                                    <IconButton size="small" onClick={() => copyToClipboard(kw.keyword)} sx={{ ml: 0.5, opacity: 0.5, '&:hover': { opacity: 1 } }}>
                                      <CopyIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: '#334155' }}>
                                {kw.searchVolume?.toLocaleString('en-IN') || '—'}
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 100 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <Typography sx={{
                                    color: kw.kd <= 22 ? '#059669' : kw.kd <= 35 ? '#d97706' : '#dc2626',
                                    fontWeight: 700,
                                    fontSize: '0.85rem'
                                  }}>
                                    {kw.kd}%
                                  </Typography>
                                  <Box sx={{ width: 60, bgcolor: '#e2e8f0', borderRadius: 1, height: 4, mt: 0.5, overflow: 'hidden' }}>
                                    <Box sx={{ width: `${kw.kd}%`, height: '100%', bgcolor: kw.kd <= 22 ? '#10b981' : kw.kd <= 35 ? '#f59e0b' : '#ef4444' }} />
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={oppScore.toLocaleString('en-IN')}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    bgcolor: oppScore > 2000 ? '#ecfdf5' : oppScore > 500 ? '#fffbeb' : '#f8fafc',
                                    color: oppColor,
                                    border: `1.5px solid ${oppColor}`,
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                {kw.intent ? (
                                  <Chip label={kw.intent.charAt(0).toUpperCase() + kw.intent.slice(1)}
                                    size="small"
                                    sx={{
                                      fontSize: '0.6rem', height: 18, fontWeight: 600,
                                      bgcolor: INTENT_COLORS[kw.intent]?.bg || '#f3f4f6',
                                      color: INTENT_COLORS[kw.intent]?.color || '#374151',
                                    }} />
                                ) : '—'}
                              </TableCell>
                              <TableCell>
                                <Chip label={kw.type} size="small" sx={{
                                  fontSize: '0.6rem', height: 18, fontWeight: 600,
                                  bgcolor: kw.type === 'short-tail' ? '#fee2e2' : kw.type === 'long-tail' ? '#dbeafe' : kw.type === 'mid-tail' ? '#ffedd5' : kw.type === 'lsi' ? '#f3e8ff' : '#d1fae5',
                                  color: kw.type === 'short-tail' ? '#dc2626' : kw.type === 'long-tail' ? '#2563eb' : kw.type === 'mid-tail' ? '#ea580c' : kw.type === 'lsi' ? '#7c3aed' : '#059669',
                                }} />
                              </TableCell>
                              <TableCell>
                                <Chip label={kw.trend || '—'} size="small" sx={{
                                  fontSize: '0.6rem', height: 18,
                                  bgcolor: kw.trend === 'rising' ? '#dcfce7' : kw.trend === 'stable' ? '#fef3c7' : '#f3f4f6',
                                  color: kw.trend === 'rising' ? '#166534' : kw.trend === 'stable' ? '#92400e' : '#6b7280',
                                }} />
                              </TableCell>
                            </TableRow>
                            {expandedRow === kw.keyword && (
                              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell colSpan={9} sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
                                  {serpLoading === kw.keyword ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2, px: 3 }}>
                                      <CircularProgress size={16} />
                                      <Typography variant="body2" color="text.secondary">Generating SEO outline & blueprint...</Typography>
                                    </Box>
                                  ) : serpCache[kw.keyword] ? (() => {
                                    const data = serpCache[kw.keyword];
                                    return (
                                      <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#ffffff' }}>
                                        <Grid container spacing={3}>
                                          {/* Left Panel: Stats */}
                                          <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                              📏 Target Article Specs
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#f8fafc', p: 1, borderRadius: 1.5 }}>
                                                <Typography variant="caption" color="text.secondary">Target Word Count:</Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>{data.totalRecommendedWords} words</Typography>
                                              </Box>
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#f8fafc', p: 1, borderRadius: 1.5 }}>
                                                <Typography variant="caption" color="text.secondary">Featured Snippet:</Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669', textTransform: 'capitalize' }}>{data.serpFeatures?.featuredSnippet || 'possible'}</Typography>
                                              </Box>
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#f8fafc', p: 1, borderRadius: 1.5 }}>
                                                <Typography variant="caption" color="text.secondary">People Also Ask:</Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#7c3aed' }}>{data.serpFeatures?.peopleAlsoAsk || 3} questions</Typography>
                                              </Box>
                                            </Box>

                                            {data.competitors && data.competitors.length > 0 && (
                                              <>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                  🔥 Top Competitors Scraped
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                  {data.competitors.map((comp, idx) => (
                                                    <Box key={idx} sx={{ p: 1, border: '1px solid #e2e8f0', borderRadius: 1.5, bgcolor: '#f8fafc' }}>
                                                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                        <a href={comp.link} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
                                                          {idx + 1}. {comp.title}
                                                        </a>
                                                      </Typography>
                                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', mt: 0.25 }}>
                                                        Words: <strong>{comp.wordCount}</strong> | Headings: <strong>{comp.headings?.length || 0}</strong>
                                                      </Typography>
                                                    </Box>
                                                  ))}
                                                </Box>
                                              </>
                                            )}
                                          </Grid>

                                          {/* Middle Panel: Outline */}
                                          <Grid item xs={12} md={5}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                📝 Suggested Headings Outline
                                              </Typography>
                                              <Button size="small" variant="outlined" sx={{ py: 0.2, fontSize: '0.65rem' }}
                                                onClick={() => {
                                                  const outlineText = `Suggested Heading Structure for: "${kw.keyword}"\n\n` + data.suggestedHeadings.map((h, i) => `${i+1}. ${h}`).join('\n');
                                                  navigator.clipboard.writeText(outlineText);
                                                  addToast('SEO Outline copied! 📋', 'success');
                                                }}
                                              >
                                                Copy Outline
                                              </Button>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 150, overflowY: 'auto', border: '1px solid #f1f5f9', p: 1, borderRadius: 1.5 }}>
                                              {data.suggestedHeadings?.map((h, idx) => (
                                                <Typography key={idx} variant="caption" sx={{ display: 'block', color: '#334155', borderBottom: '1px solid #f8fafc', pb: 0.5 }}>
                                                  <span style={{ fontWeight: 700, color: '#64748b' }}>H{idx === 0 ? 1 : 2}:</span> {h}
                                                </Typography>
                                              ))}
                                            </Box>
                                          </Grid>

                                          {/* Right Panel: LSI keywords */}
                                          <Grid item xs={12} md={3}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                                              🏷️ Sprinkle LSI Keywords
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxHeight: 140, overflowY: 'auto' }}>
                                              {data.recommendedLSI?.map((lsi, idx) => (
                                                <Chip
                                                  key={idx}
                                                  label={lsi}
                                                  size="small"
                                                  onClick={() => copyToClipboard(lsi)}
                                                  sx={{
                                                    fontSize: '0.65rem',
                                                    height: 20,
                                                    bgcolor: '#f5f3ff',
                                                    color: '#6d28d9',
                                                    '&:hover': { bgcolor: '#ddd6fe' }
                                                  }}
                                                />
                                              ))}
                                            </Box>
                                          </Grid>
                                        </Grid>
                                      </Paper>
                                    );
                                  })() : null}
                                </TableCell>
                              </TableRow>
                            )}
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            );
          })()}
        </Box>
      )}

      {/* TAB 3: Keyword History */}
      {tab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography sx={{ fontWeight: 600 }}>Saved Keyword Research ({keywordHistory.length} topics)</Typography>
            {keywordHistory.length > 0 && (
              <Button size="small" color="error" variant="outlined"
                onClick={async () => {
                  if (!confirm('Pur kare? Saara keyword history delete ho jayega!')) return;
                  setLoading(p => ({ ...p, history: true }));
                  const res = await request('/api/admin/keywords/clear-all', { method: 'DELETE' });
                  if (res?.success) { setKeywordHistory([]); addToast(res.message || 'Clear ho gaya!', 'success'); }
                  else setKeywordHistory([]);
                  setLoading(p => ({ ...p, history: false }));
                }}
              >
                Clear All
              </Button>
            )}
          </Box>
          {loading.history ? (
            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
          ) : keywordHistory.length === 0 ? (
            <Typography color="text.secondary">No keyword research data yet. Use Search Suggestions tab first.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Topic</TableCell>
                    <TableCell align="center">Keywords Found</TableCell>
                    <TableCell align="center">Filtered (KD≤35%)</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {keywordHistory.map((item, i) => (
                    <TableRow key={item._id || i} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{item.topic}</TableCell>
                      <TableCell align="center">{item.keywords?.length || 0}</TableCell>
                      <TableCell align="center">
                        <Chip label={item.filteredKeywords?.length || 0} size="small" color="success" />
                      </TableCell>
                      <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button size="small" onClick={() => handleViewHistoryItem(item)} startIcon={<ViewIcon />}>
                            View
                          </Button>
                          <Button size="small" onClick={() => handleCreatePost(item.topic)} startIcon={<OpenIcon />}>
                            Create
                          </Button>
                          <Button size="small" color="error"
                            onClick={async () => {
                              if (!confirm(`"${item.topic}" delete karein?`)) return;
                              const res = await request(`/api/admin/keywords/${item._id}`, { method: 'DELETE' });
                              if (res?.success) {
                                setKeywordHistory(prev => prev.filter(k => k._id !== item._id));
                                addToast('Delete ho gaya!', 'success');
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Box>
  );
}
