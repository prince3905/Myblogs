import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Button,
  Container,
  Box,
  Typography,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState, useEffect } from 'react';

import DarkModeToggle from '../../../components/DarkModeToggle';
import BreadcrumbsNav from '../../../components/Breadcrumbs';
import TelegramStickyBanner from '../../../components/TelegramStickyBanner';
import FloatingQuickShare, { ShareModalProvider } from '../../../components/FloatingQuickShare';
import PushNotificationModal from './PushNotificationModal';
import GlobalLanguagePicker from '../../../components/GlobalLanguagePicker';
import SubtleLanguagePill from '../../../components/SubtleLanguagePill';
import { useAuth } from '../../auth/context/AuthContext';
import { useVisitorCountry } from '../../../shared/lib/geo';

function useDeferredMount(delay = 2500) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    let timer = setTimeout(() => setMounted(true), delay);
    const onUserInteraction = () => {
      setMounted(true);
      window.removeEventListener('scroll', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
      window.removeEventListener('mousemove', onUserInteraction);
      clearTimeout(timer);
    };
    window.addEventListener('scroll', onUserInteraction, { passive: true, once: true });
    window.addEventListener('touchstart', onUserInteraction, { passive: true, once: true });
    window.addEventListener('mousemove', onUserInteraction, { passive: true, once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
      window.removeEventListener('mousemove', onUserInteraction);
    };
  }, [delay]);
  return mounted;
}

