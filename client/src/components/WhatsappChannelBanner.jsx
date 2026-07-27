import { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Slide } from '@mui/material';
import { WhatsApp, Close } from '@mui/icons-material';

export default function WhatsappChannelBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('whatsapp_banner_dismissed');
    if (!dismissed) {
      // Show after 3 seconds delay for maximum conversion
      const timer = setTimeout(() => {
        setOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem('whatsapp_banner_dismissed', 'true');
  };

  const channelUrl = 'https://whatsapp.com/channel/0029Va9Z29c5a243aZ04523G'; // Configurable WhatsApp channel

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 12, md: 24 },
          left: { xs: 12, md: 24 },
          right: { xs: 12, md: 'auto' },
          maxWidth: { md: 460 },
          bgcolor: '#075E54',
          color: '#ffffff',
          borderRadius: 3.5,
          p: 2.5,
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.28)',
          zIndex: 9999,
          border: '1.5px solid #25D366',
          backdropFilter: 'blur(8px)'
        }}
      >
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'rgba(255,255,255,0.7)',
            '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <Close fontSize="small" />
        </IconButton>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              bgcolor: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
              flexShrink: 0
            }}
          >
            <WhatsApp sx={{ fontSize: 32, color: '#ffffff' }} />
          </Box>

          <Box sx={{ pr: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.98rem', lineHeight: 1.25, mb: 0.5 }}>
              💬 Join WhatsApp Channel!
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.82rem', lineHeight: 1.35 }}>
              Sarkari Result, Admit Card व Direct Apply Link का Instant Alert व्हाट्सएप पर पाएं!
            </Typography>
          </Box>
        </Box>

        <Button
          component="a"
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          fullWidth
          variant="contained"
          startIcon={<WhatsApp />}
          sx={{
            mt: 2,
            bgcolor: '#25D366',
            color: '#ffffff',
            fontWeight: 800,
            textTransform: 'none',
            fontSize: '0.92rem',
            py: 1,
            borderRadius: 2.5,
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)',
            '&:hover': {
              bgcolor: '#128C7E',
              boxShadow: '0 6px 16px rgba(18, 140, 126, 0.45)'
            }
          }}
        >
          Join Official WhatsApp Channel ↗
        </Button>
      </Box>
    </Slide>
  );
}
