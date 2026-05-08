import { Link, useLocation } from 'react-router-dom';
import { Breadcrumbs, Typography, Box } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export default function BreadcrumbsNav() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);
  
  if (paths.length === 0) return null;

  return (
    <Box
      sx={{
        py: 1.75,
        px: { xs: 2, md: 0 },
        maxWidth: 'lg',
        mx: 'auto',
      }}
    >
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: 'primary.main', opacity: 0.7 }} />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-ol': { alignItems: 'center' },
          '& a': { fontWeight: 500 },
        }}
      >
        <Link 
          to="/" 
          style={{ 
            textDecoration: 'none', 
            color: 'inherit',
            fontWeight: 500,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.color = '#6366f1'}
          onMouseLeave={(e) => e.target.style.color = 'inherit'}
        >
          Home
        </Link>
        
        {paths.map((path, i) => {
          const url = '/' + paths.slice(0, i + 1).join('/');
          const isLast = i === paths.length - 1;
          const label = path === 'blog' ? 'Blog' : 
                       path === 'admin' ? 'Admin' : 
                       path === 'edit' ? 'Edit' :
                       decodeURIComponent(path).charAt(0).toUpperCase() + decodeURIComponent(path).slice(1);
          
          const primarySx = {
            fontWeight: 600,
            color: 'primary.main',
            opacity: 0.95,
            transition: 'opacity 0.2s',
          };

          return isLast ? (
            <Typography key={url} sx={primarySx}>
              {label}
            </Typography>
          ) : (
            <Link
              key={url}
              to={url}
              style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.target.style.color = '#6366f1')}
              onMouseLeave={(e) => (e.target.style.color = 'inherit')}
            >
              {label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
