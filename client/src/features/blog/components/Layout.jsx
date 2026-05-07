import { Link, NavLink } from 'react-router-dom';
import { AppBar, Toolbar, Button, Container, Box, Typography, useTheme } from '@mui/material';
import NewsletterWidget from '../../../components/NewsletterWidget';
import DarkModeToggle from '../../../components/DarkModeToggle';
import BreadcrumbsNav from '../../../components/Breadcrumbs';

export default function Layout({ children }) {
  const theme = useTheme();
  
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          background: theme.palette.mode === 'dark' 
            ? 'rgba(18, 18, 18, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Typography 
              variant="h5" 
              sx={{ 
                flexGrow: 1, 
                fontWeight: 800,
                background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
              }}
            >
              <Link to="/" style={{ textDecoration: 'none' }}>Inkspire</Link>
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button 
                component={NavLink} 
                to="/" 
                sx={{ 
                  color: 'text.primary',
                  fontWeight: 600,
                  '&.active': { color: 'primary.main' }
                }}
              >
                Home
              </Button>
              <Button 
                component={NavLink} 
                to="/blog" 
                sx={{ 
                  color: 'text.primary',
                  fontWeight: 600,
                  '&.active': { color: 'primary.main' }
                }}
              >
                Blog
              </Button>
              <Button 
                component={NavLink} 
                to="/admin" 
                sx={{ 
                  color: 'text.primary',
                  fontWeight: 600,
                  '&.active': { color: 'primary.main' }
                }}
              >
                Admin
              </Button>
              <DarkModeToggle />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
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
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="lg">
          <NewsletterWidget />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Built with MERN Stack • Modern Blogging Platform
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
