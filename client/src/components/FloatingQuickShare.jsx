import React, { useState, useEffect, createContext, useContext } from 'react';
import { Box, Tooltip, Dialog, DialogTitle, DialogContent, Typography, IconButton, Button, Snackbar, Alert, Paper, InputBase } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Telegram';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkIcon from '@mui/icons-material/Link';

// Global Context for Share Modal
const ShareModalContext = createContext();

export const useShareModal = () => useContext(ShareModalContext);

export function ShareModalProvider({ children }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');

  const triggerShare = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      const title = document.title || 'Digital Home - Job Alerts & News';
      setCurrentUrl(url);
      setCurrentTitle(title);

      if (navigator.share && typeof navigator.share === 'function') {
        navigator.share({
          title: title,
          text: `📍 ${title}\n\nदेखें पूरी जानकारी Digital Home पर:`,
          url: url
        }).catch(() => {
          setOpenDialog(true);
        });
      } else {
        setOpenDialog(true);
      }
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const sharePlatforms = [
    {
      name: 'WhatsApp',
      subtitle: 'दोस्तों व ग्रुप्स को भेजें',
      icon: <WhatsAppIcon sx={{ fontSize: '1.6rem' }} />,
      color: '#ffffff',
      bgColor: '#25D366',
      hoverBg: '#1EBE5D',
      getUrl: () => `https://api.whatsapp.com/send?text=${encodeURIComponent(`📍 *${currentTitle}*\n\nयहाँ से देखें पूरी जानकारी 👇\n${currentUrl}`)}`
    },
    {
      name: 'Telegram',
      subtitle: 'टेलीग्राम चैनल में शेयर करें',
      icon: <TelegramIcon sx={{ fontSize: '1.6rem' }} />,
      color: '#ffffff',
      bgColor: '#0088cc',
      hoverBg: '#0077b5',
      getUrl: () => `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(`📍 ${currentTitle}`)}`
    },
    {
      name: 'Facebook',
      subtitle: 'फ़ेसबुक फ़ीड पर पोस्ट करें',
      icon: <FacebookIcon sx={{ fontSize: '1.6rem' }} />,
      color: '#ffffff',
      bgColor: '#1877F2',
      hoverBg: '#1565C0',
      getUrl: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`
    },
    {
      name: 'Twitter / X',
      subtitle: 'ट्विटर पर ट्वीट करें',
      icon: <TwitterIcon sx={{ fontSize: '1.6rem' }} />,
      color: '#ffffff',
      bgColor: '#0F1419',
      hoverBg: '#000000',
      getUrl: () => `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(`📍 ${currentTitle}`)}`
    }
  ];

  return (
    <ShareModalContext.Provider value={{ triggerShare }}>
      {children}

      {/* Shared Ultra-Professional Share Modal */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1.5,
            background: '#FFFFFF',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }
        }}
      >
        {/* Header */}
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, px: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ p: 0.8, bgcolor: '#DCFCE7', color: '#16A34A', borderRadius: '12px', display: 'flex' }}>
              <ShareIcon sx={{ fontSize: '1.2rem' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 850, color: '#0F172A', fontSize: '1.1rem' }}>
              पोस्ट शेयर करें (Quick Share)
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setOpenDialog(false)} sx={{ bgcolor: '#F1F5F9', color: '#64748B', '&:hover': { bgcolor: '#E2E8F0' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 1, pt: 1, pb: 2 }}>
          {/* Post Link Preview Card */}
          <Paper
            elevation={0}
            sx={{
              p: 1.8,
              mb: 2.5,
              borderRadius: '16px',
              bgcolor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5
            }}
          >
            <LinkIcon sx={{ color: '#2563EB', fontSize: '1.4rem', mt: 0.2 }} />
            <Box sx={{ overflow: 'hidden' }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: '#1E293B',
                  fontSize: '0.88rem',
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  mb: 0.5
                }}
              >
                {currentTitle}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#2563EB',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {currentUrl}
              </Typography>
            </Box>
          </Paper>

          {/* Social Platform Action Grid */}
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.68rem', mb: 1.5, display: 'block', px: 0.5 }}>
            सोशल मीडिया पर भेजें (Choose Platform)
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 2.5 }}>
            {sharePlatforms.map((platform) => (
              <Button
                key={platform.name}
                component="a"
                href={platform.getUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpenDialog(false)}
                startIcon={platform.icon}
                sx={{
                  bgcolor: platform.bgColor,
                  color: platform.color,
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  py: 1.2,
                  px: 1.8,
                  borderRadius: '14px',
                  textTransform: 'none',
                  boxShadow: `0 4px 14px ${platform.bgColor}40`,
                  justifyContent: 'flex-start',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: platform.hoverBg,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${platform.bgColor}60`
                  }
                }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.1 }}>
                    {platform.name}
                  </Typography>
                </Box>
              </Button>
            ))}
          </Box>

          {/* Copy Direct Link Section */}
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.68rem', mb: 1, display: 'block', px: 0.5 }}>
            डायरेक्ट लिंक कॉपी करें (Copy Direct Link)
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '14px',
              border: '1.5px solid #CBD5E1',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}
          >
            <InputBase
              value={currentUrl}
              readOnly
              sx={{
                ml: 1.5,
                flex: 1,
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#334155'
              }}
            />
            <Button
              variant="contained"
              onClick={handleCopyLink}
              startIcon={copied ? <CheckCircleIcon sx={{ fontSize: '1rem' }} /> : <ContentCopyIcon sx={{ fontSize: '1rem' }} />}
              sx={{
                bgcolor: copied ? '#16A34A' : '#2563EB',
                color: 'white',
                fontWeight: 850,
                fontSize: '0.78rem',
                borderRadius: '10px',
                textTransform: 'none',
                px: 2,
                py: 1,
                boxShadow: copied ? '0 4px 12px rgba(22, 163, 74, 0.3)' : '0 4px 12px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: copied ? '#15803D' : '#1D4ED8'
                }
              }}
            >
              {copied ? 'Copied! ✅' : 'Copy'}
            </Button>
          </Paper>
        </DialogContent>
      </Dialog>

      {/* Success Notification Toast */}
      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopied(false)} severity="success" sx={{ width: '100%', fontWeight: 800, borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
          ✅ लिंक कॉपी हो गया! अब किसी भी ऐप पर शेयर करें!
        </Alert>
      </Snackbar>
    </ShareModalContext.Provider>
  );
}

