import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box, Grid, Stack, Chip, Avatar } from '@mui/material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import { usePosts } from '../../../hooks/usePosts';
import CalendarToday from '@mui/icons-material/CalendarToday';
import AccessTime from '@mui/icons-material/AccessTime';
import Visibility from '@mui/icons-material/Visibility';

export default function HomePage() {
  const { posts, loading, error } = usePosts({ limit: 7 });
  const featuredPost = posts.length > 0 ? posts[0] : null;
  const regularPosts = posts.length > 1 ? posts.slice(1) : [];

  return (
    <Layout>
      <Seo title="Digital Home | AI Consulting Insights" description="Premium AI consulting and modern web solutions for forward-thinking businesses." />
      
      {/* Hero Section - Featured Article */}
      {featuredPost && (
        <Box sx={{ pt: { xs: 10, md: 18 }, pb: { xs: 8, md: 12 }, px: 2, bgcolor: 'background.default' }}>
          <Container maxWidth="lg">
            <Grid container spacing={{ xs: 4, md: 5 }} alignItems="center">
              {/* Left: Text content */}
              <Grid item xs={12} md={7}>
                <Chip 
                  label={featuredPost.category} 
                  size="small"
                  sx={{ 
                    bgcolor: '#4F46E5', 
                    color: 'white', 
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    mb: 3,
                    borderRadius: '9999px',
                    px: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }} 
                />
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 700,
                    mb: 3,
                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                    lineHeight: { xs: 1.1, md: '78px' },
                    color: '#4F46E5',
                    letterSpacing: { xs: '-0.02em', md: '-3px' },
                    maxWidth: { md: 700 },
                  }}
                >
                  {featuredPost.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 4,
                    color: '#6B7280',
                    fontSize: { xs: '1rem', md: '1.375rem' },
                    lineHeight: 1.6,
                    maxWidth: { md: 600 },
                  }}
                >
                  {featuredPost.excerpt}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Avatar
                    sx={{ width: 40, height: 40, bgcolor: '#4F46E5', fontSize: '0.875rem' }}
                  >
                    {featuredPost.author?.charAt(0) || 'A'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                      {featuredPost.author || 'Admin'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <CalendarToday sx={{ fontSize: 14, color: '#6B7280' }} />
                      <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
                        {new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Typography>
                      <AccessTime sx={{ fontSize: 14, color: '#6B7280', ml: 1 }} />
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        {featuredPost.readingTime || 5} min read
                      </Typography>
                      <Visibility sx={{ fontSize: 14, color: '#6B7280', ml: 1 }} />
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        {featuredPost.views || 0} views
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              
              {/* Right: Featured Image */}
              <Grid item xs={12} md={5}>
                {featuredPost.featuredImage ? (
                  <Box
                    component="img"
                    src={featuredPost.featuredImage}
                    alt={featuredPost.title}
                    sx={{
                      width: '100%',
                      height: { xs: 300, md: 480 },
                      objectFit: 'cover',
                      borderRadius: '32px',
                      boxShadow: '0 10px 50px rgba(0,0,0,0.08)',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: { xs: 300, md: 480 },
                      bgcolor: '#4F46E5',
                      borderRadius: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 10px 50px rgba(0,0,0,0.08)',
                    }}
                  >
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                      {featuredPost.category}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Container>
        </Box>
      )}

      {/* Latest Insights Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
            Latest Insights
          </Typography>
          <Button
            component={Link}
            to="/blog"
            sx={{ 
              fontWeight: 600, 
              fontSize: '0.95rem',
              color: '#4F46E5',
              '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.04)' }
            }}
          >
            View all →
          </Button>
        </Box>

        {loading ? (
          <Typography sx={{ textAlign: 'center', py: 4 }}>Loading posts...</Typography>
        ) : error ? (
          <Typography color="error" sx={{ textAlign: 'center', py: 4 }}>
            Error loading posts: {error}
          </Typography>
        ) : (
          <Grid container spacing={4}>
            {regularPosts.map((post) => (
              <Grid item xs={12} sm={6} md={4} key={post._id}>
                <PostCard post={post} />
              </Grid>
            ))}
            {!regularPosts.length ? (
              <Grid item xs={12}>
                <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No published posts yet. Log in to admin and create your first article.
                </Typography>
              </Grid>
            ) : null}
          </Grid>
        )}
      </Container>
    </Layout>
  );
}
