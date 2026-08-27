import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ShareIcon from '@mui/icons-material/Share';
import { keyframes } from '@emotion/react';
import { useShareModal } from './FloatingQuickShare';

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

export default function TelegramStickyBanner() {
  const shareModal = useShareModal();

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
        py: { xs: 1, sm: 1.2 },
        px: { xs: 1.5, sm: 4 },
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
          gap: { xs: 1, sm: 2 },
        }}
      >
        {/* Left Side: Live Banner Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              fontSize: { xs: '1.3rem', sm: '1.8rem' },
              animation: `${bounce} 2s infinite ease-in-out`,
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              userSelect: 'none',
            }}
          >
            📢
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              variant="subtitle1"
              component="span"
              sx={{
                color: 'white',
                fontWeight: 800,
                fontSize: { xs: '0.78rem', sm: '0.95rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}
            >
              Job Alerts 15 Min Pehle! 🚀
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#94a3b8',
                fontSize: { xs: '0.65rem', sm: '0.78rem' },
                fontWeight: 500,
              }}
            >
              Admit Card, Result & Vacancy Live
            </Typography>
          </Box>
        </Box>

        {/* Right Side Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.2 } }}>
          {/* Quick Share Button (Integrated into Desktop & Tablet Telegram Bar) */}
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
              display: { xs: 'none', sm: 'inline-flex' }, // Visible on Tablet & Desktop
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
            startIcon={<SendIcon sx={{ transform: 'rotate(-30deg)', fontSize: '18px !important' }} />}
            sx={{
              bgcolor: '#0077b5',
              color: '#ffffff',
              fontWeight: 800,
              px: { xs: 1.5, sm: 2.5 },
              py: { xs: 0.6, sm: 0.8 },
              borderRadius: '9999px',
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
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
        </Box>
      </Box>
    </Box>
  );
}