export default function Layout({ children }) {
  const theme = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catAnchor, setCatAnchor] = useState(null);
  const isDeferredMounted = useDeferredMount(2500);

  useEffect(() => {
    let triggered = false;
    function loadPush() {
      if (triggered) return;
      triggered = true;
      cleanup();
      import('../../../shared/lib/onesignal').then(m => m.initOneSignal()).catch(() => {});
    }

    const events = ['touchstart', 'scroll', 'click'];
    events.forEach(evt => window.addEventListener(evt, loadPush, { once: true, passive: true }));

    function cleanup() {
      events.forEach(evt => window.removeEventListener(evt, loadPush));
    }

    return cleanup;
  }, []);

  // Country awareness for navigation (India vs Global Visitors)
  const { userCountry, isIndia, countryMeta } = useVisitorCountry();

  // Smart Categories dropdown items (Pure public categories, auth shifted to sidebar)
  const categories = isIndia ? [
    { label: '🏛️ Sarkari Jobs (सभी भर्तियां)', path: '/india/sarkari-jobs' },
    { label: '🎫 Admit Cards (प्रवेश पत्र)', path: '/india/sarkari-jobs?search=admit+card' },
    { label: '📊 Sarkari Results (सरकारी रिजल्ट)', path: '/india/sarkari-jobs?search=result' },
    { label: '🌐 Global Gov Jobs (195 Countries)', path: '/global-jobs' },
    { label: '🇮🇳 भारत समसामयिकी (Current Affairs)', path: '/india/current-affairs' },
    { label: '🎯 डेली सरकारी क्विज (Daily Quiz)', path: '/india/daily-quiz' },
    { label: '📰 Global News & World Affairs', path: '/global-news' },
    { label: '📝 All Articles & Blog', path: '/blog' },
  ] : [
    { label: `${countryMeta.flag} ${countryMeta.name} Gov Vacancies`, path: `/global-jobs?country=${userCountry}` },
    { label: '🌐 Global Gov Jobs (195 Countries)', path: '/global-jobs' },
    { label: '🇺🇳 UN, WHO & World Bank Careers', path: '/global-jobs?continent=Multilateral' },
    { label: '🕌 Gulf & MENA Government Jobs', path: '/global-jobs?continent=Asia' },
    { label: '🇪🇺 Europe & UK Civil Services', path: '/global-jobs?continent=Europe' },
    { label: '🌎 Americas & Canada Federal Jobs', path: '/global-jobs?continent=Americas' },
    { label: '📰 Global News & International Policy', path: '/global-news' },
    { label: '📝 All Articles & Blog', path: '/blog' },
  ];

  // Primary top horizontal navbar links (Focused on brand and main categories)
  const navItems = isIndia ? [
    { label: '🏛️ Sarkari Jobs', path: '/india/sarkari-jobs' },
    { label: '🎫 Admit Card', path: '/india/sarkari-jobs?search=admit+card' },
    { label: '📊 Results', path: '/india/sarkari-jobs?search=result' },
    { label: '🌐 Global Jobs', path: '/global-jobs' },
  ] : [
    { label: `${countryMeta.flag} ${countryMeta.name} Jobs`, path: `/global-jobs?country=${userCountry}` },
    { label: '🌐 195 Countries', path: '/global-jobs' },
    { label: '🇺🇳 UN Careers', path: '/global-jobs?continent=Multilateral' },
    { label: '📰 Global News', path: '/global-news' },
  ];

  return (
    <ShareModalProvider>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', pb: { xs: 8, sm: 9 } }}>
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
              width: { xs: 'calc(100% - 20px)', md: 'fit-content' },
              maxWidth: '1200px',
              px: { xs: 1.5, md: 2.5 },
              py: 0.5,
              mx: 'auto',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', width: '100%', gap: { xs: 1, md: 2 } }}>

              {/* Mobile Hamburger Toggle (Left on mobile) */}
              <IconButton
                onClick={() => setMobileOpen(true)}
                size="small"
                aria-label="open navigation menu"
                sx={{ display: { md: 'none' }, color: theme.palette.mode === 'dark' ? '#F9FAFB' : '#111827', flexShrink: 0 }}
              >
                <MenuIcon />
              </IconButton>

              {/* Brand Logo */}
              <Box 
                component={Link} 
                to="/" 
                title="Digital Home - Home & Dashboard"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  textDecoration: 'none',
                  flexShrink: 0
                }}
              >
                <Box 
                  component="img"
                  src="/logo.webp"
                  alt="Digital Home Logo"
                  width="66"
                  height="34"
                  sx={{ 
                    height: { xs: 28, md: 34 }, 
                    width: 'auto',
                    aspectRatio: '66/34',
                    display: 'block',
                    flexShrink: 0
                  }}
                />
              </Box>
              
              {/* Desktop Nav items: Categories + Main Categories */}
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
                  slotProps={{ paper: { sx: { borderRadius: 3, mt: 1, minWidth: 200 } } }}
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
              
              {/* Right Controls: Search + Dark Mode + Desktop Hamburger Menu Toggle */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 0.8 } }}>
                <IconButton
                  component={Link}
                  to="/search"
                  aria-label="search"
                  sx={{ color: theme.palette.mode === 'dark' ? '#E5E7EB' : '#6B7280', p: { xs: 0.75, md: 1 } }}
                >
                  <SearchIcon sx={{ fontSize: { xs: '1.2rem', md: '1.4rem' } }} />
                </IconButton>
                <DarkModeToggle />
                <IconButton
                  onClick={() => setMobileOpen(true)}
                  size="small"
                  aria-label="open side navigation menu"
                  sx={{
                    display: { xs: 'none', md: 'inline-flex' },
                    color: theme.palette.mode === 'dark' ? '#F9FAFB' : '#111827',
                    p: 0.8,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    borderRadius: '9999px',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)'
                    }
                  }}
                >
                  <MenuIcon sx={{ fontSize: '1.35rem' }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Side Navigation Drawer (Responsive Slide-in Menu on Desktop & Mobile) */}
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{
            sx: {
              bgcolor: theme.palette.mode === 'dark' ? '#111827' : '#ffffff',
              minWidth: { xs: 280, sm: 320 },
              maxWidth: 360,
              width: '85%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto' }}>
            {/* Drawer Header: Brand + Close Button */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box 
                component={Link} 
                to="/" 
                onClick={() => setMobileOpen(false)}
                title="Digital Home - Dashboard & Home"
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}
              >
                <Box 
                  component="img"
                  src="/logo.webp"
                  alt="Digital Home Logo"
                  sx={{ 
                    height: 32, 
                    width: 'auto',
                    aspectRatio: '66/34',
                    display: 'block',
                    flexShrink: 0
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.mode === 'dark' ? '#F9FAFB' : '#111111' }}>
                  Digital Home
                </Typography>
              </Box>
              <IconButton onClick={() => setMobileOpen(false)} size="small" aria-label="close menu">
                <CloseIcon sx={{ fontSize: '1.25rem' }} />
              </IconButton>
            </Box>

            {/* Authenticated User/Admin Profile Badge */}
            {user && (
              <Box sx={{
                m: 2,
                p: 2,
                borderRadius: '14px',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#6366F1', width: 42, height: 42, fontWeight: 700, fontSize: '1.1rem' }}>
                    {(user?.name?.[0] || user?.email?.[0] || 'A').toUpperCase()}
                  </Avatar>
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: theme.palette.mode === 'dark' ? '#F9FAFB' : '#111827', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {user?.name || user?.email?.split('@')[0] || 'Administrator'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6366F1', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      🛡️ {user?.role ? user.role.toUpperCase() : 'VERIFIED ADMIN'}
                    </Typography>
                  </Box>
                </Box>
                
                <Button
                  component={Link}
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  variant="contained"
                  fullWidth
                  size="small"
                  startIcon={<AdminPanelSettingsIcon sx={{ fontSize: '1rem !important' }} />}
                  sx={{
                    bgcolor: '#6366F1',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontWeight: 750,
                    fontSize: '0.82rem',
                    py: 0.75,
                    textTransform: 'none',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
                    '&:hover': { bgcolor: '#4F46E5' }
                  }}
                >
                  Admin Dashboard
                </Button>
              </Box>
            )}

            {/* Navigation Portals List */}
            <List sx={{ px: 1, py: 1 }}>
              <ListItem disablePadding>
                <ListItemText 
                  primary="Primary Portals" 
                  sx={{ px: 1.5, pt: 0.5, '& .MuiListItemText-primary': { fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' } }} 
                />
              </ListItem>
              
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to="/india/sarkari-jobs"
                  onClick={() => setMobileOpen(false)}
                  sx={{ borderRadius: '10px', mb: 0.3 }}
                >
                  <ListItemText primary="🏛️ Sarkari Jobs 2026" primaryTypographyProps={{ fontWeight: 650, fontSize: '0.88rem' }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to="/india/sarkari-jobs?search=admit+card"
                  onClick={() => setMobileOpen(false)}
                  sx={{ borderRadius: '10px', mb: 0.3 }}
                >
                  <ListItemText primary="🎫 Admit Cards (प्रवेश पत्र)" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.88rem' }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to="/india/sarkari-jobs?search=result"
                  onClick={() => setMobileOpen(false)}
                  sx={{ borderRadius: '10px', mb: 0.3 }}
                >
                  <ListItemText primary="📊 Sarkari Results (सरकारी रिजल्ट)" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.88rem' }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to="/global-jobs"
                  onClick={() => setMobileOpen(false)}
                  sx={{ borderRadius: '10px', mb: 0.3 }}
                >
                  <ListItemText primary="🌐 Global Gov Jobs (195 Countries)" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.88rem' }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to="/global-news"
                  onClick={() => setMobileOpen(false)}
                  sx={{ borderRadius: '10px', mb: 0.3 }}
                >
                  <ListItemText primary="📰 Global News & Policy" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.88rem' }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to="/india/current-affairs"
                  onClick={() => setMobileOpen(false)}
                  sx={{ borderRadius: '10px', mb: 0.3 }}
                >
                  <ListItemText primary="🇮🇳 भारत समसामयिकी (Current Affairs)" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.88rem' }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to="/india/daily-quiz"
                  onClick={() => setMobileOpen(false)}
                  sx={{ borderRadius: '10px', mb: 0.3 }}
                >
                  <ListItemText primary="🎯 डेली सरकारी क्विज (Daily Quiz)" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.88rem' }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to="/blog"
                  onClick={() => setMobileOpen(false)}
                  sx={{ borderRadius: '10px', mb: 0.3 }}
                >
                  <ListItemText primary="📝 Blog & Career Guides" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.88rem' }} />
                </ListItemButton>
              </ListItem>
            </List>

            {/* Regional Language / Settings in Sidebar */}
            <Box sx={{ px: 2, py: 2, borderTop: '1px solid', borderColor: 'divider', mt: 'auto' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
                Language / भाषा:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <SubtleLanguagePill sx={{ width: 'fit-content' }} />
                <Box sx={{ mt: 0.5 }}>
                  <GlobalLanguagePicker isMobile={true} />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Drawer Bottom Auth Section: Logout for Admin, discreet Login for Unauthenticated */}
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: theme.palette.mode === 'dark' ? '#0d131f' : '#f8fafc' }}>
            {user ? (
              <Button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<LogoutIcon />}
                sx={{
                  color: '#EF4444',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  borderRadius: '10px',
                  py: 0.8,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#DC2626',
                    bgcolor: 'rgba(239, 68, 68, 0.08)'
                  }
                }}
              >
                Logout
              </Button>
            ) : (
              <ListItemButton
                component={Link}
                to="/admin/login"
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: '10px',
                  color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                  py: 0.8,
                  px: 1.5,
                  justifyContent: 'center',
                  '&:hover': {
                    color: '#6366F1',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.06)'
                  }
                }}
              >
                <LockOutlinedIcon sx={{ fontSize: '0.95rem', mr: 1, opacity: 0.7 }} />
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Admin Login
                </Typography>
              </ListItemButton>
            )}
          </Box>
        </Drawer>
        
        {/* Spacer for sticky navbar */}
        <Box sx={{ height: { xs: 12, md: 16 } }} />
        
        <BreadcrumbsNav />
        
        <Container component="main" maxWidth="lg" sx={{ flex: 1, py: { xs: 1.5, md: 2 } }}>
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
            <Box 
              component={Link} 
              to="/" 
              title="Digital Home - Go to Home / Dashboard"
              sx={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 1.5, 
                textDecoration: 'none', 
                mb: 2,
                p: 0.5,
                borderRadius: '8px',
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 0.85 }
              }}
            >
              <Box 
                component="img"
                src="/logo.webp"
                alt="Digital Home Logo"
                sx={{ 
                  height: 30, 
                  width: 'auto',
                  aspectRatio: '66/34',
                  display: 'block'
                }}
              />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.mode === 'dark' ? '#F9FAFB' : '#111827' }}>
                Digital Home
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, justifyContent: 'center', mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="https://t.me/SarkariJob_DigitalHome" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>✈️ Telegram Channel</a>
              <Link to="/privacy" style={{ color: '#4B5563', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}>Privacy Policy</Link>
              <Link to="/terms" style={{ color: '#4B5563', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}>Terms & Disclaimer</Link>
              <Link to="/contact" style={{ color: '#4B5563', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}>Contact</Link>
              <Link to="/about" style={{ color: '#4B5563', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}>About</Link>
              {user ? (
                <>
                  <Link 
                    to="/admin" 
                    style={{ 
                      color: '#6366F1', 
                      fontSize: '0.85rem', 
                      fontWeight: 600, 
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    🛡️ Admin Panel
                  </Link>
                  <Box
                    component="button"
                    onClick={logout}
                    sx={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#EF4444',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      p: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    🚪 Logout
                  </Box>
                </>
              ) : (
                <Link 
                  to="/admin/login" 
                  style={{ 
                    color: '#6B7280', 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🔐 Admin Login
                </Link>
              )}
            </Box>

            {/* Subtle Regional Language Switcher Pill in Footer */}
            <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                भाषा चुनें / Language:
              </Typography>
              <SubtleLanguagePill />
              <GlobalLanguagePicker />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 500 }}>
              Official Portal • Global Government Vacancies & Verified Public Gazettes
            </Typography>
          </Container>
        </Box>

        {/* Real-time Push Notification Centered Modal (Suppressed on job hubs for zero popup interference) */}
        {!location.pathname.startsWith('/global-jobs') && 
         !location.pathname.startsWith('/india/sarkari-jobs') && 
         !location.pathname.startsWith('/job-alerts') && 
         !location.pathname.startsWith('/live-alerts') && 
         <PushNotificationModal />}

        {/* Deferred Floating Widgets (Suppressed on job hubs for zero layout/touch collision) */}
        {isDeferredMounted && 
         !location.pathname.startsWith('/global') && 
         !location.pathname.startsWith('/india/sarkari-jobs') && 
         !location.pathname.startsWith('/job-alerts') && 
         !location.pathname.startsWith('/live-alerts') && (
          <>
            <TelegramStickyBanner />
            <FloatingQuickShare />
          </>
        )}
      </Box>
    </ShareModalProvider>
  );
}
