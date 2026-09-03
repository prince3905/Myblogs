import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import TechIcon from '@mui/icons-material/Computer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Seo from '../components/Seo';

export default function NotFoundPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const categories = [
    { title: 'Sarkari Jobs & Exams', path: '/category/sarkari-jobs-exams', icon: <WorkIcon color="primary" /> },
    { title: 'Health & Wellness', path: '/category/health-wellness', icon: <HealthAndSafetyIcon color="secondary" /> },
    { title: 'Tech & Tutorials', path: '/category/tech-tutorials', icon: <TechIcon color="info" /> },
    { title: 'Latest Job Alerts', path: '/job-alerts', icon: <TrendingUpIcon color="error" /> }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <Seo 
        title="404 — Page Not Found | Digital Home" 
        description="The page you are looking for does not exist or has been moved." 
        noindex={true} 
      />
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: '6rem', md: '9rem' },
            fontWeight: 900,
            background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
            mb: 2
          }}
        >
          404
        </Typography>

        <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Page Not Found / पृष्ठ नहीं मिला
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          <br />
          जिस पृष्ठ की आप तलाश कर रहे हैं वह हटा दिया गया हो सकता है या उसका यूआरएल बदल गया है।
        </Typography>

        {/* Search Bar */}
        <Box component="form" onSubmit={handleSearch} sx={{ maxWidth: 500, mx: 'auto', mb: 5 }}>
          <TextField
            fullWidth
            placeholder="Search posts, jobs, exam updates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit" color="primary" edge="end">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                backgroundColor: 'background.paper',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
              }
            }}
          />
        </Box>

        {/* Navigation Buttons */}
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 6 }}>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            sx={{ borderRadius: 3, px: 4, py: 1.2, fontWeight: 700 }}
          >
            Go to Homepage
          </Button>
          <Button
            component={RouterLink}
            to="/job-alerts"
            variant="outlined"
            size="large"
            startIcon={<WorkIcon />}
            sx={{ borderRadius: 3, px: 4, py: 1.2, fontWeight: 700 }}
          >
            Live Job Alerts
          </Button>
        </Stack>

        {/* Popular Categories Grid */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, textAlign: 'left' }}>
          Explore Popular Categories:
        </Typography>
        <Grid container spacing={2}>
          {categories.map((cat, idx) => (
            <Grid item xs={12} sm={6} key={idx}>
              <Card
                component={RouterLink}
                to={cat.path}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  textDecoration: 'none',
                  color: 'inherit',
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: 4
                  }
                }}
              >
                <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                  {cat.icon}
                </Box>
                <CardContent sx={{ p: '0 !important', textAlign: 'left' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {cat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
