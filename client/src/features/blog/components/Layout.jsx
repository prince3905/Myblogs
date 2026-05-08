import { Link, NavLink } from 'react-router-dom';
import { AppBar, Toolbar, Button, Container, Box, Typography, useTheme, TextField, IconButton, Paper, Chip, Stack } from '@mui/material';
import NewsletterWidget from '../../../components/NewsletterWidget';
import DarkModeToggle from '../../../components/DarkModeToggle';
import BreadcrumbsNav from '../../../components/Breadcrumbs';
import Search from '@mui/icons-material/Search';
import ArrowForward from '@mui/icons-material/ArrowForward';

export default function Layout({ children }) {
  const theme = useTheme();
  
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Floating pill-shaped navbar */}
      <Box
        sx={{
          position: 'sticky',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: 'calc(100% - 32px)', md: '800px' },
          zIndex: 1100,
        }}
      >
        <Box
          sx={{
            background: theme.palette.mode === 'dark' 
              ? 'rgba(17, 24, 39, 0.75)'  // Dark: #111827 with opacity
              : 'rgba(255, 255, 255, 0.75)', // Light: white with opacity
            backdropFilter: 'blur(14px)',
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.6)'
              : 'rgba(255, 255, 255, 0.6)',
            borderRadius: '9999px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
            px: { xs: 2, md: 3 },
            py: 1,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Left: Logo */}
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: '1.25rem', md: '1.75rem' },
                color: theme.palette.mode === 'dark' ? '#F9FAFB' : '#111111',
                letterSpacing: '-0.02em',
                ml: 1,
              }}
            >
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Digital Home</Link>
            </Typography>
            
            {/* Center: Nav items */}
             <Box sx={{ display: 'flex', gap: { xs: 0.5, md: 1 }, alignItems: 'center' }}>
               {['Home', 'Insights', 'Admin'].map((item) => (
                 <Button 
                   key={item}
                   component={NavLink} 
                   to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                   sx={{ 
                     color: theme.palette.mode === 'dark' ? '#E5E7EB' : '#111827',
                     fontWeight: 500,
                     fontSize: { xs: '0.8rem', md: '0.875rem' },
                     px: { xs: 1.5, md: 2 },
                     py: 0.5,
                     borderRadius: '9999px',
                     minWidth: 'auto',
                     '&.active': { 
                       color: theme.palette.primary.main,
                       bgcolor: theme.palette.mode === 'dark' 
                         ? 'rgba(99, 102, 241, 0.2)' 
                         : 'rgba(99, 102, 241, 0.08)',
                     },
                     '&:hover': {
                       bgcolor: theme.palette.mode === 'dark' 
                         ? 'rgba(255, 255, 255, 0.1)' 
                         : 'rgba(0, 0, 0, 0.04)',
                     }
                   }}
                 >
                   {item}
                 </Button>
               ))}
             </Box>
            
            {/* Right: Dark mode toggle */}
            <Box sx={{ mr: 1 }}>
              <DarkModeToggle />
            </Box>
          </Box>
        </Box>
      </Box>
      
      {/* Spacer for fixed navbar */}
      <Box sx={{ height: { xs: 80, md: 96 } }} />
      
      <BreadcrumbsNav />
      
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 2, md: 4 } }}>
        {children}
      </Container>
      
      <Box 
        component="footer" 
        sx={{ 
          py: 6, 
          textAlign: 'center', 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#F6F4F3',
        }}
      >
        <Container maxWidth="lg">
          <NewsletterWidget />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, fontWeight: 500 }}>
            Built with MERN Stack • Modern Blogging Platform
          </Typography>
        </Container>
      </Box>

      {/* Floating AI Search Bar */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1200,
          width: { xs: '90%', md: '700px' },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: '9999px',
            bgcolor: '#050816',
            boxShadow: '0 15px 40px rgba(0,0,0,0.25)',
            height: 72,
            display: 'flex',
            alignItems: 'center',
            px: 3,
            gap: 2,
          }}
        >
          <Search sx={{ color: '#9CA3AF', fontSize: 24 }} />
          <TextField
            fullWidth
            placeholder="Ask the agent what you need help with…"
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                color: '#E5E7EB',
                fontSize: '0.95rem',
                '&::placeholder': { color: '#9CA3AF' },
              }
            }}
            sx={{ flex: 1 }}
          />
          <IconButton
            sx={{
              bgcolor: '#4F46E5',
              color: 'white',
              width: 48,
              height: 48,
              borderRadius: '50%',
              '&:hover': { bgcolor: '#4338CA' },
            }}
          >
            <ArrowForward />
          </IconButton>
        </Paper>
        
        {/* AI Suggestion Chips */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: 2,
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {['AI Strategy', 'Web Development', 'UI/UX Design', 'SEO Optimization'].map((chip) => (
            <Chip
              key={chip}
              label={chip}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.12)',
                color: '#E5E7EB',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 500,
                px: 1,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              }}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
