import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Chip,
  Slide
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TranslateIcon from '@mui/icons-material/Translate';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useLocation } from 'react-router-dom';
import { useVisitorCountry } from '../shared/lib/geo';
import { applyFullWebsiteTranslation, COUNTRY_REGIONS } from './GlobalLanguagePicker';

export default function IndianLanguagePrompt() {
  const location = useLocation();
  const { isIndia } = useVisitorCountry();
  const [visible, setVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('hi');

  // Major Indian Languages from COUNTRY_REGIONS
  const indiaLanguages = COUNTRY_REGIONS.find(c => c.code === 'IN')?.languages || [
    { code: 'hi', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
    { code: 'en', label: 'English', flag: '🌐' },
    { code: 'bn', label: 'বাংলা (Bengali)', flag: '🇧🇩' },
    { code: 'ta', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
    { code: 'te', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
    { code: 'mr', label: 'मराठी (Marathi)', flag: '🇮🇳' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
    { code: 'ml', label: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
    { code: 'ur', label: 'اردو (Urdu)', flag: '🇵🇰' }
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Suppress on Admin or Foreign directory pages
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/global')) {
      setVisible(false);
      return;
    }

    // Check if user already explicitly selected or dismissed
    const alreadySelected = localStorage.getItem('dh_india_lang_selected');
    const alreadyDismissed = sessionStorage.getItem('dh_india_lang_dismissed');

    if (isIndia && !alreadySelected && !alreadyDismissed) {
      // Gentle delay of 1.5s after load to avoid layout shifts
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isIndia, location.pathname]);

  const handleSelectLanguage = (langCode) => {
    try {
      setSelectedLang(langCode);
      localStorage.setItem('dh_user_lang', langCode);
      localStorage.setItem('dh_user_lang_locked', 'true');
      localStorage.setItem('dh_india_lang_selected', 'true');
      applyFullWebsiteTranslation(langCode);
      window.dispatchEvent(new CustomEvent('dh_language_changed', {
        detail: { lang: langCode, country: 'IN' }
      }));
    } catch (e) {}

    setVisible(false);
    setDialogOpen(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('dh_india_lang_dismissed', 'true');
  };

  if (!visible) return null;

  return (
    <>
      {/* Sleek, Non-Intrusive Language Preference Banner */}
      <Slide direction="down" in={visible} mountOnEnter unmountOnExit>
        <Box sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1200,
          background: 'linear-gradient(90deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
          borderBottom: '1px solid rgba(251, 191, 36, 0.4)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          px: { xs: 1.5, sm: 3 },
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              bgcolor: 'rgba(251, 191, 36, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              fontSize: '1.1rem'
            }}>
              🇮🇳
            </Box>
            <Box>
              <Typography sx={{ color: '#F8FAFC', fontWeight: 800, fontSize: { xs: '0.8rem', sm: '0.88rem' }, lineHeight: 1.2 }}>
                अपनी पसंदीदा भाषा चुनें / Select Preferred Language
              </Typography>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.74rem' }}>
                डिफ़ॉल्ट हिन्दी या English, या अपनी स्थानीय राज्य भाषा में पढ़ें:
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {/* Quick Hindi */}
            <Button
              size="small"
              variant="contained"
              onClick={() => handleSelectLanguage('hi')}
              sx={{
                bgcolor: '#059669',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'none',
                borderRadius: '8px',
                px: 1.5,
                py: 0.4,
                '&:hover': { bgcolor: '#047857' }
              }}
            >
              🇮🇳 हिन्दी (Default)
            </Button>

            {/* Quick English */}
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleSelectLanguage('en')}
              sx={{
                color: '#38BDF8',
                borderColor: '#0284C7',
                bgcolor: 'rgba(2, 132, 199, 0.1)',
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'none',
                borderRadius: '8px',
                px: 1.5,
                py: 0.4,
                '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.2)', borderColor: '#38BDF8' }
              }}
            >
              🌐 English
            </Button>

            {/* All 11 Indian Languages Dropdown */}
            <Button
              size="small"
              onClick={() => setDialogOpen(true)}
              startIcon={<TranslateIcon sx={{ fontSize: 16, color: '#FBBF24' }} />}
              sx={{
                color: '#FBBF24',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                bgcolor: 'rgba(251, 191, 36, 0.08)',
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'none',
                borderRadius: '8px',
                px: 1.5,
                py: 0.4,
                '&:hover': { bgcolor: 'rgba(251, 191, 36, 0.18)' }
              }}
            >
              मातृभाषा चुनें (11 भाषाएं) ▼
            </Button>

            {/* Close / Dismiss */}
            <IconButton
              size="small"
              onClick={handleDismiss}
              sx={{ color: '#64748B', p: 0.5, '&:hover': { color: '#F8FAFC' } }}
              aria-label="Close language selector"
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      </Slide>

      {/* Full Indian Regional Languages Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0F172A',
            color: '#F8FAFC',
            border: '1px solid #1E293B',
            borderRadius: '20px',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#F8FAFC' }}>
              🇮🇳 अपनी स्थानीय मातृभाषा चुनें (11 भारतीय भाषाएं)
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setDialogOpen(false)} sx={{ color: '#64748B' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2, fontSize: '0.85rem' }}>
            पूरा पोर्टल, सरकारी रिजल्ट व जॉब अलर्ट्स आपकी चुनी हुई भाषा में ऑटो-ट्रांसलेट हो जाएंगे:
          </Typography>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 1.5
          }}>
            {indiaLanguages.map((lang) => {
              const isActive = selectedLang === lang.code;
              return (
                <Button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  variant={isActive ? 'contained' : 'outlined'}
                  sx={{
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1.2,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: '0.86rem',
                    fontWeight: isActive ? 800 : 600,
                    bgcolor: isActive ? '#059669' : '#1E293B',
                    borderColor: isActive ? '#10B981' : '#334155',
                    color: isActive ? '#FFFFFF' : '#F1F5F9',
                    '&:hover': {
                      bgcolor: isActive ? '#047857' : '#334155',
                      borderColor: '#059669'
                    }
                  }}
                >
                  <span>{lang.flag} {lang.label}</span>
                  {isActive && <CheckCircleIcon sx={{ fontSize: 18, color: '#FFFFFF' }} />}
                </Button>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
