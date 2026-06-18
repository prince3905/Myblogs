import { useParams, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Container, Typography, Box, Chip, CircularProgress, Alert, Button, FormControl, InputLabel, Select, MenuItem, Paper } from '@mui/material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import { usePosts } from '../../../hooks/usePosts';

export default function CategoryPage() {
  const { category } = useParams();
  const [sortOption, setSortOption] = useState('date-desc');
  
  const [sortBy, order] = useMemo(() => {
    const parts = sortOption.split('-');
    return [parts[0], parts[1]];
  }, [sortOption]);

  const { posts, loading, error, total, page, pages, setPage } = usePosts({ 
    category, 
    sortBy, 
    order, 
    limit: 12 
  });

  return (
    <Layout>
      <Seo title={`${category} — Digital Home`} description={`Browse all posts in the ${category} category.`} />

      <Box sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 8, md: 12 } }}>
        {/* Header Section */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: '24px', bgcolor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
            <Box>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                Category
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, letterSpacing: '-0.02em', color: '#111827' }}>
                {category}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {loading ? 'Loading...' : `${total} article${total !== 1 ? 's' : ''} found`}
              </Typography>
            </Box>

            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 180,
                alignSelf: { xs: 'stretch', md: 'auto' },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: 'background.paper'
                }
              }}
            >
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortOption}
                label="Sort By"
                onChange={(e) => setSortOption(e.target.value)}
              >
                <MenuItem value="date-desc">Newest First</MenuItem>
                <MenuItem value="date-asc">Oldest First</MenuItem>
                <MenuItem value="views-desc">Most Views</MenuItem>
                <MenuItem value="title-asc">Title (A-Z)</MenuItem>
                <MenuItem value="title-desc">Title (Z-A)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error" sx={{ maxWidth: 400, mx: 'auto' }}>{error}</Alert>
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">No posts found in this category</Typography>
            <Button component={Link} to="/blog" variant="outlined" sx={{ mt: 2, fontWeight: 600 }}>Browse all posts</Button>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: '24px', mb: 4 }}>
              {posts.map((post, idx) => (
                <Box key={post._id} sx={{ display: 'flex' }}>
                  <PostCard post={post} index={idx} />
                </Box>
              ))}
            </Box>

            {pages > 1 && (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 4 }}>
                <Button
                  variant="outlined"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  ← Prev
                </Button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <Button
                    key={p}
                    variant={p === page ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setPage(p)}
                    sx={{ minWidth: 32, borderRadius: 2, fontWeight: p === page ? 700 : 400 }}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outlined"
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  Next →
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Layout>
  );
}
