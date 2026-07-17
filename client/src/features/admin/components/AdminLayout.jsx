import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, BottomNavigation, BottomNavigationAction, Paper,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, Article as ArticleIcon,
  Forum as ForumIcon, MonetizationOn as AdIcon,
  TravelExplore as KeywordIcon, NotificationsActive as AlertsIcon,
  Settings as SettingsIcon, Slideshow as StoriesIcon
} from '@mui/icons-material';

const nav = [
  { label: 'Dashboard', path: '/admin', icon: <DashboardIcon /> },
  { label: 'Posts', path: '/admin/posts', icon: <ArticleIcon /> },
  { label: 'Web Stories', path: '/admin/web-stories', icon: <StoriesIcon /> },
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
        <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', mb: 0.5 }}>
          Inkspire
        </Typography>
        <Typography
          sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', mb: 3 }}
        >
          Content Studio
        </Typography>

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
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pb: { xs: '56px', md: 0 },
        }}
      >
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
