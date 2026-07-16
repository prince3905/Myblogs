import { Box, Typography, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { keyframes } from '@emotion/react';

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1); }
  50% { transform: scale(1.05); box-shadow: 0 6px 18px rgba(255, 255, 255, 0.2); }
`;

export default function TelegramStickyBanner() {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        bgcolor: '#24A1DE', // Telegram Blue
        borderTop: '1px solid #1a8cc2',
        boxShadow: '0 -4px 15px rgba(0,0,0,0.12)',
        zIndex: 1100, // Stands above Mui elements but under overlays
        py: { xs: 1.2, sm: 1.5 },
        px: { xs: 2, sm: 4 },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        component="a"
        href="https://t.me/DigitalHomeJobsAlerts"
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '960px',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              fontSize: { xs: '1.8rem', sm: '2.2rem' },
              animation: `${bounce} 2s infinite ease-in-out`,
              display: 'flex',
              alignItems: 'center',
              userSelect: 'none',
            }}
          >
            📱
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: 'white',
                fontWeight: 800,
                fontSize: { xs: '0.85rem', sm: '1rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}
            >
              Sarkari Job Alerts 15 Min Pehle!
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#e0f2fe',
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                fontWeight: 500,
              }}
            >
              Admit Card & Result Updates (Free Join)
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<SendIcon sx={{ transform: 'rotate(-30deg)' }} />}
          sx={{
            bgcolor: 'white',
            color: '#24A1DE',
            fontWeight: 900,
            px: { xs: 2.2, sm: 3.5 },
            py: { xs: 0.8, sm: 1.1 },
            borderRadius: '9999px',
            fontSize: { xs: '0.75rem', sm: '0.85rem' },
            textTransform: 'none',
            animation: `${pulse} 2s infinite ease-in-out`,
            flexShrink: 0,
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            '&:hover': {
              bgcolor: '#f1f5f9',
              color: '#1a8cc2',
            },
          }}
        >
          JOIN NOW
        </Button>
      </Box>
    </Box>
  );
}
