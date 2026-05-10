import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, Avatar } from '@mui/material';
import { Article, Mail, Comment, Dashboard, Logout } from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';

const nav = [
  { label: 'Dashboard', path: '/admin', icon: <Dashboard fontSize="small" /> },
  { label: 'Posts', path: '/admin', icon: <Article fontSize="small" /> },
  { label: 'Comments', path: '/admin/comments', icon: <Comment fontSize="small" /> },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ height: '100vh', display: 'flex', bgcolor: '#F6F4F3' }}>
      {/* Sidebar */}
      <Box sx={{
        width: 240,
        bgcolor: '#111827',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <Box sx={{ px: 3, py: 3, borderBottom: '1px solid', borderColor: 'rgba(255,255,255,0.08)' }}>
          <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
            Inkspire
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', mt: 0.3 }}>
            Content Studio
          </Typography>
        </Box>

        <Box sx={{ flex: 1, px: 2, py: 2 }}>
          {nav.map(item => (
            <Button
              key={item.path + item.label}
              component={Link}
              to={item.path}
              fullWidth
              startIcon={item.icon}
              sx={{
                justifyContent: 'flex-start',
                px: 2,
                py: 1.2,
                mb: 0.5,
                borderRadius: 2,
                color: location.pathname === item.path ? 'white' : 'rgba(255,255,255,0.5)',
                bgcolor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                fontWeight: 500,
                fontSize: '0.875rem',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: 'white' },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'rgba(255,255,255,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#4F46E5', fontSize: '0.8rem', fontWeight: 700 }}>
              {(user?.name || 'A').charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>{user?.name || 'Admin'}</Typography>
            </Box>
          </Box>
          <Button
            fullWidth
            startIcon={<Logout fontSize="small" />}
            onClick={() => { logout(); navigate('/admin/login'); }}
            sx={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.8rem',
              fontWeight: 500,
              justifyContent: 'flex-start',
              px: 2,
              py: 0.8,
              borderRadius: 2,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#EF4444' },
            }}
          >
            Sign Out
          </Button>
        </Box>
      </Box>

      {/* Content area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
