import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function TelegramRedirectModal({ open, onClose, targetUrl }) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!open) return;
    setCountdown(3);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, targetUrl, onClose]);

  const handleManualProceed = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 2,
          maxWidth: '420px',
          width: '100%',
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, pb: 1, color: '#1f2937' }}>
        ⚡ Fast Track Updates
      </DialogTitle>
      
      <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
        <Typography variant="body2" sx={{ color: '#4b5563', mb: 3, px: 1, lineHeight: 1.6 }}>
          सरकारी भर्ती, एडमिट कार्ड और रिजल्ट्स की पल-पल की जानकारी सबसे पहले पाने के लिए हमारे टेलीग्राम चैनल को जॉइन करें!
        </Typography>

        {/* Telegram Join Button */}
        <Button
          variant="contained"
          component="a"
          href="https://t.me/DigitalHomeJobsAlerts"
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<SendIcon sx={{ transform: 'rotate(-30deg)' }} />}
          sx={{
            width: '100%',
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 800,
            borderRadius: 3,
            bgcolor: '#24A1DE',
            boxShadow: '0 4px 14px rgba(36, 161, 222, 0.4)',
            mb: 3,
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#1a8cc2',
            }
          }}
        >
          Join Telegram Group (Free)
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CircularProgress size={16} sx={{ color: '#9ca3af' }} />
          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
            Redirecting to official link in {countdown}s...
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', borderTop: '1px solid #f3f4f6', pt: 2 }}>
        <Button 
          onClick={handleManualProceed} 
          endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
          sx={{ 
            color: '#4B5563', 
            fontWeight: 700, 
            fontSize: '0.8rem',
            textTransform: 'none'
          }}
        >
          Skip & Proceed to website
        </Button>
      </DialogActions>
    </Dialog>
  );
}
