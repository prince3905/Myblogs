import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Switch, FormControlLabel, CircularProgress, Alert, TextField, Button } from '@mui/material';
import { Settings, OfflineBolt, Schedule, Send, Link, ReportProblem, PictureAsPdf as PictureAsPdfIcon } from '@mui/icons-material';
import { useToast } from '../../../components/Toast';
import { request } from '../../../shared/lib/api';

const settingOptions = [
  {
    key: 'disableAutopilot',
    label: 'Autopilot Scraper',
    description: 'Automatically crawl job boards (SarkariResult) and generate draft job alerts in the background.',
    icon: <OfflineBolt sx={{ fontSize: 32, color: '#3b82f6' }} />
  },
  {
    key: 'disableQueuePublisher',
    label: 'Smart Queue Publisher',
    description: 'Automatically publish queued draft articles twice daily at peak traffic hours (9:00 AM and 6:00 PM IST).',
    icon: <Schedule sx={{ fontSize: 32, color: '#10b981' }} />
  },
  {
    key: 'disableTelegramShare',
    label: 'Telegram Auto-Share',
    description: 'Automatically share newly published job notifications to your official Telegram channel.',
    icon: <Send sx={{ fontSize: 32, color: '#06b6d4' }} />
  },
  {
    key: 'disableWhatsappNotification',
    label: 'WhatsApp Draft Alerts',
    description: 'Automatically receive instant WhatsApp notifications when a new job alert is scraped and drafted.',
    icon: <span style={{ fontSize: 28 }}>💬</span>
  },
  {
    key: 'disableTwoWayLinking',
    label: 'Two-Way Internal Linking',
    description: 'Link older relevant posts to new ones automatically upon publication to drive indexing speed.',
    icon: <Link sx={{ fontSize: 32, color: '#a855f7' }} />
  },
  {
    key: 'disableExpiryDaemon',
    label: 'Vacancy Expiry Warnings',
    description: 'Add warning alerts and prepend [आवेदन समाप्त] to job posts automatically when deadlines pass.',
    icon: <ReportProblem sx={{ fontSize: 32, color: '#f59e0b' }} />
  },
  {
    key: 'disablePdfDownload',
    label: 'Job PDF Downloads',
    description: 'Show or hide the "Download Job Summary PDF" button on public vacancy alert post pages.',
    icon: <PictureAsPdfIcon sx={{ fontSize: 32, color: '#ef4444' }} />
  }
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  // WhatsApp States
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappApiKey, setWhatsappApiKey] = useState('');
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);

  useEffect(() => {
    request('/api/admin/settings')
      .then(data => {
        setSettings(data.settings || {});
        setWhatsappPhone(data.settings?.whatsappPhone || '');
        setWhatsappApiKey(data.settings?.whatsappApiKey || '');
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load system configurations.');
        setLoading(false);
      });
  }, []);

  const isTrueSetting = (val) => val === true || val === 'true';

  const handleToggle = async (key) => {
    setUpdatingKey(key);
    setError('');
    
    // Toggle active state: active state is !disableSetting
    const currentDisabled = settings[key] === undefined ? true : isTrueSetting(settings[key]);
    const newDisabled = !currentDisabled;

    try {
      const res = await request('/api/admin/settings', {
        method: 'PUT',
        body: {
          key,
          value: newDisabled
        }
      });

      if (res.success) {
        setSettings(prev => ({ ...prev, [key]: newDisabled }));
        addToast(res.message || 'Setting updated successfully!', 'success');
      } else {
        addToast(res.message || 'Failed to update setting.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Network error occurred.', 'error');
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleSaveWhatsappSettings = async () => {
    setIsSavingWhatsapp(true);
    try {
      const pRes = await request('/api/admin/settings', {
        method: 'PUT',
        body: { key: 'whatsappPhone', value: whatsappPhone.trim() }
      });
      const kRes = await request('/api/admin/settings', {
        method: 'PUT',
        body: { key: 'whatsappApiKey', value: whatsappApiKey.trim() }
      });

      if (pRes.success && kRes.success) {
        setSettings(prev => ({ ...prev, whatsappPhone: whatsappPhone.trim(), whatsappApiKey: whatsappApiKey.trim() }));
        addToast('WhatsApp configurations saved successfully!', 'success');
      } else {
        addToast('Failed to save some WhatsApp settings.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error occurred while saving configurations.', 'error');
    } finally {
      setIsSavingWhatsapp(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3, maxWidth: 1000, mx: 'auto' }}>
      {/* Title block */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Settings sx={{ fontSize: 36, color: '#1f2937' }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
            System Configurations
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Manage background services, scraper triggers, queue schedulers, and alerts.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {settingOptions.map((option) => {
          const isEnabled = settings[option.key] === undefined ? false : !isTrueSetting(settings[option.key]);
          const isUpdating = updatingKey === option.key;

          return (
            <Grid item xs={12} key={option.key}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 3,
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      bgcolor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {option.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
                      {option.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.5 }}>
                      {option.description}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {isUpdating ? (
                    <CircularProgress size={24} sx={{ mx: 2 }} />
                  ) : (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isEnabled}
                          onChange={() => handleToggle(option.key)}
                          color="primary"
                        />
                      }
                      label={isEnabled ? 'Active' : 'Paused'}
                      labelPlacement="start"
                      sx={{
                        m: 0,
                        '& .MuiTypography-root': {
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: isEnabled ? '#10b981' : '#6b7280',
                          mr: 1
                        }
                      }}
                    />
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* WhatsApp Notifications Settings section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mt: 4,
          borderRadius: 3,
          border: '1px solid #e5e7eb',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              bgcolor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 28 }}>💬</span>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
              WhatsApp Draft Alerts (CallMeBot)
            </Typography>
            <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.5 }}>
              Automatically receive instant WhatsApp notifications whenever a new Sarkari Job alert is scraped and drafted by the background autopilot.
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="WhatsApp Phone Number"
              placeholder="e.g. 919999999999 (with country code, no + or spaces)"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="CallMeBot API Key"
              placeholder="Enter your CallMeBot WhatsApp API Key"
              value={whatsappApiKey}
              onChange={(e) => setWhatsappApiKey(e.target.value)}
              variant="outlined"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="caption" sx={{ color: '#6b7280', maxWidth: { xs: '100%', md: '60%' }, display: 'block', lineHeight: 1.6 }}>
            💡 <strong>How to activate CallMeBot:</strong> Send a WhatsApp message with the text <code>I allow callmebot to send me messages</code> to <strong>+34 621 34 22 27</strong> to get your API key instantly.
          </Typography>
          <Button
            variant="contained"
            onClick={handleSaveWhatsappSettings}
            disabled={isSavingWhatsapp}
            sx={{
              fontWeight: 700,
              px: 3,
              py: 1,
              borderRadius: 2,
              boxShadow: 'none',
              textTransform: 'none',
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' }
            }}
          >
            {isSavingWhatsapp ? <CircularProgress size={20} color="inherit" /> : 'Save WhatsApp Settings'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
