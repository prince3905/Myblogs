import { Box, Typography, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { keyframes } from '@emotion/react';

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.95; }
  50% { transform: scale(1.05); opacity: 1; }
`;

export default function TelegramStickyBanner() {
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
          flexWrap: { xs: 'nowrap', sm: 'nowrap' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem' },
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.5 } }}>
          {/* WhatsApp Channel Button */}
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
              px: { xs: 2, sm: 3 },
              py: { xs: 0.6, sm: 0.9 },
              borderRadius: '9999px',
              fontSize: { xs: '0.78rem', sm: '0.85rem' },
              textTransform: 'none',
              animation: `${pulse} 2s infinite ease-in-out`,
              flexShrink: 0,
              boxShadow: '0 4px 10px rgba(36, 161, 222, 0.4)',
              '&:hover': {
                bgcolor: '#1a8cc2',
                color: '#ffffff',
              },
            }}
          >
            Join Telegram ✈️
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
