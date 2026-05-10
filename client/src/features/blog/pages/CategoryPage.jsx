import { useParams, Link } from 'react-router-dom';
import { Container, Typography, Box, Grid, Chip, CircularProgress, Alert, Button } from '@mui/material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import { usePosts } from '../../../hooks/usePosts';

export default function CategoryPage() {
  const { category } = useParams();
  const { posts, loading, error } = usePosts({ category, limit: 50 });

  return (
    <Layout>
      <Seo title={`${category} — Digital Home`} description={`Browse all posts in the ${category} category.`} />

      <Box sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
            Browse by Category
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 700, mt: 2 }}>
            {category}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            {loading ? 'Loading...' : `${posts.length} post${posts.length !== 1 ? 's' : ''} in this category`}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error" sx={{ maxWidth: 400, mx: 'auto' }}>{error}</Alert>
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">No posts found in this category</Typography>
            <Button component={Link} to="/blog" variant="outlined" sx={{ mt: 2, fontWeight: 600 }}>Browse all posts</Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {posts.map(post => (
              <Grid item xs={12} sm={6} md={4} key={post._id}>
                <PostCard post={post} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Layout>
  );
}
