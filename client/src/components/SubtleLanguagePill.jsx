import React, { useState, useEffect } from 'react';
import { Box, Button, useTheme } from '@mui/material';
import { useVisitorCountry } from '../shared/lib/geo';
import { applyFullWebsiteTranslation } from './GlobalLanguagePicker';

export default function SubtleLanguagePill({ sx = {} }) {
  const theme = useTheme();
  const { isIndia, userCountry } = useVisitorCountry();
  const [currentLang, setCurrentLang] = useState(() => {
    try {
      const isLocked = localStorage.getItem('dh_user_lang_locked') === 'true';
      const saved = localStorage.getItem('dh_user_lang');
      return (isLocked && saved) ? saved : 'en';
    } catch (e) {
      return 'en';
    }
  });

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail?.lang) {
        setCurrentLang(e.detail.lang);
      }
    };
    window.addEventListener('dh_language_changed', handleSync);
    return () => window.removeEventListener('dh_language_changed', handleSync);
  }, []);

  const switchLanguage = (targetLang) => {
    try {
      localStorage.setItem('dh_user_lang', targetLang);
      localStorage.setItem('dh_user_lang_locked', 'true');
      setCurrentLang(targetLang);
      applyFullWebsiteTranslation(targetLang);
      window.dispatchEvent(new CustomEvent('dh_language_changed', {
        detail: { lang: targetLang, country: isIndia ? 'IN' : userCountry }
      }));
    } catch (e) {}
  };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        borderRadius: '9999px',
        p: '3px',
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        ...sx,
      }}
    >
      <Button
        size="small"
        onClick={() => switchLanguage('en')}
        sx={{
          borderRadius: '9999px',
          px: 1.5,
          py: 0.35,
          fontSize: '0.78rem',
          fontWeight: currentLang === 'en' ? 750 : 500,
          minWidth: 'auto',
          bgcolor: currentLang === 'en'
            ? (theme.palette.mode === 'dark' ? '#374151' : '#ffffff')
            : 'transparent',
          color: currentLang === 'en'
            ? (theme.palette.mode === 'dark' ? '#F9FAFB' : '#111827')
            : 'text.secondary',
          boxShadow: currentLang === 'en' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
          textTransform: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: currentLang === 'en'
              ? (theme.palette.mode === 'dark' ? '#374151' : '#ffffff')
              : 'rgba(0,0,0,0.04)'
          }
        }}
      >
        🌐 English
      </Button>
      <Button
        size="small"
        onClick={() => switchLanguage('hi')}
        sx={{
          borderRadius: '9999px',
          px: 1.5,
          py: 0.35,
          fontSize: '0.78rem',
          fontWeight: currentLang === 'hi' ? 750 : 500,
          minWidth: 'auto',
          bgcolor: currentLang === 'hi'
            ? (theme.palette.mode === 'dark' ? '#374151' : '#ffffff')
            : 'transparent',
          color: currentLang === 'hi'
            ? (theme.palette.mode === 'dark' ? '#F9FAFB' : '#111827')
            : 'text.secondary',
          boxShadow: currentLang === 'hi' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
          textTransform: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: currentLang === 'hi'
              ? (theme.palette.mode === 'dark' ? '#374151' : '#ffffff')
              : 'rgba(0,0,0,0.04)'
          }
        }}
      >
        🇮🇳 हिंदी
      </Button>
    </Box>
  );
}
