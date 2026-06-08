import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Box, Alert, CircularProgress,
  IconButton, Tooltip, Tab, Tabs, Link as MuiLink
} from '@mui/material';
import {
  Sync as SyncIcon, AutoAwesome as WriteIcon,
  Launch as LaunchIcon, NotificationsActive as NotificationIcon,
  CheckCircle as CheckCircleIcon, HourglassEmpty as HourglassIcon
} from '@mui/icons-material';
import { request } from '../../../shared/lib/api';
import { useToast } from '../../../components/Toast';

export default function LiveAlertsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [draftingId, setDraftingId] = useState(null);
  const [error, setError] = useState('');
  const [filterTab, setFilterTab] = useState(0); // 0 = All, 1 = Active, 2 = Drafted

  function loadAlerts() {
    setLoading(true);
    setError('');
    let statusQuery = '';
    if (filterTab === 1) statusQuery = '?status=active';
    if (filterTab === 2) statusQuery = '?status=drafted';

    request(`/api/admin/live-alerts${statusQuery}`)
      .then(res => {
        if (res.success) {
          setAlerts(res.data || []);
        } else {
          setError(res.message || 'Failed to fetch alerts');
        }
      })
      .catch(err => {
        setError(err.message || 'Failed to connect to server');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadAlerts();
  }, [filterTab]);

  async function handleSync() {
    setSyncing(true);
    addToast('Scraping fresh RSS feeds in background...', 'info');
    try {
      const res = await request('/api/admin/live-alerts/trigger', { method: 'POST' });
      if (res.success) {
        addToast(res.message || 'Alerts synced successfully!', 'success');
        loadAlerts();
      } else {
        addToast(res.message || 'Sync failed', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Sync connection failed', 'error');
    } finally {
      setSyncing(false);
    }
  }

  async function handleDraftPost(alert) {
    setDraftingId(alert._id);
    addToast(`Gemini is writing a 1,200-word post for "${alert.title}"...`, 'info');
    try {
      const res = await request(`/api/admin/live-alerts/${alert._id}/draft`, { method: 'POST' });
      if (res.success && res.postId) {
        addToast('AI Draft Created Successfully! Redirecting...', 'success');
        navigate(`/admin/posts/${res.postId}/edit`);
      } else {
        addToast(res.message || 'AI Generation failed', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to draft post', 'error');
    } finally {
      setDraftingId(null);
    }
  }

  return (
    <>
      {/* Header bar */}
      <Box sx={{
        px: { xs: 2, md: 4 }, py: 2.5, bgcolor: 'white',
        borderBottom: '1px solid', borderColor: '#ECECEC',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>Live Student Alerts</Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.3 }}>
              Monitor and auto-draft blog posts from live Sarkari job and exam notifications.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          onClick={handleSync}
          disabled={syncing || loading}
          startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
          sx={{ fontWeight: 600, borderRadius: 2, px: { xs: 2, md: 3 }, bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
        >
          {syncing ? 'Syncing...' : 'Sync Feeds'}
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white', px: { xs: 2, md: 4 } }}>
        <Tabs value={filterTab} onChange={(e, v) => setFilterTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' } }}>
          <Tab label="All Alerts" />
          <Tab label="Active Only" />
          <Tab label="Drafted Only" />
        </Tabs>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 4 } }}>
        {error ? <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #ECECEC', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { color: '#6B7280', fontWeight: 600, fontSize: '0.75rem', py: 1.5, px: 3, borderBottom: '1px solid #ECECEC' } }}>
                  <TableCell sx={{ width: '45%' }}>Job / Exam Vacancy Title</TableCell>
                  <TableCell sx={{ width: '10%' }}>Authority / Board</TableCell>
                  <TableCell sx={{ width: '10%' }}>Source</TableCell>
                  <TableCell sx={{ width: '10%' }}>Last Date</TableCell>
                  <TableCell sx={{ width: '10%' }}>Status</TableCell>
                  <TableCell sx={{ width: '15%' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={40} sx={{ color: '#4F46E5', mb: 1 }} />
                      <Typography sx={{ color: '#6B7280', fontSize: '0.9rem' }}>Fetching live notifications...</Typography>
                    </TableCell>
                  </TableRow>
                ) : alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <NotificationIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 1.5 }} />
                      <Typography sx={{ color: '#6B7280', fontWeight: 600 }}>No alerts found</Typography>
                      <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 0.5 }}>
                        Click the 'Sync Feeds' button above to fetch recent alerts from Sarkari RSS feeds.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((alert, i) => (
                    <TableRow key={alert._id} sx={{
                      '& td': { py: 1.8, px: 3, borderBottom: i < alerts.length - 1 ? '1px solid #ECECEC' : 'none' },
                      '&:hover': { bgcolor: '#F9FAFB' },
                      transition: 'background 0.15s',
                    }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                            {alert.title}
                          </Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                            Sourced on {new Date(alert.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={alert.boardName || 'Govt Board'}
                          size="small"
                          sx={{
                            fontWeight: 700, fontSize: '0.65rem', height: 22,
                            bgcolor: '#EEF2FF', color: '#4F46E5', borderRadius: 1.5
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8rem', color: '#6B7280' }}>
                          {alert.source}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: alert.lastDate?.includes('-') ? '#DC2626' : '#6B7280' }}>
                          {alert.lastDate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={alert.status}
                          size="small"
                          icon={alert.status === 'drafted' ? <CheckCircleIcon style={{ fontSize: 14 }} /> : <HourglassIcon style={{ fontSize: 14 }} />}
                          sx={{
                            fontWeight: 600, fontSize: '0.7rem', height: 24, borderRadius: 1.5,
                            bgcolor: alert.status === 'drafted' ? '#D1FAE5' : '#FEF3C7',
                            color: alert.status === 'drafted' ? '#065F46' : '#92400E',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Tooltip title="View Official Source URL">
                            <IconButton
                              component={MuiLink}
                              href={alert.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              sx={{ color: '#6B7280', '&:hover': { color: '#111827', bgcolor: '#F3F4F6' } }}
                            >
                              <LaunchIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleDraftPost(alert)}
                            disabled={draftingId !== null || alert.status === 'drafted'}
                            startIcon={draftingId === alert._id ? <CircularProgress size={12} color="inherit" /> : <WriteIcon />}
                            sx={{
                              borderRadius: 1.5,
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              px: 1.5,
                              color: alert.status === 'drafted' ? '#9CA3AF' : '#4F46E5',
                              borderColor: alert.status === 'drafted' ? '#E5E7EB' : '#4F46E5',
                              '&:hover': {
                                bgcolor: '#EEF2FF',
                                borderColor: '#4F46E5'
                              }
                            }}
                          >
                            {draftingId === alert._id ? 'Drafting...' : alert.status === 'drafted' ? 'Drafted' : 'Draft Blog Post'}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </>
  );
}
