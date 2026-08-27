import React, { useState } from 'react';
import { Box, Typography, Button, Snackbar, Alert } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Telegram';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShareIcon from '@mui/icons-material/Share';

export default function PostInlineShare({ title, url }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = title || (typeof window !== 'undefined' ? document.title : 'Digital Home');

  const whatsappMessage = `📍 *${shareTitle}*\n\nयहाँ देखें संपूर्ण विवरण व Direct Link 👇\n${shareUrl}`;

  const handleWhatsAppShare = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
  };

  const handleTelegramShare = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`📍 ${shareTitle}`)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Box
      sx={{
        my: 2.5,
        p: 2,
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #F0FDF4 0%, #EFF6FF 100%)',
        border: '1.5px solid #BBF7D0',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 1.5,
        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.08)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ p: 0.8, bgcolor: '#25D366', color: 'white', borderRadius: '10px', display: 'flex' }}>
          <ShareIcon sx={{ fontSize: '1.2rem' }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 850, color: '#0F172A', fontSize: '0.88rem' }}>
            इस वैकैंसी / जानकारी को दोस्तों को भेजें!
          </Typography>
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, fontSize: '0.72rem' }}>
            Direct Share with 1-Click
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={handleWhatsAppShare}
          startIcon={<WhatsAppIcon sx={{ fontSize: '1.1rem' }} />}
          sx={{
            bgcolor: '#25D366',
            color: 'white',
            fontWeight: 850,
            fontSize: '0.78rem',
            borderRadius: '10px',
            textTransform: 'none',
            px: 1.8,
            py: 0.8,
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
            '&:hover': { bgcolor: '#1EBE5D' }
          }}
        >
          WhatsApp
        </Button>

        <Button
          variant="contained"
          onClick={handleTelegramShare}
          startIcon={<TelegramIcon sx={{ fontSize: '1.1rem' }} />}
          sx={{
            bgcolor: '#0088cc',
            color: 'white',
            fontWeight: 850,
            fontSize: '0.78rem',
            borderRadius: '10px',
            textTransform: 'none',
            px: 1.8,
            py: 0.8,
            boxShadow: '0 4px 12px rgba(0, 136, 204, 0.3)',
            '&:hover': { bgcolor: '#0077b5' }
          }}
        >
          Telegram
        </Button>

        <Button
          variant="outlined"
          onClick={handleCopyLink}
          startIcon={copied ? <CheckCircleIcon sx={{ fontSize: '1rem', color: '#16A34A' }} /> : <ContentCopyIcon sx={{ fontSize: '1rem' }} />}
          sx={{
            borderColor: copied ? '#16A34A' : '#CBD5E1',
            bgcolor: 'white',
            color: copied ? '#16A34A' : '#334155',
            fontWeight: 800,
            fontSize: '0.78rem',
            borderRadius: '10px',
            textTransform: 'none',
            px: 1.6,
            py: 0.8,
            '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' }
          }}
        >
          {copied ? 'Copied! ✅' : 'Copy Link'}
        </Button>
      </Box>

      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopied(false)} severity="success" sx={{ width: '100%', fontWeight: 800, borderRadius: '10px' }}>
          ✅ पोस्ट की direct link कॉपी हो गई!
        </Alert>
      </Snackbar>
    </Box>
  );
}
