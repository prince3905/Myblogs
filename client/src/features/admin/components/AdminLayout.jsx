import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, BottomNavigation, BottomNavigationAction, Paper,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, Article as ArticleIcon,
  Forum as ForumIcon, MonetizationOn as AdIcon,
  TravelExplore as KeywordIcon, NotificationsActive as AlertsIcon,
  Settings as SettingsIcon, Slideshow as StoriesIcon,
  Terminal as LogsIcon
} from '@mui/icons-material';

const nav = [
  { label: 'Dashboard', path: '/admin', icon: <DashboardIcon /> },
  { label: 'Posts', path: '/admin/posts', icon: <ArticleIcon /> },
  { label: 'Web Stories', path: '/admin/web-stories', icon: <StoriesIcon /> },
  { label: 'Automation Logs', path: '/admin/automation-logs', icon: <LogsIcon /> },
  { label: 'Keywords', path: '/admin/keywords', icon: <KeywordIcon /> },
  { label: 'Live Alerts', path: '/admin/live-alerts', icon: <AlertsIcon /> },
  { label: 'Comments', path: '/admin/comments', icon: <ForumIcon /> },
  { label: 'Ads', path: '/admin/ads', icon: <AdIcon /> },
  { label: 'Settings', path: '/admin/settings', icon: <SettingsIcon /> },
];

export default function AdminLayout() {
  const location = useLocation();

  const activeIndex = nav.findIndex((item) => {
    if (item.path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(item.path);
  });

  return (
    <Box sx={{ height: '100vh', display: 'flex', bgcolor: '#F6F4F3' }}>
      {/* Desktop Sidebar */}
      <Box
        sx={{
          width: 240,
          bgcolor: '#111827',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          flexShrink: 0,
          color: '#fff',
          p: 3,
        }}
      >
        <Box 
          component={Link} 
          to="/" 
          title="Digital Home - Go to Main Website / Dashboard"
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', mb: 3 }}
        >
          <Box
            component="img"
            src="/logo.webp"
            alt="Digital Home Logo"
            sx={{ height: 32, width: 'auto', aspectRatio: '66/34' }}
          />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', lineHeight: 1.1 }}>
              Digital Home
            </Typography>
            <Typography sx={{ color: '#38BDF8', fontSize: '0.72rem', fontWeight: 600 }}>
              Admin Dashboard
            </Typography>
          </Box>
        </Box>

        {nav.map((item) => {
          const isActive = item.path === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(item.path);
          return (
            <Button
              key={item.label}
              component={Link}
              to={item.path}
              fullWidth
              sx={{
                justifyContent: 'flex-start',
                px: 2,
                py: 1,
                mb: 0.5,
                borderRadius: 2,
                gap: 1.5,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                bgcolor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' },
              }}
            >
              {item.icon}
              {item.label}
            </Button>
          );
        })}

        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Button
            component={Link}
            to="/"
            fullWidth
            sx={{
              justifyContent: 'center',
              py: 1,
              borderRadius: 2,
              color: '#38BDF8',
              bgcolor: 'rgba(56, 189, 248, 0.1)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.2)' }
            }}
          >
            🌐 View Main Website
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          pb: { xs: '56px', md: 0 },
        }}
      >
        {/* Mobile Admin Header */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.2,
            bgcolor: '#111827',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0
          }}
        >
          <Box 
            component={Link} 
            to="/" 
            title="Digital Home - Go to Home"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
          >
            <Box
              component="img"
              src="/logo.webp"
              alt="Digital Home Logo"
              sx={{ height: 26, width: 'auto', aspectRatio: '66/34' }}
            />
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
              Digital Home
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/"
            size="small"
            sx={{ color: '#38BDF8', fontSize: '0.75rem', textTransform: 'none', fontWeight: 600 }}
          >
            🏠 Main Site
          </Button>
        </Box>
        <Outlet />
      </Box>

      {/* Mobile Bottom Nav */}
      <Paper
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          borderRadius: 0,
        }}
        elevation={8}
      >
        <BottomNavigation
          value={activeIndex >= 0 ? activeIndex : 0}
          showLabels
          sx={{ bgcolor: '#111827', height: 56 }}
        >
          {nav.map((item) => (
            <BottomNavigationAction
              key={item.label}
              label={item.label}
              icon={item.icon}
              component={Link}
              to={item.path}
              sx={{
                color: 'rgba(255,255,255,0.4)',
                '&.Mui-selected': { color: '#fff' },
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.7rem',
                  '&.Mui-selected': { fontSize: '0.7rem' },
                },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
