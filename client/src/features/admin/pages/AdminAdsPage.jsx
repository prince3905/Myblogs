import { useEffect, useState } from 'react';
import { Typography, Button, Box, Paper, TextField, Alert } from '@mui/material';
import { request } from '../../../shared/lib/api';

const slots = [
  { key: 'sidebar', label: 'Sidebar', hint: 'Appears on blog list page sidebar' },
  { key: 'incontent', label: 'In-Content', hint: 'Appears inside blog post content' },
  { key: 'afterpost', label: 'After Post', hint: 'Appears after blog post content' },
];

export default function AdminAdsPage() {
  const [ads, setAds] = useState({});
  const [saving, setSaving] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    request('/api/admin/ads')
      .then(data => {
        const map = {};
        data.forEach(a => { map[a.slot] = a.code; });
        slots.forEach(s => { if (!map[s.key]) map[s.key] = ''; });
        setAds(map);
      })
      .catch(() => setMsg('Failed to load ad codes'));
  }, []);

  async function handleSave(slot) {
    setSaving(slot);
    setMsg('');
    try {
      await request(`/api/admin/ads/${slot}`, {
        method: 'PUT',
        body: JSON.stringify({ code: ads[slot] || '' }),
      });
      setMsg(`${slot} ad saved`);
    } catch { setMsg('Failed to save'); }
    setSaving(null);
  }

  return (
    <>
      <Box sx={{
        px: { xs: 2, md: 4 }, py: 2.5, bgcolor: 'white',
        borderBottom: '1px solid', borderColor: '#ECECEC',
        display: 'flex', alignItems: 'center', flexShrink: 0,
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>Ad Management</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.3 }}>Paste your AdSense code for each slot</Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 4 } }}>
        {msg && <Alert severity={msg.includes('Failed') ? 'error' : 'success'} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}

        {slots.map(slot => (
          <Paper key={slot.key} elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid #ECECEC', overflow: 'hidden' }}>
            <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderBottom: '1px solid #ECECEC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{slot.label} Ad</Typography>
                <Typography sx={{ color: '#6B7280', fontSize: '0.8rem' }}>{slot.hint}</Typography>
              </Box>
            </Box>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder={`Paste AdSense code for ${slot.label} slot...`}
                value={ads[slot.key] || ''}
                onChange={e => setAds(prev => ({ ...prev, [slot.key]: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={() => handleSave(slot.key)}
                disabled={saving === slot.key}
                sx={{ fontWeight: 600, borderRadius: 2 }}
              >
                {saving === slot.key ? 'Saving...' : `Save ${slot.label} Ad`}
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>
    </>
  );
}
