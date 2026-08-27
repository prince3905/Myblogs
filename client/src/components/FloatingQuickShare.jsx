import React, { useState } from 'react';
import { Box, Fab, Tooltip, Dialog, DialogTitle, DialogContent, Typography, IconButton, Button, Snackbar, Alert } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Telegram';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';

export default function FloatingQuickShare() {
  const [openDialog, setOpenDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShareClick = () => {
    const shareData = {
      title: document.title || 'Digital Home - Job Alerts & Blog',
      text: 'Check out this useful vacancy / post on Digital Home!',
      url: window.location.href
    };

    // Try native Web Share API first on Mobile devices
    if (navigator.share && typeof navigator.share === 'function') {
      navigator.share(shareData).catch(() => {
        // Fallback to custom dialog if user cancelled or native share failed
        setOpenDialog(true);
      });
    } else {
      setOpenDialog(true);
    }
  };

  const getShareLinks = () => {
    const currentUrl = encodeURIComponent(window.location.href);
    const currentTitle = encodeURIComponent(document.title || 'Digital Home');
    
    return [
      {
        name: 'WhatsApp',
        icon: <WhatsAppIcon />,
        color: '#25D366',
        bg: '#DCFCE7',
        url: `https://api.whatsapp.com/send?text=${currentTitle}%20-%20${currentUrl}`
      },
      {
        name: 'Telegram',
        icon: <TelegramIcon />,
        color: '#0088cc',
        bg: '#E0F2FE',
        url: `https://t.me/share/url?url=${currentUrl}&text=${currentTitle}`
      },
      {
        name: 'Facebook',
        icon: <FacebookIcon />,
        color: '#1877F2',
        bg: '#EFF6FF',
        url: `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`
      },
      {
        name: 'Twitter / X',
        icon: <TwitterIcon />,
        color: '#1DA1F2',
        bg: '#F0F9FF',
        url: `https://twitter.com/intent/tweet?url=${currentUrl}&text=${currentTitle}`
      }
    ];
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
  };

  return (
    <>
      {/* Floating Quick Share Button */}
      <Tooltip title="Quick Share with Friends & Family 🚀" placement="left" arrow>
        <Fab
          color="primary"
          aria-label="Quick Share"
          onClick={handleShareClick}
          sx={{
            position: 'fixed',
            bottom: { xs: 75, sm: 85, md: 30 },
            right: { xs: 16, sm: 24, md: 30 },
            zIndex: 1150,
            background: 'linear-gradient(135deg, #25D366 0%, #059669 100%)',
            color: 'white',
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(5, 150, 105, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            px: { xs: 1.8, md: 2.2 },
            height: { xs: 46, md: 50 },
            borderRadius: '25px',
            '&:hover': {
              background: 'linear-gradient(135deg, #16A34A 0%, #047857 100%)',
              transform: 'scale(1.08) translateY(-3px)',
              boxShadow: '0 12px 30px rgba(5, 150, 105, 0.5)'
            },
            animation: 'pulseShare 2.5s infinite ease-in-out',
            '@keyframes pulseShare': {
              '0%': { boxShadow: '0 0 0 0 rgba(37, 211, 102, 0.6)' },
              '70%': { boxShadow: '0 0 0 14px rgba(37, 211, 102, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(37, 211, 102, 0)' }
            }
          }}
        >
          <ShareIcon sx={{ mr: 0.8, fontSize: { xs: '1.2rem', md: '1.4rem' } }} />
          <Typography variant="button" sx={{ fontWeight: 850, fontSize: { xs: '0.78rem', md: '0.85rem' }, letterSpacing: 0.3, textTransform: 'none' }}>
            Share 📲
          </Typography>
        </Fab>
      </Tooltip>

      {/* Desktop / Fallback Share Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 850, color: '#1E293B', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 1 }}>
            🚀 Quick Share
          </Typography>
          <IconButton size="small" onClick={() => setOpenDialog(false)} sx={{ color: '#64748B' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderBottom: 'none', pt: 2, pb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontWeight: 500 }}>
            Share this vacancy / post instantly with your friends & study groups!
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 2.5 }}>
            {getShareLinks().map((item) => (
              <Button
                key={item.name}
                component="a"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={item.icon}
                sx={{
                  bgcolor: item.bg,
                  color: item.color,
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  py: 1.2,
                  px: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  border: `1px solid ${item.color}30`,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    bgcolor: `${item.color}20`,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {item.name}
              </Button>
            ))}
          </Box>

          {/* Copy Link Row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.2,
              bgcolor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0'
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#64748B',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '70%'
              }}
            >
              {typeof window !== 'undefined' ? window.location.href : ''}
            </Typography>
            <Button
              size="small"
              variant="contained"
              onClick={handleCopyLink}
              startIcon={<ContentCopyIcon sx={{ fontSize: '0.9rem' }} />}
              sx={{
                bgcolor: '#4F46E5',
                fontWeight: 800,
                fontSize: '0.72rem',
                borderRadius: '8px',
                textTransform: 'none',
                px: 1.5,
                '&:hover': { bgcolor: '#4338CA' }
              }}
            >
              Copy Link
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar feedback for Copy Link */}
      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopied(false)} severity="success" sx={{ width: '100%', fontWeight: 700, borderRadius: '10px' }}>
          ✅ Link copied to clipboard! Share it anywhere!
        </Alert>
      </Snackbar>
    </>
  );
}
