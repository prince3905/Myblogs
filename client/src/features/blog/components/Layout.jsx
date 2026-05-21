import { Link, NavLink } from 'react-router-dom';
import { Button, Container, Box, Typography, useTheme, Drawer, List, ListItem, ListItemButton, ListItemText, IconButton, Avatar, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';

import NewsletterWidget from '../../../components/NewsletterWidget';
import DarkModeToggle from '../../../components/DarkModeToggle';
import BreadcrumbsNav from '../../../components/Breadcrumbs';


export default function Layout({ children }) {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catAnchor, setCatAnchor] = useState(null);

  const categories = [
    { label: 'Sarkari Jobs & Exams', path: '/category/Sarkari Jobs & Exams' },
    { label: 'Health & Wellness', path: '/category/Health & Wellness' },
    { label: 'Tech & Tutorials', path: '/category/Tech & Tutorials' },
    { label: 'AI & Web Tools', path: '/category/AI & Web Tools' },
    { label: 'News & Trends', path: '/category/News & Trends' },
    { label: 'Finance & Business', path: '/category/Finance & Business' },
  ];

  const navItems = [
    { label: 'Blog', path: '/blog' },
    { label: 'Games', path: '/games' },
    { label: 'Tools', path: '/tools' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Admin', path: '/admin' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Floating pill-shaped navbar */}
      <Box
        sx={{
          position: 'sticky',
          top: 16,
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
            width: { xs: '100%', md: '940px' },
            maxWidth: '940px',
            px: { xs: 1, md: 2 },
            py: 0.5,
            mx: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>


            {/* Mobile: Hamburger */}
            <IconButton
              onClick={() => setMobileOpen(true)}
              size="small"
              sx={{ display: { md: 'none' }, color: theme.palette.mode === 'dark' ? '#F9FAFB' : '#111827' }}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo */}
            <Box component={Link} to="/" sx={{ display: { xs: 'flex', md: 'flex' }, alignItems: 'center', gap: 0.5, textDecoration: 'none' }}>
              <Avatar
                sx={{
                  width: 26,
                  height: 26,
                  bgcolor: 'primary.main',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'white',
                }}
              >
                D
              </Avatar>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: { xs: '0.85rem', md: '1rem' },
                  color: theme.palette.mode === 'dark' ? '#F9FAFB' : '#111111',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                Digital Home
              </Typography>
            </Box>
            
            {/* Desktop Nav items */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.3, alignItems: 'center', ml: 1 }}>
                
                {/* Categories Dropdown */}
                <Button
                  onClick={(e) => setCatAnchor(e.currentTarget)}
                  sx={{ 
                    color: theme.palette.mode === 'dark' ? '#E5E7EB' : '#111827',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    px: 1.2,
                    py: 0.3,
                    borderRadius: '9999px',
                    minWidth: 'auto',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                  endIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
                >
                  Categories
                </Button>
                <Menu
                  anchorEl={catAnchor}
                  open={Boolean(catAnchor)}
                  onClose={() => setCatAnchor(null)}
                  transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                  slotProps={{ paper: { sx: { borderRadius: 3, mt: 1, minWidth: 160 } } }}
                >
                  {categories.map((cat) => (
                    <MenuItem
                      key={cat.label}
                      component={Link}
                      to={cat.path}
                      onClick={() => setCatAnchor(null)}
                      sx={{ fontWeight: 500, fontSize: '0.9rem' }}
                    >
                      {cat.label}
                    </MenuItem>
                  ))}
                </Menu>

               {navItems.map((item) => (
                  <Button
                    key={item.label}
                    component={NavLink}
                    to={item.path}
                    sx={{ 
                      color: theme.palette.mode === 'dark' ? '#E5E7EB' : '#111827',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      px: 1.2,
                      py: 0.3,
                      borderRadius: '9999px',
                      minWidth: 'auto',
                      whiteSpace: 'nowrap',
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
            
            {/* Search + Dark mode toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, md: 0.5 } }}>
              <IconButton
                component={Link}
                to="/search"
                sx={{ color: theme.palette.mode === 'dark' ? '#E5E7EB' : '#6B7280', p: { xs: 0.75, md: 1 } }}
              >
                <SearchIcon sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }} />
              </IconButton>
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
        <Box component={Link} to="/" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem', fontWeight: 800, color: 'white' }}>D</Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#F9FAFB' : '#111111' }}>
            Digital Home
          </Typography>
        </Box>
        <List>
          <ListItem disablePadding>
            <ListItemText primary="Categories" sx={{ px: 2, pt: 1, '& .MuiListItemText-primary': { fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' } }} />
          </ListItem>
          {categories.map((cat) => (
            <ListItem key={cat.label} disablePadding>
              <ListItemButton
                component={Link}
                to={cat.path}
                onClick={() => setMobileOpen(false)}
                sx={{ pl: 3, color: theme.palette.mode === 'dark' ? '#E5E7EB' : '#111827' }}
              >
                <ListItemText primary={cat.label} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding>
            <ListItemText primary="Pages" sx={{ px: 2, pt: 1.5, '& .MuiListItemText-primary': { fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' } }} />
          </ListItem>
          {navItems.map((item) => (
            <ListItem key={item.label} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                sx={{ pl: 3, color: theme.palette.mode === 'dark' ? '#E5E7EB' : '#111827' }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      
      {/* Spacer for sticky navbar */}
      <Box sx={{ height: { xs: 72, md: 72 } }} />
      
      <BreadcrumbsNav />
      
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 1.5, md: 2 } }}>
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
          <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
            <Link to="/privacy" style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}>Terms & Disclaimer</Link>
            <Link to="/contact" style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}>Contact</Link>
            <Link to="/about" style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}>About</Link>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 500 }}>
            Built with MERN Stack • Modern Blogging Platform
          </Typography>
        </Container>
      </Box>


    </Box>
  );
}
