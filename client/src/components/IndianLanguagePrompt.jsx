import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Slide,
  Fade,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TranslateIcon from '@mui/icons-material/Translate';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useLocation } from 'react-router-dom';
import { useVisitorCountry } from '../shared/lib/geo';
import { applyFullWebsiteTranslation } from './GlobalLanguagePicker';

// Rich Regional Indian Languages with Native Script & States
const INDIAN_LANGUAGES = [
  { code: 'hi', native: 'हिन्दी', english: 'Hindi', state: 'राष्ट्रीय / उत्तर भारत', flag: '🇮🇳' },
  { code: 'en', native: 'English', english: 'English', state: 'Common Official', flag: '🌐' },
  { code: 'mr', native: 'मराठी', english: 'Marathi', state: 'महाराष्ट्र (Maharashtra)', flag: '🇮🇳' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali', state: 'पश्चिम बंगाल (West Bengal)', flag: '🇧🇩' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil', state: 'तमिलनाडु (Tamil Nadu)', flag: '🇮🇳' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu', state: 'आंध्र व तेलंगाना (AP & TS)', flag: '🇮🇳' },
  { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati', state: 'गुजरात (Gujarat)', flag: '🇮🇳' },
  { code: 'kn', native: 'ಕನ್ನಡ', english: 'Kannada', state: 'कर्नाटक (Karnataka)', flag: '🇮🇳' },
  { code: 'ml', native: 'മലയാളം', english: 'Malayalam', state: 'केरल (Kerala)', flag: '🇮🇳' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi', state: 'पंजाब (Punjab)', flag: '🇮🇳' },
  { code: 'ur', native: 'اردو', english: 'Urdu', state: 'राष्ट्रीय भाषा (Urdu)', flag: '🇵🇰' }
];

export default function IndianLanguagePrompt() {
  const theme = useTheme();
  const location = useLocation();
  const { isIndia } = useVisitorCountry();
  const [visible, setVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem('dh_user_lang') || 'hi');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Suppress on Admin and Foreign directory pages
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/global')) {
      setVisible(false);
      return;
    }

    const alreadySelected = localStorage.getItem('dh_india_lang_selected');
    const alreadyDismissed = sessionStorage.getItem('dh_india_lang_dismissed');

    if (isIndia && !alreadySelected && !alreadyDismissed) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1000);
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
      {/* 🌟 Ultra-Premium Floating Glassmorphic Pill Banner */}
      <Slide direction="down" in={visible} mountOnEnter unmountOnExit>
        <Box sx={{
          width: '100%',
          position: 'relative',
          zIndex: 1150,
          pt: { xs: 1, md: 1.5 },
          pb: 0.5,
          px: { xs: 1.5, md: 2 }
        }}>
          <Box sx={{
            maxWidth: '1200px',
            mx: 'auto',
            position: 'relative',
            borderRadius: { xs: '20px', md: '9999px' },
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.92) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.5), 0 0 20px -3px rgba(249, 115, 22, 0.2), 0 0 20px -3px rgba(16, 185, 129, 0.18)',
            p: { xs: 1.5, md: '8px 18px' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            overflow: 'hidden'
          }}>
            {/* Top iridescent Tiranga Accent Line */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2.5px',
              background: 'linear-gradient(90deg, #F97316 0%, #FFFFFF 50%, #10B981 100%)',
              opacity: 0.9
            }} />

            {/* Left: Emblem & Value Proposition */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: { xs: 36, md: 40 },
                height: { xs: 36, md: 40 },
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 0 12px rgba(249, 115, 22, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: { xs: '1.2rem', md: '1.35rem' },
                flexShrink: 0
              }}>
                🇮🇳
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{
                    color: '#F8FAFC',
                    fontWeight: 800,
                    fontSize: { xs: '0.84rem', md: '0.92rem' },
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2
                  }}>
                    अपनी भाषा चुनें / Select Language
                  </Typography>
                  <Box sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: '#10B981',
                    boxShadow: '0 0 8px #10B981',
                    animation: 'pulse 2s infinite'
                  }} />
                </Box>
                <Typography sx={{
                  color: '#94A3B8',
                  fontSize: { xs: '0.72rem', md: '0.76rem' },
                  mt: 0.2,
                  fontWeight: 500
                }}>
                  डिफ़ॉल्ट हिन्दी या English, या अपनी स्थानीय राज्य भाषा में पढ़ें:
                </Typography>
              </Box>
            </Box>

            {/* Right: Premium Glass Pills & Action Buttons */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'flex-start', sm: 'flex-end' }
            }}>
              {/* Hindi Pill */}
              <Button
                size="small"
                onClick={() => handleSelectLanguage('hi')}
                sx={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  borderRadius: '9999px',
                  px: 2,
                  py: 0.6,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 18px rgba(16, 185, 129, 0.45)'
                  }
                }}
              >
                🇮🇳 हिन्दी (Default)
              </Button>

              {/* English Pill */}
              <Button
                size="small"
                onClick={() => handleSelectLanguage('en')}
                sx={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38BDF8',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  borderRadius: '9999px',
                  px: 2,
                  py: 0.6,
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  boxShadow: '0 4px 12px rgba(56, 189, 248, 0.15)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'rgba(56, 189, 248, 0.22)',
                    borderColor: '#38BDF8',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                🌐 English
              </Button>

              {/* All 11 Languages Dropdown Pill */}
              <Button
                size="small"
                onClick={() => setDialogOpen(true)}
                endIcon={<KeyboardArrowDownIcon sx={{ fontSize: '18px !important', color: '#FBBF24' }} />}
                startIcon={<TranslateIcon sx={{ fontSize: '16px !important', color: '#FBBF24' }} />}
                sx={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.16) 0%, rgba(245, 158, 11, 0.08) 100%)',
                  color: '#FDE047',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  borderRadius: '9999px',
                  px: 2,
                  py: 0.6,
                  border: '1px solid rgba(251, 191, 36, 0.45)',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.2)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.15) 100%)',
                    borderColor: '#FDE047',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                मातृभाषा चुनें (11 भाषाएं)
              </Button>

              {/* Dismiss Button */}
              <IconButton
                size="small"
                onClick={handleDismiss}
                aria-label="Dismiss language preference"
                sx={{
                  color: '#94A3B8',
                  p: 0.6,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: '#F8FAFC',
                    bgcolor: 'rgba(239, 68, 68, 0.2)',
                    borderColor: 'rgba(239, 68, 68, 0.4)'
                  }
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Slide>

      {/* 🏛️ Ultra-Luxury Obsidian Regional Language Modal */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #0B0F19 0%, #0F172A 100%)',
            color: '#F8FAFC',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(249, 115, 22, 0.15)',
            p: { xs: 1.5, sm: 2.5 },
            position: 'relative',
            overflow: 'hidden'
          }
        }}
      >
        {/* Top Iridescent Glow Accent */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #F97316 0%, #FFFFFF 50%, #10B981 100%)'
        }} />

        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, px: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: 'rgba(251, 191, 36, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(251, 191, 36, 0.3)'
            }}>
              <TranslateIcon sx={{ color: '#FBBF24', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.05rem', sm: '1.2rem' }, color: '#F8FAFC', lineHeight: 1.2 }}>
                🇮🇳 अपनी स्थानीय मातृभाषा चुनें
              </Typography>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.78rem', mt: 0.3 }}>
                11 प्रमुख भारतीय भाषाएं • 1-क्लिक में पूरा पोर्टल ट्रांसलेट
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setDialogOpen(false)}
            sx={{
              color: '#94A3B8',
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              '&:hover': { color: '#F8FAFC', bgcolor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 1, pt: 2, pb: 1 }}>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2, fontSize: '0.82rem' }}>
            सरकारी रिजल्ट, एडमिट कार्ड व भर्ती अधिसूचनाएं आपकी चुनी हुई भाषा में तुरंत बदल जाएंगी:
          </Typography>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 1.5
          }}>
            {INDIAN_LANGUAGES.map((lang) => {
              const isActive = selectedLang === lang.code;
              return (
                <Box
                  key={lang.code}
                  component="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    bgcolor: isActive ? 'rgba(16, 185, 129, 0.18)' : '#1E293B',
                    border: '1px solid',
                    borderColor: isActive ? '#10B981' : '#334155',
                    borderRadius: '16px',
                    p: 1.8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isActive ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(16, 185, 129, 0.25)' : '#334155',
                      borderColor: isActive ? '#34D399' : '#475569',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '1.4rem' }}>{lang.flag}</Typography>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography sx={{
                        color: isActive ? '#34D399' : '#F8FAFC',
                        fontWeight: 800,
                        fontSize: '0.98rem',
                        lineHeight: 1.2
                      }}>
                        {lang.native}
                      </Typography>
                      <Typography sx={{ color: '#94A3B8', fontSize: '0.74rem', mt: 0.3 }}>
                        {lang.english} • {lang.state}
                      </Typography>
                    </Box>
                  </Box>
                  {isActive ? (
                    <CheckCircleIcon sx={{ fontSize: 20, color: '#10B981' }} />
                  ) : (
                    <Box sx={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: '1px solid #475569'
                    }} />
                  )}
                </Box>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
