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
          background:
            theme.palette.mode === 'dark'
              ? 'rgba(10, 10, 10, 0.88)'
              : 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              minHeight: 64,
              px: { xs: 0, md: 0 },
            }}
          >
            <Typography
              variant="h5"
              sx={{
                flexGrow: 1,
                fontWeight: 800,
                color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.primary,
                letterSpacing: '-0.4px',
              }}
            >
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Inkspire</Link>
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
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
          bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#fafafa',
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
