import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box, Chip, Avatar } from '@mui/material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import { usePosts } from '../../../hooks/usePosts';

export default function HomePage() {
  const { posts, loading, error } = usePosts({ limit: 10 });
  const featuredPost = posts.length > 0 ? posts[0] : null;
  const regularPosts = posts.length > 1 ? posts.slice(1) : [];

  return (
    <Layout>
      <Seo title="Digital Home | Your Daily Dose of Information & Insights" description="Technology, Finance, Career, Tutorials, and Trends — researched and explained in simple language." keywords="technology blog, information hub, digital home, tech trends, tutorials" />

      {/* Hero Section - Featured Article (H1) */}
      {featuredPost && (
        <Box component="section" sx={{ pt: { xs: 8, md: 14 }, pb: { xs: 4, md: 8 } }}>
          <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 3, md: 5 },
              alignItems: { md: 'center' }
            }}>
              {/* Image (left side) */}
              <Link to={`/blog/${featuredPost.slug}`} style={{ textDecoration: 'none', flex: { md: '0 0 55%' }, display: 'block' }}>
                <Box sx={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
                  {featuredPost.featuredImage ? (
                    <Box
                      component="img"
                      src={featuredPost.featuredImage}
                      alt={featuredPost.title}
                      sx={{
                        width: '100%',
                        height: { xs: 240, md: 380 },
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.4s ease',
                        '&:hover': { transform: 'scale(1.02)' },
                      }}
                    />
                  ) : (
                    <Box sx={{ width: '100%', height: { xs: 240, md: 380 }, bgcolor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>{featuredPost.category}</Typography>
                    </Box>
                  )}
                  <Chip
                    label={featuredPost.category}
                    size="small"
                    sx={{
                      position: 'absolute', top: 16, left: 16,
                      bgcolor: 'rgba(0,0,0,0.55)', color: 'white',
                      fontWeight: 600, fontSize: '0.75rem',
                      backdropFilter: 'blur(6px)', borderRadius: '8px',
                      px: 1, height: 28,
                    }}
                  />
                </Box>
              </Link>

              {/* Content (right side) */}
              <Box sx={{ flex: { md: '0 0 40%' }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Link to={`/blog/${featuredPost.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Typography
                    variant="h1"
                    sx={{
                      fontWeight: 800,
                      mb: 1.5,
                      fontSize: { xs: '1.6rem', sm: '2rem', md: '2.5rem' },
                      lineHeight: 1.2,
                      color: '#111827',
                      letterSpacing: '-0.03em',
                      '&:hover': { opacity: 0.85 }
                    }}
                  >
                    {featuredPost.title}
                  </Typography>
                </Link>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 2.5,
                    color: '#6B7280',
                    fontSize: { xs: '0.9rem', md: '1.05rem' },
                    lineHeight: 1.7,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {featuredPost.excerpt}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: '#4F46E5', fontSize: '0.9rem', fontWeight: 600 }}>
                    {featuredPost.author?.charAt(0) || 'A'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                      {featuredPost.author || 'Admin'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.75rem' }}>
                      {new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{featuredPost.readingTime || 5} min read
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>
      )}

      {/* Latest Insights Section (H2) */}
      <Box component="section" sx={{ py: { xs: 6, md: 10 }, bgcolor: '#F9FAFB' }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700, color: '#111827', letterSpacing: '-0.02em',
                fontSize: { xs: '1.5rem', md: '2rem' }
              }}
            >
              Latest Insights
            </Typography>
            <Button
              component={Link}
              to="/blog"
              sx={{
                fontWeight: 600, fontSize: '0.9rem',
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
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: regularPosts.length === 1 ? '1fr' : 'repeat(3, 1fr)'
              },
              gap: '24px',
            }}>
              {regularPosts.map((post) => (
                <Box key={post._id} component="article" sx={{ minWidth: 0 }}>
                  <PostCard post={post} headingLevel="h3" />
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
      </Box>
    </Layout>
  );
}
