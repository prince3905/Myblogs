import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Grid, Paper, Chip, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Alert, Card, CardContent, IconButton, InputAdornment, Tooltip,
} from '@mui/material';
import {
  TravelExplore as ExploreIcon, TrendingUp as TrendIcon, Search as SearchIcon,
  AutoAwesome as AiIcon, ArrowForward as ArrowIcon, OpenInNew as OpenIcon,
  Psychology as IntentIcon, Analytics as SerpIcon,
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
                  newsTopics.slice(0, 12).map((item, i) => (
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
                              {item.pubDate && (
                                <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                                  {new Date(item.pubDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <IconButton size="small" onClick={() => handleCreatePost(item.title)} color="primary">
                            <ArrowIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
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
                  trendTopics.slice(0, 12).map((item, i) => (
                    <Card key={i} sx={{ mb: 1, '&:hover': { bgcolor: '#f9fafb' } }}>
                      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.title}
                              </Typography>
                              {item.traffic && (
                                <Chip label={item.traffic} size="small" sx={{
                                  bgcolor: '#fef3c7', color: '#92400e', fontSize: '0.6rem', height: 18,
                                }} />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                              <Chip label={item.category} size="small" sx={{
                                color: '#fff', bgcolor: catColor(item.category), fontSize: '0.65rem', height: 20,
                              }} />
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
                          <IconButton size="small" onClick={() => handleCreatePost(item.title)} color="primary">
                            <ArrowIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
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

          {exploreResult && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontWeight: 600 }}>
                  <IntentIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle', color: '#7c3aed' }} />
                  Keyword Research: "{exploreResult.filteredKeywords?.length || 0} easy keywords found"
                </Typography>
                <Button size="small" variant="contained" onClick={() => handleCreatePost(suggestQuery)}
                  startIcon={loading.serp === suggestQuery ? <CircularProgress size={16} color="inherit" /> : <AiIcon />}
                  disabled={loading.serp === suggestQuery}>
                  {loading.serp === suggestQuery ? 'Analyzing...' : 'Create Post'}
                </Button>
              </Box>

              {exploreResult.filtered && exploreResult.filtered.length > 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Keyword</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>
                          <Tooltip title="Informational / Commercial / Transactional">
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                              <IntentIcon sx={{ fontSize: 14 }} /> Intent
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">Volume</TableCell>
                        <TableCell align="right">KD%</TableCell>
                        <TableCell>Trend</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {exploreResult.filtered.slice(0, 15).map((kw, i) => (
                        <TableRow key={i} hover>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>
                            {kw.keyword}
                            {i === 0 && kw.type === 'short-tail' && (
                              <Chip label="★ Focus" size="small" sx={{
                                ml: 0.5, height: 16, fontSize: '0.55rem', fontWeight: 700,
                                bgcolor: '#dc2626', color: '#fff',
                              }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip label={kw.type} size="small" sx={{
                              fontSize: '0.6rem', height: 18, fontWeight: 600,
                              bgcolor: kw.type === 'short-tail' ? '#fee2e2' : kw.type === 'long-tail' ? '#dbeafe' : kw.type === 'mid-tail' ? '#ffedd5' : kw.type === 'lsi' ? '#f3e8ff' : '#d1fae5',
                              color: kw.type === 'short-tail' ? '#dc2626' : kw.type === 'long-tail' ? '#2563eb' : kw.type === 'mid-tail' ? '#ea580c' : kw.type === 'lsi' ? '#7c3aed' : '#059669',
                            }} />
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
                          <TableCell align="right">{kw.searchVolume?.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            <Typography sx={{
                              color: kw.kd <= 20 ? '#059669' : kw.kd <= 30 ? '#d97706' : '#dc2626',
                              fontWeight: 600,
                            }}>
                              {kw.kd}%
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={kw.trend || '—'} size="small" sx={{
                              fontSize: '0.6rem', height: 18,
                              bgcolor: kw.trend === 'rising' ? '#dcfce7' : kw.trend === 'stable' ? '#fef3c7' : '#f3f4f6',
                              color: kw.trend === 'rising' ? '#166534' : kw.trend === 'stable' ? '#92400e' : '#6b7280',
                            }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          )}
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
