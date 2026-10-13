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
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  Save as SaveIcon,
  Tune as SettingsIcon,
  Language as GlobeIcon,
  Send as TelegramIcon,
  CloudDone as IndexingIcon,
  AutoAwesome as SparklesIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { request } from '../../../shared/lib/api';
import { useToast } from '../../../components/Toast';

export default function GlobalSeoSettingsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
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
        setConfig(res.config);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load SEO configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
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
        setConfig(res.config);
      }
    } catch (err) {
      addToast(err.message || 'Failed to save SEO settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={40} sx={{ color: '#4f46e5' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(79, 70, 229, 0.3)'
            }}
          >
            <SettingsIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Universal AI SEO & Global Settings
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              RankMath & Yoast-style Global Patterns, Autocomplete & Auto-Dispatch Protocols
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          sx={{
            px: 3,
            py: 1,
            borderRadius: 2.5,
            fontWeight: 800,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)'
          }}
        >
          {saving ? 'Saving Settings...' : 'Save Settings'}
        </Button>
      </Box>

      {/* ── Section 1: Dynamic SEO Patterns ── */}
      <Paper elevation={1} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SparklesIcon sx={{ color: '#4f46e5' }} /> Global Meta Title & Description Patterns
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          Define enterprise template patterns. Use <code>{'{title}'}</code> as the placeholder for the clean vacancy title.
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
            <TextField
              fullWidth
              label="Default OpenGraph / Twitter Banner (1200x675)"
              value={config.defaultOgBanner || ''}
              onChange={(e) => handleChange('defaultOgBanner', e.target.value)}
              helperText="Path or full URL to social card image (e.g. /og-sarkari-banner-1200x675.webp)"
              sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ── Section 2: Automation & Dispatch Toggles ── */}
      <Paper elevation={1} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <GlobeIcon sx={{ color: '#06b6d4' }} /> Post-Publish Automations & Dispatch Protocols
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          Configure background lifecycle triggers for newly created or updated job vacancies.
        </Typography>

        <Grid container spacing={2.5}>
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
