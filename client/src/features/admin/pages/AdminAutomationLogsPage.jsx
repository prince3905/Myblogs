import { useEffect, useState } from 'react';
import {
  Typography, Box, Paper, TextField, Alert, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel
} from '@mui/material';
import { Search, Refresh, Delete, Info, CheckCircle, Error, Warning, Code } from '@mui/icons-material';
import { request } from '../../../shared/lib/api';

export default function AdminAutomationLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [service, setService] = useState('ALL');
  const [level, setLevel] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [selectedMeta, setSelectedMeta] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [page, search, service, level]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadLogs(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, page, search, service, level]);

  const loadLogs = (silent = false) => {
    if (!silent) setLoading(true);
    request(`/api/admin/automation-logs?page=${page}&service=${service}&level=${level}&search=${encodeURIComponent(search)}`)
      .then(res => {
        if (res.success) {
          setLogs(res.data || []);
          setTotalPages(res.pagination?.pages || 1);
          setTotalLogs(res.pagination?.total || 0);
        }
      })
      .catch(err => {
        setMsg('Failed to fetch automation logs: ' + err.message);
        setMsgType('error');
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  const handleClearLogs = () => {
    if (!window.confirm('Are you sure you want to clear all automation logs?')) return;
    request('/api/admin/automation-logs/clear', { method: 'DELETE' })
      .then(res => {
        if (res.success) {
          setMsg('Automation logs cleared successfully!');
          setMsgType('success');
          loadLogs();
        }
      })
      .catch(err => {
        setMsg('Clear failed: ' + err.message);
        setMsgType('error');
      });
  };

  const getLevelChip = (lvl) => {
    switch (lvl) {
      case 'SUCCESS':
        return <Chip icon={<CheckCircle sx={{ fontSize: '14px !important' }} />} label="SUCCESS" size="small" sx={{ bgcolor: '#DEF7EC', color: '#03543F', fontWeight: 800 }} />;
      case 'ERROR':
        return <Chip icon={<Error sx={{ fontSize: '14px !important' }} />} label="ERROR" size="small" sx={{ bgcolor: '#FDE8E8', color: '#9B1C1C', fontWeight: 800 }} />;
      case 'WARNING':
        return <Chip icon={<Warning sx={{ fontSize: '14px !important' }} />} label="WARNING" size="small" sx={{ bgcolor: '#FEF08A', color: '#713F12', fontWeight: 800 }} />;
      default:
        return <Chip icon={<Info sx={{ fontSize: '14px !important' }} />} label="INFO" size="small" sx={{ bgcolor: '#E1EFFE', color: '#1E429F', fontWeight: 800 }} />;
    }
  };

  const getServiceChip = (srv) => {
    const serviceColors = {
      SCRAPER: { bg: '#E0E7FF', text: '#3730A3' },
      TELEGRAM: { bg: '#E0F2FE', text: '#0369A1' },
      WHATSAPP: { bg: '#DCFCE7', text: '#15803D' },
      SEO_INDEXING: { bg: '#FCE7F3', text: '#9D174D' },
      SYSTEM_CRON: { bg: '#FEF3C7', text: '#92400E' },
      WEB_STORY: { bg: '#F3E8FF', text: '#6B21A8' }
    };
    const style = serviceColors[srv] || { bg: '#F3F4F6', text: '#374151' };
    return <Chip label={srv} size="small" sx={{ bgcolor: style.bg, color: style.text, fontWeight: 700, borderRadius: '6px' }} />;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827' }}>
            🤖 Automation System Logs
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
            Real-time execution telemetry for Scrapers, Telegram, WhatsApp, SEO Indexer & System Crons ({totalLogs} total events logged)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)} 
                color="primary" 
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600, color: autoRefresh ? '#10B981' : '#6B7280' }}>
                {autoRefresh ? 'Live Stream (8s)' : 'Live Off'}
              </Typography>
            }
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => loadLogs()}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleClearLogs}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
          >
            Clear Logs
          </Button>
        </Box>
      </Box>

      {msg && (
        <Alert severity={msgType} sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setMsg('')}>
          {msg}
        </Alert>
      )}

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid #ECECEC', borderRadius: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search action or message..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          sx={{ flex: 1, minWidth: 220, '& .MuiInputBase-root': { borderRadius: 2.5 } }}
          InputProps={{
            startAdornment: <Search sx={{ color: '#9CA3AF', mr: 1 }} />
          }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Filter Service</InputLabel>
          <Select value={service} label="Filter Service" onChange={e => { setService(e.target.value); setPage(1); }} sx={{ borderRadius: 2.5 }}>
            <MenuItem value="ALL">All Services</MenuItem>
            <MenuItem value="SCRAPER">Scraper Daemon</MenuItem>
            <MenuItem value="TELEGRAM">Telegram Bot</MenuItem>
            <MenuItem value="WHATSAPP">WhatsApp Broadcast</MenuItem>
            <MenuItem value="SEO_INDEXING">SEO & Indexing</MenuItem>
            <MenuItem value="SYSTEM_CRON">System Crons</MenuItem>
            <MenuItem value="WEB_STORY">Web Stories</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Filter Level</InputLabel>
          <Select value={level} label="Filter Level" onChange={e => { setLevel(e.target.value); setPage(1); }} sx={{ borderRadius: 2.5 }}>
            <MenuItem value="ALL">All Levels</MenuItem>
            <MenuItem value="SUCCESS">SUCCESS</MenuItem>
            <MenuItem value="INFO">INFO</MenuItem>
            <MenuItem value="WARNING">WARNING</MenuItem>
            <MenuItem value="ERROR">ERROR</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Logs Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ECECEC', borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Service</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Level</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Message / Details</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#4B5563' }} align="right">Payload</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5, color: '#9CA3AF' }}>Loading automation telemetry...</TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5, color: '#9CA3AF', fontStyle: 'italic' }}>
                  No automation logs found. Background tasks will stream logs here automatically.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log._id} hover>
                  <TableCell sx={{ color: '#6B7280', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{getServiceChip(log.service)}</TableCell>
                  <TableCell>{getLevelChip(log.level)}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#111827' }}>{log.action}</TableCell>
                  <TableCell sx={{ color: '#374151', fontSize: '0.88rem', maxWidth: 380 }}>{log.message}</TableCell>
                  <TableCell align="right">
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <IconButton size="small" onClick={() => setSelectedMeta(log.metadata)} sx={{ color: '#2563EB' }}>
                        <Code fontSize="small" />
                      </IconButton>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#D1D5DB' }}>None</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          Page {page} of {totalPages} ({totalLogs} total entries)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 2 }}
          >
            Previous
          </Button>
          <Button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 2 }}
          >
            Next
          </Button>
        </Box>
      </Box>

      {/* Payload Inspection Modal */}
      <Dialog open={Boolean(selectedMeta)} onClose={() => setSelectedMeta(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Payload Metadata Inspection</DialogTitle>
        <DialogContent dividers>
          <Box 
            component="pre" 
            sx={{ 
              bgcolor: '#0F172A', 
              color: '#38BDF8', 
              p: 2.5, 
              borderRadius: 2.5, 
              fontSize: '0.82rem', 
              overflowX: 'auto',
              fontFamily: 'monospace'
            }}
          >
            {JSON.stringify(selectedMeta, null, 2)}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedMeta(null)} sx={{ fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
