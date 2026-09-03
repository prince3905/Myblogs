import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Box,
  IconButton,
  Zoom
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function PushNotificationModal() {
  const [open, setOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already granted
    if ('Notification' in window && Notification.permission === 'granted') {
      setIsSubscribed(true);
      return;
    }

    // Fast initial trigger after 1.5 seconds on page load
    const initialTimer = setTimeout(() => {
      checkAndShowPrompt();
    }, 1500);

    return () => clearTimeout(initialTimer);
  }, []);

  const checkAndShowPrompt = () => {
    if (Notification.permission === 'granted') {
      setIsSubscribed(true);
      return;
    }
    if (Notification.permission !== 'denied') {
      setOpen(true);
    }
  };

  const handleAllow = async () => {
    setOpen(false);

    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setIsSubscribed(true);
        }
      }

      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          try {
            if (OneSignal.Notifications) {
              await OneSignal.Notifications.requestPermission();
            }
            if (OneSignal.User && OneSignal.User.PushSubscription) {
              await OneSignal.User.PushSubscription.optIn();
            }
          } catch (e) {}
        });
      }
    } catch (err) {
      console.warn('[Push Modal] Permission request notice:', err.message);
    }
  };

  const handleLater = () => {
    setOpen(false);
    // Re-prompt after 60 seconds if user still hasn't allowed!
    setTimeout(() => {
      if (Notification.permission === 'default') {
        setOpen(true);
      }
    }, 60000);
  };

  if (isSubscribed) return null;

  return (
    <Dialog
      open={open}
      onClose={handleLater}
      TransitionComponent={Zoom}
      keepMounted
      PaperProps={{
        sx: {
          borderRadius: '20px',
          padding: { xs: '12px 8px', sm: '20px 16px' },
          maxWidth: '420px',
          width: '92%',
          margin: 'auto',
          background: 'linear-gradient(145deg, #ffffff 0%, #F8FAFC 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }
      }}
    >
      {/* Background glow accent */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 160,
          height: 160,
          bgcolor: 'rgba(239, 68, 68, 0.12)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      <IconButton
        onClick={handleLater}
        size="small"
        sx={{
          position: 'absolute',
          right: 12,
          top: 12,
          color: '#94A3B8',
          bgcolor: 'rgba(0,0,0,0.04)',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.08)', color: '#475569' },
          zIndex: 2
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <DialogContent sx={{ p: { xs: 1.5, sm: 2 }, position: 'relative', zIndex: 1 }}>
        {/* Top Urgency Pill Badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.6,
            bgcolor: '#FEE2E2',
            color: '#DC2626',
            px: 1.5,
            py: 0.4,
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 850,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            mb: 1.5,
            border: '1px solid rgba(220, 38, 38, 0.2)'
          }}
        >
          <Box sx={{ width: 6, height: 6, bgcolor: '#DC2626', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
          🔥 LIVE SARKARI UPDATES • 100% FREE
        </Box>

        {/* Animated Bell Icon */}
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            bgcolor: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
            background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1.8,
            boxShadow: '0 10px 25px rgba(220, 38, 38, 0.35)',
            animation: 'bellRing 2s infinite ease-in-out',
            '@keyframes bellRing': {
              '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
              '10%, 30%': { transform: 'rotate(-15deg) scale(1.08)' },
              '20%, 40%': { transform: 'rotate(15deg) scale(1.08)' },
              '50%': { transform: 'rotate(0deg) scale(1)' }
            }
          }}
        >
          <NotificationsActiveIcon sx={{ fontSize: 32 }} />
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '1.2rem', sm: '1.35rem' },
            color: '#0F172A',
            letterSpacing: '-0.02em',
            mb: 0.8,
            lineHeight: 1.3
          }}
        >
          सरकारी नौकरी के फॉर्म & Admit Card कभी मिस न हों! 🔔
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: '#475569',
            fontSize: { xs: '0.85rem', sm: '0.92rem' },
            lineHeight: 1.5,
            mb: 2.2,
            px: { xs: 0.5, sm: 1 }
          }}
        >
          UP TET, SSC, Railway, Police, UPSC और State Jobs के <strong>Live Alerts & Direct Apply Link</strong> सबसे पहले अपने फोन पर पाएं।
        </Typography>

        {/* Feature Highlights */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.9,
            mb: 2.5,
            bgcolor: 'rgba(241, 245, 249, 0.85)',
            p: 1.5,
            borderRadius: '12px',
            textAlign: 'left',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlashOnIcon sx={{ fontSize: 17, color: '#EAB308' }} />
            <Typography variant="caption" sx={{ fontWeight: 750, color: '#1E293B', fontSize: '0.8rem' }}>
              ⚡ Direct Official Apply & PDF Link (कोई फेक लिंक नहीं)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon sx={{ fontSize: 17, color: '#16A34A' }} />
            <Typography variant="caption" sx={{ fontWeight: 750, color: '#1E293B', fontSize: '0.8rem' }}>
              ⏳ Last Date & Result Reminder (फॉर्म छूटने से बचें)
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleAllow}
            fullWidth
            sx={{
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              color: '#ffffff',
              py: 1.35,
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 850,
              textTransform: 'none',
              letterSpacing: '0.01em',
              boxShadow: '0 8px 22px rgba(220, 38, 38, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)',
                boxShadow: '0 10px 26px rgba(220, 38, 38, 0.5)'
              }
            }}
          >
            🔔 हाँ, मुझे फ्री अलर्ट भेजें (Allow Free Alerts)
          </Button>

          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600, mt: 0.2 }}>
            🔒 100% Free Lifetime • 1-Click में कभी भी बंद कर सकते हैं
          </Typography>

          <Button
            variant="text"
            onClick={handleLater}
            sx={{
              color: '#64748B',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'none',
              py: 0.4,
              '&:hover': { bgcolor: 'transparent', color: '#1E293B' }
            }}
          >
            बाद में (Later)
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
