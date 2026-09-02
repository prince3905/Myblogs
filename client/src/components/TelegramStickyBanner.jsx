import React, { useState } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ShareIcon from '@mui/icons-material/Share';
import CloseIcon from '@mui/icons-material/Close';
import { keyframes } from '@emotion/react';
import { useShareModal } from './FloatingQuickShare';

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

export default function TelegramStickyBanner() {
  const shareModal = useShareModal();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('tg_banner_dismissed') === 'true';
    }
    return false;
  });

  if (dismissed) return null;

  const handleShareClick = () => {
    if (shareModal && shareModal.triggerShare) {
      shareModal.triggerShare();
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

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tg_banner_dismissed', 'true');
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        bgcolor: '#0f172a',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        zIndex: 1100,
        py: { xs: 0.8, sm: 1.2 },
        px: { xs: 1.2, sm: 4 },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '960px',
          gap: { xs: 0.8, sm: 2 },
        }}
      >
        {/* Left Side: Live Banner Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              fontSize: { xs: '1.2rem', sm: '1.8rem' },
              animation: `${bounce} 2s infinite ease-in-out`,
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              userSelect: 'none',
            }}
          >
            📢
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              component="span"
              sx={{
                color: 'white',
                fontWeight: 800,
                fontSize: { xs: '0.74rem', sm: '0.95rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Job Alerts 15 Min Pehle! 🚀
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#94a3b8',
                fontSize: { xs: '0.62rem', sm: '0.78rem' },
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Admit Card, Result & Vacancy Live
            </Typography>
          </Box>
        </Box>

        {/* Right Side Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.6, sm: 1.2 }, flexShrink: 0 }}>
          {/* Quick Share Button (Mobile Compact Icon) */}
          <IconButton
            onClick={handleShareClick}
            aria-label="Share page"
            sx={{
              bgcolor: '#25D366',
              color: '#ffffff',
              width: 32,
              height: 32,
              display: { xs: 'flex', sm: 'none' },
              boxShadow: '0 2px 8px rgba(37, 211, 102, 0.4)',
              '&:hover': { bgcolor: '#1EBE5D' }
            }}
          >
            <ShareIcon sx={{ fontSize: '16px' }} />
          </IconButton>

          {/* Quick Share Button (Desktop & Tablet Pill) */}
          <Button
            variant="contained"
            onClick={handleShareClick}
            startIcon={<ShareIcon sx={{ fontSize: '18px !important' }} />}
            sx={{
              bgcolor: '#25D366',
              color: '#ffffff',
              fontWeight: 850,
              px: { xs: 1.2, sm: 2.2 },
              py: { xs: 0.6, sm: 0.8 },
              borderRadius: '9999px',
              fontSize: { xs: '0.72rem', sm: '0.85rem' },
              textTransform: 'none',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
              display: { xs: 'none', sm: 'inline-flex' },
              '&:hover': {
                bgcolor: '#1EBE5D',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Quick Share 📲
          </Button>

          {/* Telegram Button */}
          <Button
            variant="contained"
            component="a"
            href="https://t.me/SarkariJob_DigitalHome"
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<SendIcon sx={{ transform: 'rotate(-30deg)', fontSize: '16px !important' }} />}
            sx={{
              bgcolor: '#0077b5',
              color: '#ffffff',
              fontWeight: 800,
              px: { xs: 1.2, sm: 2.5 },
              py: { xs: 0.5, sm: 0.8 },
              borderRadius: '9999px',
              fontSize: { xs: '0.72rem', sm: '0.85rem' },
              textTransform: 'none',
              flexShrink: 0,
              boxShadow: '0 4px 10px rgba(36, 161, 222, 0.4)',
              '&:hover': {
                bgcolor: '#1a8cc2',
                color: '#ffffff',
              },
            }}
          >
            Telegram ✈️
          </Button>

          {/* Close / Dismiss Button */}
          <IconButton
            onClick={handleDismiss}
            aria-label="Close banner"
            size="small"
            sx={{
              color: '#94a3b8',
              p: 0.4,
              ml: { xs: 0.2, sm: 0.5 },
              '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <CloseIcon sx={{ fontSize: { xs: '16px', sm: '18px' } }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
