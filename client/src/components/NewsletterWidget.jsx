import { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, Paper } from '@mui/material';
import { request } from '../shared/lib/api';

export default function NewsletterWidget() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await request('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setMessage('Subscribed successfully!');
      setEmail('');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: { xs: 3, md: 6 }, 
        textAlign: 'center',
        borderRadius: 4,
        background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
        color: 'white',
        mb: 4,
      }}
    >
      <Typography 
        variant="h4" 
        sx={{ fontWeight: 800, mb: 2, color: 'white' }}
      >
        Stay Inspired
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ mb: 4, opacity: 0.9, maxWidth: 500, mx: 'auto' }}
      >
        Get the latest posts and insights delivered directly to your inbox. No spam, ever.
      </Typography>
      
      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        sx={{ 
          display: 'flex', 
          gap: 1, 
          justifyContent: 'center', 
          flexWrap: 'wrap',
          maxWidth: 500,
          mx: 'auto',
        }}
      >
        <TextField
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          size="large"
          sx={{
            flex: 1,
            minWidth: 250,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.95)',
              borderRadius: 2,
              '& fieldset': { border: 'none' },
            }
          }}
        />
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading}
          size="large"
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            fontWeight: 700,
            px: 4,
            borderRadius: 2,
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.9)',
            }
          }}
        >
          {loading ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </Box>
      
      {message && (
        <Alert 
          severity={message.includes('success') ? 'success' : 'error'} 
          sx={{ 
            mt: 3, 
            maxWidth: 400, 
            mx: 'auto',
            borderRadius: 2,
          }}
        >
          {message}
        </Alert>
      )}
      
      <Typography variant="caption" sx={{ mt: 2, display: 'block', opacity: 0.7 }}>
        Join 500+ developers who already subscribed
      </Typography>
    </Paper>
  );
}
