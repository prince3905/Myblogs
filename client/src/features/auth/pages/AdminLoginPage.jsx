import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Container, Paper, TextField, Button, Typography, Alert, 
  Box, CircularProgress, Avatar 
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import Seo from '../../blog/components/Seo';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Seo title="Admin Login | Digital Home" description="Secure admin login for Digital Home management." />
      
      <Container maxWidth="sm">
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box 
              component={Link} 
              to="/" 
              title="Digital Home - Go to Home / Dashboard"
              sx={{ display: 'inline-flex', alignItems: 'center', mb: 2, textDecoration: 'none' }}
            >
              <Box
                component="img"
                src="/logo.webp"
                alt="Digital Home Logo"
                sx={{ height: 44, width: 'auto', aspectRatio: '66/34' }}
              />
            </Box>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2, mb: 0.5 }}>
              Digital Home Admin
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Sign in to manage your portal and jobs
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              sx={{ mb: 3 }}
              variant="outlined"
            />
            
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              sx={{ mb: 3 }}
              variant="outlined"
            />

            {error ? (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            ) : null}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                py: 1.5, 
                fontWeight: 700,
                fontSize: '1.1rem',
                borderRadius: 2,
                mb: 3,
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>

            <Typography 
              variant="caption" 
              color="text.secondary" 
              align="center" 
              sx={{ display: 'block', mb: 2 }}
            >
              Default credentials are configured in the server's .env file
            </Typography>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                component={Link}
                to="/"
                sx={{ textTransform: 'none', color: 'primary.main', fontWeight: 600, fontSize: '0.85rem' }}
              >
                ← Back to Main Website / Dashboard
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
