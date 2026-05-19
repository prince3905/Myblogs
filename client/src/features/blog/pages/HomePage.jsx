import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box, Chip, Avatar } from '@mui/material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import { usePosts } from '../../../hooks/usePosts';

export default function HomePage() {
  const { posts, loading, error } = usePosts({ limit: 7 });
  const featuredPost = posts.length > 0 ? posts[0] : null;
  const regularPosts = posts.length > 1 ? posts.slice(1) : [];

  return (
    <Layout>
      <Seo title="Digital Home | Your Daily Dose of Information & Insights" description="Technology, Finance, Career, Tutorials, and Trends — researched and explained in simple language." keywords="technology blog, information hub, digital home, tech trends, tutorials" />
      
      {/* Hero Section - Featured Article */}
      {featuredPost && (
        <Box sx={{ pt: { xs: 10, md: 18 }, pb: { xs: 8, md: 12 } }}>
          <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Image */}
              <Link to={`/blog/${featuredPost.slug}`} style={{ textDecoration: 'none' }}>
                <Box sx={{ position: 'relative', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 10px 50px rgba(0,0,0,0.08)' }}>
                  {featuredPost.featuredImage ? (
                    <Box
                      component="img"
                      src={featuredPost.featuredImage}
                      alt={featuredPost.title}
                      sx={{
                        width: '100%',
                        height: { xs: 300, md: 520 },
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.4s ease',
                        '&:hover': { transform: 'scale(1.02)' },
                      }}
                    />
                  ) : (
                    <Box sx={{ width: '100%', height: { xs: 300, md: 520 }, bgcolor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>{featuredPost.category}</Typography>
                    </Box>
                  )}
                </Box>
              </Link>
              
              {/* Content below image */}
              <Box sx={{ mt: { xs: 3, md: 4 }, maxWidth: 800 }}>
                <Typography variant="overline" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1, display: 'block' }}>
                  {featuredPost.category}
                </Typography>
                <Link to={`/blog/${featuredPost.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Typography variant="h1" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '2rem', sm: '2.8rem', md: '3.5rem' }, lineHeight: 1.15, color: '#4F46E5', letterSpacing: { xs: '-0.02em', md: '-2px' }, '&:hover': { opacity: 0.85 } }}>
                    {featuredPost.title}
                  </Typography>
                </Link>
                <Typography variant="body1" sx={{ mb: 3, color: '#6B7280', fontSize: { xs: '1rem', md: '1.2rem' }, lineHeight: 1.7 }}>
                  {featuredPost.excerpt}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Avatar sx={{ width: 44, height: 44, bgcolor: '#4F46E5', fontSize: '1rem', fontWeight: 600 }}>
                    {featuredPost.author?.charAt(0) || 'A'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>
                      {featuredPost.author || 'Admin'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.3 }}>
                      <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.8rem' }}>
                        {new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>•</Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>{featuredPost.readingTime || 5} min read</Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>•</Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>{featuredPost.views || 0} views</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>
      )}

      {/* Latest Insights Section */}
      <Container maxWidth="xl" sx={{ py: { xs: 8, md: 12 }, px: { xs: 2, md: 6, lg: 6 } }}>
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
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: '24px',
          }}>
            {regularPosts.map((post) => (
              <Box key={post._id} sx={{ minWidth: 0 }}>
                <PostCard post={post} />
              </Box>
            ))}
            {!regularPosts.length ? (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No published posts yet. Log in to admin and create your first article.
                </Typography>
              </Box>
            ) : null}
          </Box>
        )}
      </Container>
    </Layout>
  );
}
