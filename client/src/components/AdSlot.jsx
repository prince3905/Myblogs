import { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { request } from '../shared/lib/api';

const labels = {
  sidebar: 'Sidebar Ad',
  incontent: 'In-Content Ad',
  afterpost: 'After Post Ad',
};

export default function AdSlot({ format = 'sidebar', style }) {
  const [code, setCode] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    request('/api/ads')
      .then(data => {
        setCode(data[format] || '');
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [format]);

  useEffect(() => {
    if (!code || !ref.current) return;
    const div = document.createElement('div');
    div.innerHTML = code;
    const scripts = div.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.removeChild(oldScript);
      div.appendChild(newScript);
    });
    ref.current.innerHTML = '';
    ref.current.appendChild(div);
  }, [code]);

  if (!loaded) return null;

  if (!code) {
    const s = {
      sidebar: { minHeight: 250 },
      incontent: { minHeight: 120 },
      afterpost: { minHeight: 160 },
    }[format] || { minHeight: 250 };

    return (
      <Paper elevation={0} sx={{
        borderRadius: 3, border: '1px dashed', borderColor: 'divider',
        bgcolor: 'action.hover', display: 'flex', alignItems: 'center',
        justifyContent: 'center', minHeight: s.minHeight, textAlign: 'center',
        overflow: 'hidden', ...style,
      }}>
        <Box sx={{ py: 3, px: 2 }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
            — {labels[format] || format} —
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
            No ad code set
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Box ref={ref} sx={{ overflow: 'hidden', ...style }} />
  );
}
