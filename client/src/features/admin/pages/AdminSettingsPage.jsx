import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Switch, FormControlLabel, CircularProgress, Alert } from '@mui/material';
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

  useEffect(() => {
    request('/api/admin/settings')
      .then(data => {
        setSettings(data.settings || {});
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load system configurations.');
        setLoading(false);
      });
  }, []);

  const handleToggle = async (key) => {
    setUpdatingKey(key);
    setError('');
    
    // Toggle active state: active state is !disableSetting
    const currentDisabled = settings[key] === undefined ? true : settings[key];
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
          // Switch is toggled ON if the disable setting is FALSE or undefined (default active: let's assume default active if undefined)
          const isEnabled = settings[option.key] === undefined ? false : !settings[option.key];
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
    </Box>
  );
}
