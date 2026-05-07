import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="body1" color="text.secondary">
          Checking session...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
