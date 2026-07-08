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
  const [tgLoadingId, setTgLoadingId] = useState(null);

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
    setTgLoadingId(postId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await request(`/api/admin/posts/${postId}/telegram-share`, { method: 'POST' });
      if (res.success) {
        addToast(res.message || 'Successfully shared post to Telegram!', 'success');
        setSuccessMsg(res.message || 'Successfully shared post to Telegram!');
      } else {
        addToast(res.message || 'Telegram sharing failed.', 'error');
        setError(res.message || 'Telegram sharing failed.');
      }
    } catch (err) {
      addToast(err.message || 'Failed to share post to Telegram', 'error');
      setError(err.message || 'Failed to share post to Telegram');
    } finally {
      setTgLoadingId(null);
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
                            <Button
                              size="small"
                              disabled={tgLoadingId === post._id}
                              onClick={() => handleTelegramShare(post._id)}
                              sx={{
                                minWidth: 0, px: 1.2, py: 0.4, fontSize: '0.75rem', fontWeight: 600,
                                color: '#2563eb', borderRadius: 1.5,
                                '&:hover': { bgcolor: '#EFF6FF' }
                              }}
                            >
                              {tgLoadingId === post._id ? (
                                <CircularProgress size={12} color="inherit" sx={{ mr: 0.3 }} />
                              ) : (
                                <Forum sx={{ fontSize: '0.9rem', mr: 0.3 }} />
                              )}
                              Share
                            </Button>
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
