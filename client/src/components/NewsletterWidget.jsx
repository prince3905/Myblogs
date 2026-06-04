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
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography 
        variant="h4" 
        sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}
      >
        Stay Inspired
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ mb: 4, color: 'text.secondary', maxWidth: 500, mx: 'auto' }}
      >
        Get the latest posts and insights delivered directly to your inbox. No spam, ever.
      </Typography>
      
      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        sx={{ 
          display: 'flex', 
          gap: 2, 
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
            minWidth: { xs: '100%', sm: 250 },
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
              borderRadius: 2,
              '& fieldset': { borderColor: 'divider' },
            }
          }}
        />
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading}
          size="large"
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            fontWeight: 700,
            px: 4,
            borderRadius: 2,
            '&:hover': {
              bgcolor: 'primary.dark',
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
      
      <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
        Join 500+ smart readers who already subscribed
      </Typography>
    </Paper>
  );
}
