import { useState, useEffect } from 'react';
import { IconButton, Tooltip, Badge } from '@mui/material';
import { LightMode, DarkMode, Brightness4 } from '@mui/icons-material';

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0a0a0a';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
    }
    localStorage.setItem('darkMode', dark);
  }, [dark]);

  return (
    <Tooltip title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} arrow>
      <IconButton 
        onClick={() => setDark(!dark)}
        sx={{
          transition: 'all 0.3s ease',
          bgcolor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          '&:hover': {
            bgcolor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
            transform: 'rotate(180deg)',
          }
        }}
      >
        {dark ? (
          <LightMode sx={{ color: '#FFD700' }} />
        ) : (
          <DarkMode sx={{ color: '#6366f1' }} />
        )}
      </IconButton>
    </Tooltip>
  );
}
