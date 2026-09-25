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

let cachedAdsData = null;
let pendingAdsPromise = null;

function fetchAdsData() {
  if (cachedAdsData) return Promise.resolve(cachedAdsData);
  if (pendingAdsPromise) return pendingAdsPromise;
  pendingAdsPromise = request('/api/ads')
    .then(data => {
      cachedAdsData = data || {};
      return cachedAdsData;
    })
    .catch(() => {
      pendingAdsPromise = null;
      return {};
    });
  return pendingAdsPromise;
}

// Eager preload ads configuration to prevent layout shift
if (typeof window !== 'undefined') {
  fetchAdsData();
}

export default function AdSlot({ format = 'sidebar', style }) {
  const [code, setCode] = useState(() => (cachedAdsData ? (cachedAdsData[format] || '') : null));
  const [loaded, setLoaded] = useState(() => Boolean(cachedAdsData));
  const ref = useRef(null);

  const minH = defaultMinHeights[format] || 250;

  useEffect(() => {
    fetchAdsData()
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
    return <Box className="ad-slot-container" sx={{ minHeight: minH, width: '100%', my: 3.5, ...style }} />;
  }

  // Google AdSense Compliance: Never display empty dashed placeholder boxes to visitors
  if (!code) {
    return null;
  }

  // Google AdSense Compliance: Mandatory disclosure label & safe margin to prevent accidental clicks
  return (
    <Box className="ad-slot-container" sx={{ minHeight: minH, width: '100%', my: 4, textAlign: 'center', ...style }}>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontSize: '0.65rem',
          color: 'text.disabled',
          letterSpacing: '0.08em',
          mb: 0.75,
          textTransform: 'uppercase'
        }}
      >
        Advertisement / विज्ञापन
      </Typography>
      <Box ref={ref} sx={{ minHeight: minH - 24, overflow: 'hidden' }} />
    </Box>
  );
}
