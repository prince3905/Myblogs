import { useParams, Link } from 'react-router-dom';
import { Container, Typography, Box, Chip, CircularProgress, Alert, Button } from '@mui/material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import { usePosts } from '../../../hooks/usePosts';

export default function TagPage() {
  const { tag } = useParams();
  const { posts, loading, error } = usePosts({ tags: tag, limit: 50 });

  return (
    <Layout>
      <Seo title={`#${tag} — Digital Home`} description={`Browse all posts tagged with #${tag}.`} />

      <Box sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
            Browse by Tag
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 700, mt: 2 }}>
            <Chip label={`#${tag}`} size="large" sx={{ fontWeight: 700, fontSize: '1.5rem', px: 2, py: 3, borderRadius: 3 }} />
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            {loading ? 'Loading...' : `${posts.length} post${posts.length !== 1 ? 's' : ''} tagged with #${tag}`}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error" sx={{ maxWidth: 400, mx: 'auto' }}>{error}</Alert>
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">No posts found with this tag</Typography>
            <Button component={Link} to="/blog" variant="outlined" sx={{ mt: 2, fontWeight: 600 }}>Browse all posts</Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: '20px' }}>
            {posts.map(post => (
              <Box key={post._id} sx={{ display: 'flex' }}>
                <PostCard post={post} />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Layout>
  );
}