export default function FloatingQuickShare() {
  const shareContext = useShareModal();

  const handleShareClick = () => {
    if (shareContext && shareContext.triggerShare) {
      shareContext.triggerShare();
    } else {
      if (typeof window !== 'undefined') {
        const url = window.location.href;
        const title = document.title || 'Digital Home';
        if (navigator.share) {
          navigator.share({ title, text: title, url }).catch(() => {});
        }
      }
    }
  };

  return (
    <Tooltip title="दोस्तों व परिवार को तुरंत शेयर करें 🚀" placement="left" arrow>
      <Box
        onClick={handleShareClick}
        sx={{
          position: 'fixed',
          bottom: 75,
          right: { xs: 16, sm: 24, md: 32 },
          zIndex: 1150,
          // Display floating pill ONLY on mobile (xs), hide on Tablet & Desktop (sm, md) because Tablet & Desktop have it integrated in the bottom Telegram section!
          display: { xs: 'flex', sm: 'none' },
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.1,
          borderRadius: '50px',
          background: 'linear-gradient(135deg, #25D366 0%, #16A34A 100%)',
          color: '#FFFFFF',
          cursor: 'pointer',
          boxShadow: '0 8px 25px rgba(37, 211, 102, 0.45), 0 2px 10px rgba(0, 0, 0, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          userSelect: 'none',
          '&:hover': {
            transform: 'scale(1.08) translateY(-4px)',
            background: 'linear-gradient(135deg, #1EBE5D 0%, #15803D 100%)',
            boxShadow: '0 12px 35px rgba(37, 211, 102, 0.6)'
          },
          '&:active': {
            transform: 'scale(0.96)'
          }
        }}
      >
        <ShareIcon sx={{ fontSize: '1.25rem' }} />
        <Typography
          variant="button"
          sx={{
            fontWeight: 850,
            fontSize: '0.82rem',
            letterSpacing: 0.4,
            textTransform: 'none',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          Quick Share 🚀
        </Typography>
      </Box>
    </Tooltip>
  );
}
