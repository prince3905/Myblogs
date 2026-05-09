import { Link, NavLink } from 'react-router-dom';
import { Button, Container, Box, Typography, useTheme, Drawer, List, ListItem, ListItemButton, ListItemText, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';

import NewsletterWidget from '../../../components/NewsletterWidget';
import DarkModeToggle from '../../../components/DarkModeToggle';
import BreadcrumbsNav from '../../../components/Breadcrumbs';


export default function Layout({ children }) {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Insights', path: '/blog' },
    { label: 'Admin', path: '/admin' },
  ];

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
              ? 'rgba(17, 24, 39, 0.75)'
              : 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(14px)',
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.6)'
              : 'rgba(255, 255, 255, 0.6)',
            borderRadius: '9999px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
            px: { xs: 1.5, md: 3 },
            py: 0.5,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: { xs: 'space-between', md: 'center' }, alignItems: 'center' }}>
            {/* Mobile: Hamburger */}
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: 'none' }, color: theme.palette.mode === 'dark' ? '#F9FAFB' : '#111827' }}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo */}
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: '1.1rem', md: '1.75rem' },
                color: theme.palette.mode === 'dark' ? '#F9FAFB' : '#111111',
                letterSpacing: '-0.02em',
                position: { xs: 'absolute', md: 'static' },
                left: '50%',
                transform: { xs: 'translateX(-50%)', md: 'none' },
              }}
            >
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Digital Home</Link>
            </Typography>
            
            {/* Desktop Nav items */}
             <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center', ml: 4 }}>
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  component={NavLink}
                  to={item.path}
                  sx={{ 
                    color: theme.palette.mode === 'dark' ? '#E5E7EB' : '#111827',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    px: 2,
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
                  {item.label}
                </Button>
              ))}
             </Box>
            
            {/* Dark mode toggle */}
            <Box>
              <DarkModeToggle />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: { bgcolor: theme.palette.mode === 'dark' ? '#111827' : '#ffffff', minWidth: 200 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: theme.palette.mode === 'dark' ? '#F9FAFB' : '#111111' }}>
            Digital Home
          </Typography>
        </Box>
        <List>
          {navItems.map((item) => (
            <ListItem key={item.label} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                sx={{ color: theme.palette.mode === 'dark' ? '#E5E7EB' : '#111827' }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      
      {/* Spacer for fixed navbar */}
      <Box sx={{ height: { xs: 72, md: 96 } }} />
      
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


    </Box>
  );
}
