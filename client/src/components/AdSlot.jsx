import { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { request } from '../shared/lib/api';

const labels = {
  sidebar: 'Sidebar Ad',
  incontent: 'In-Content Ad',
  afterpost: 'After Post Ad',
};

const defaultMinHeights = {
  sidebar: 250,
  incontent: 120,
  afterpost: 160,
};

export default function AdSlot({ format = 'sidebar', style }) {
  const [code, setCode] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  const minH = defaultMinHeights[format] || 250;

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

  if (!loaded) {
    return <Box sx={{ minHeight: minH, width: '100%', ...style }} />;
  }

  if (!code) {
    return (
      <Paper elevation={0} sx={{
        borderRadius: 3, border: '1px dashed', borderColor: 'divider',
        bgcolor: 'action.hover', display: 'flex', alignItems: 'center',
        justifyContent: 'center', minHeight: minH, textAlign: 'center',
        overflow: 'hidden', ...style,
      }}>
        <Box sx={{ py: 3, px: 2 }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
            {labels[format] || 'Ad Space'}
          </Typography>
        </Box>
      </Paper>
    );
  }

  return <Box ref={ref} sx={{ minHeight: minH, overflow: 'hidden', ...style }} />;
}
