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
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          if (OneSignal.Notifications) {
            await OneSignal.Notifications.requestPermission();
            if (Notification.permission === 'granted') {
              setIsSubscribed(true);
            }
          } else if (OneSignal.Slidedown) {
            await OneSignal.Slidedown.promptPush({ force: true });
          }
        });
      } else if (Notification.requestPermission) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') setIsSubscribed(true);
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
        {/* Animated Bell Icon */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            boxShadow: '0 8px 20px rgba(220, 38, 38, 0.25)',
            animation: 'bellRing 2s infinite ease-in-out',
            '@keyframes bellRing': {
              '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
              '10%, 30%': { transform: 'rotate(-15deg) scale(1.08)' },
              '20%, 40%': { transform: 'rotate(15deg) scale(1.08)' },
              '50%': { transform: 'rotate(0deg) scale(1)' }
            }
          }}
        >
          <NotificationsActiveIcon sx={{ fontSize: 34 }} />
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 850,
            fontSize: { xs: '1.15rem', sm: '1.25rem' },
            color: '#0F172A',
            letterSpacing: '-0.02em',
            mb: 1,
            lineHeight: 1.3
          }}
        >
          Sarkari Job Updates Miss Na Karein! 🔔
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: '#475569',
            fontSize: { xs: '0.85rem', sm: '0.9rem' },
            lineHeight: 1.5,
            mb: 2.5,
            px: { xs: 0.5, sm: 1 }
          }}
        >
          UP TET, SSC, Railway, UPSC, Admit Cards aur Results ka <strong>Instant Alert</strong> sabse pehle apne mobile par paayein.
        </Typography>

        {/* Feature Highlights */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            mb: 3,
            bgcolor: 'rgba(241, 245, 249, 0.8)',
            p: 1.5,
            borderRadius: '12px',
            textAlign: 'left'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlashOnIcon sx={{ fontSize: 16, color: '#EAB308' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.78rem' }}>
              100% Free & Direct Official Links
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon sx={{ fontSize: 16, color: '#16A34A' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.78rem' }}>
              Kabhi Bhi Unsubscribe Kar Sakte Hain
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
          <Button
            variant="contained"
            onClick={handleAllow}
            fullWidth
            sx={{
              bgcolor: '#DC2626',
              color: '#ffffff',
              py: 1.3,
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: 800,
              textTransform: 'none',
              boxShadow: '0 8px 20px rgba(220, 38, 38, 0.35)',
              '&:hover': {
                bgcolor: '#B91C1C',
                boxShadow: '0 10px 24px rgba(220, 38, 38, 0.45)'
              }
            }}
          >
            Allow Free Alerts (🔔 अनुमति दें)
          </Button>

          <Button
            variant="text"
            onClick={handleLater}
            sx={{
              color: '#64748B',
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'none',
              py: 0.5,
              '&:hover': { bgcolor: 'transparent', color: '#334155' }
            }}
          >
            Baad Me / Later
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
