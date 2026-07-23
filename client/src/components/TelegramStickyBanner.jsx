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
          <Button
            variant="contained"
            component="a"
            href="https://whatsapp.com/channel/0029VbD4hpfBA1esfvy9gY1Y"
            target="_blank"
            rel="noopener noreferrer"
            startIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382C17.11 14.201 15.33 13.325 14.998 13.205C14.667 13.085 14.426 13.025 14.185 13.386C13.944 13.747 13.252 14.56 13.042 14.801C12.831 15.042 12.62 15.072 12.259 14.891C11.898 14.71 10.736 14.33 9.359 13.102C8.28 12.14 7.551 10.952 7.34 10.591C7.129 10.23 7.318 10.035 7.499 9.855C7.662 9.693 7.861 9.432 8.042 9.221C8.223 9.01 8.283 8.86 8.403 8.619C8.524 8.378 8.464 8.167 8.374 7.986C8.284 7.805 7.561 6.031 7.26 5.308C6.967 4.604 6.67 4.7 6.452 4.689C6.246 4.679 6.005 4.678 5.764 4.678C5.523 4.678 5.132 4.768 4.801 5.129C4.47 5.49 3.538 6.362 3.538 8.138C3.538 9.914 4.831 11.629 5.012 11.87C5.193 12.111 7.561 15.748 11.18 17.313C12.041 17.684 12.712 17.907 13.237 18.074C14.101 18.349 14.888 18.31 15.512 18.217C16.208 18.113 17.653 17.342 17.954 16.499C18.255 15.656 18.255 14.934 18.165 14.783C18.075 14.633 17.834 14.543 17.472 14.382Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 13.891 2.525 15.66 3.438 17.168L2.05 21.737L6.758 20.395C8.217 21.417 9.99 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM4.011 12C4.011 7.588 7.588 4.011 12 4.011C16.412 4.011 19.989 7.588 19.989 12C19.989 16.412 16.412 19.989 12 19.989C10.285 19.989 8.704 19.447 7.411 18.528L4.629 19.324L5.448 16.604C4.536 15.289 4.011 13.705 4.011 12Z" fill="currentColor"/>
              </svg>
            }
            sx={{
              bgcolor: '#25D366',
              color: '#ffffff',
              fontWeight: 900,
              px: { xs: 1.5, sm: 2.8 },
              py: { xs: 0.6, sm: 0.9 },
              borderRadius: '9999px',
              fontSize: { xs: '0.72rem', sm: '0.82rem' },
              textTransform: 'none',
              animation: `${pulse} 2s infinite ease-in-out`,
              flexShrink: 0,
              boxShadow: '0 4px 10px rgba(37, 211, 102, 0.4)',
              '&:hover': {
                bgcolor: '#1eaa53',
                color: '#ffffff',
              },
            }}
          >
            WhatsApp
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
              bgcolor: '#24A1DE',
              color: '#ffffff',
              fontWeight: 800,
              px: { xs: 1.5, sm: 2.5 },
              py: { xs: 0.6, sm: 0.9 },
              borderRadius: '9999px',
              fontSize: { xs: '0.72rem', sm: '0.82rem' },
              textTransform: 'none',
              flexShrink: 0,
              boxShadow: '0 4px 10px rgba(36, 161, 222, 0.3)',
              '&:hover': {
                bgcolor: '#1a8cc2',
                color: '#ffffff',
              },
            }}
          >
            Telegram
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
