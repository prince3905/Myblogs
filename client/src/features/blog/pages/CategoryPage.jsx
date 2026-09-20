import { useParams, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Container, Typography, Box, Chip, CircularProgress, Alert, Button, FormControl, InputLabel, Select, MenuItem, Paper, Pagination, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import { usePosts } from '../../../hooks/usePosts';
import { useCategories } from '../../../hooks/useCategories';
import { catSlug } from '../../../shared/lib/category';

const CATEGORY_ICONS = {
  'Sarkari Jobs & Exams': '🏛️',
  'AI & Web Tools': '🤖',
  'Tech & Tutorials': '💻',
  'Health & Wellness': '🌿',
  'Finance & Business': '💰',
  'News & Trends': '📰',
  'Technology': '⚡'
};

const DEFAULT_CATEGORIES = [
  'Sarkari Jobs & Exams',
  'AI & Web Tools',
  'Tech & Tutorials',
  'Health & Wellness',
  'Finance & Business',
  'News & Trends'
];

function formatCatTitle(cat) {
  if (!cat) return '';
  const map = {
    'sarkari-jobs-exams': 'Sarkari Jobs & Exams',
    'sarkari-jobs': 'Sarkari Jobs & Exams',
    'sarkari': 'Sarkari Jobs & Exams',
    'ai-web-tools': 'AI & Web Tools',
    'ai-tools': 'AI & Web Tools',
    'tech-tutorials': 'Tech & Tutorials',
    'tech': 'Tech & Tutorials',
    'health-wellness': 'Health & Wellness',
    'health': 'Health & Wellness',
    'finance-business': 'Finance & Business',
    'finance': 'Finance & Business',
    'news-trends': 'News & Trends',
    'news': 'News & Trends'
  };
  const key = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return map[key] || cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default function CategoryPage() {
  const { category } = useParams();
  const [sortOption, setSortOption] = useState('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { categories: fetchedCategories } = useCategories();
  const allCategories = useMemo(() => {
    const list = Array.isArray(fetchedCategories) && fetchedCategories.length > 0 ? fetchedCategories : DEFAULT_CATEGORIES;
    return list;
  }, [fetchedCategories]);

  const [sortBy, order] = useMemo(() => {
    const parts = sortOption.split('-');
    return [parts[0], parts[1]];
  }, [sortOption]);

  const { posts, loading, error, total, page, pages, setPage } = usePosts({ 
    category,
    search: searchQuery,
    sortBy, 
    order, 
    limit: 12 
  });

  const displayTitle = formatCatTitle(category);
  const isJobCategory = category && (category.toLowerCase().includes('job') || category.toLowerCase().includes('sarkari') || category.toLowerCase().includes('exam'));

  return (
    <Layout>
      <Seo 
        title={`${displayTitle} — Digital Home Articles & Guides`} 
        description={`Browse latest insights, updates, and verified articles in ${displayTitle}.`} 
        noindex={!isJobCategory || page > 1 || sortOption !== 'date-desc'}
      />

      <Box sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 8, md: 12 } }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
          
          {/* Header Title Section */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 3, md: 4 }, 
              mb: 3, 
              borderRadius: '24px', 
              bgcolor: '#F9FAFB', 
              border: '1px solid #E5E7EB' 
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
              <Box>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 2, fontSize: '0.75rem' }}>
                  CATEGORY COLLECTION
                </Typography>
                <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mt: 0.5, letterSpacing: '-0.02em', color: '#111827', fontSize: { xs: '1.6rem', md: '2.2rem' } }}>
                  {CATEGORY_ICONS[displayTitle] || '📌'} {displayTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.88rem' }}>
                  {loading ? 'Fetching articles...' : `${total} article${total !== 1 ? 's' : ''} available`}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', md: 'auto' }, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Filter by keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: '#9CA3AF', mr: 1, fontSize: '1.1rem' }} />
                  }}
                  sx={{
                    minWidth: { xs: '100%', sm: 220 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: 'background.paper'
                    }
                  }}
                />

                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: 160,
                    width: { xs: '100%', sm: 'auto' },
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
            </Box>
          </Paper>

          {/* Interactive Category Switcher Strip */}
          <Box sx={{ mb: 3.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
              Switch Category (श्रेणी बदलें):
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                overflowX: 'auto',
                py: 0.5,
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' }
              }}
            >
              {/* All Articles pill linking to /blog */}
              <Chip
                component={Link}
                to="/blog"
                label="✨ All Articles"
                clickable
                sx={{
                  fontWeight: 700,
                  px: 1.5,
                  py: 2.2,
                  borderRadius: '20px',
                  fontSize: '0.84rem',
                  bgcolor: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: '#E5E7EB', transform: 'translateY(-1px)' }
                }}
              />

              {allCategories.map((cat) => {
                const isCurrent = catSlug(cat) === catSlug(category) || cat.toLowerCase() === (category || '').toLowerCase();
                return (
                  <Chip
                    key={cat}
                    component={Link}
                    to={`/category/${catSlug(cat)}`}
                    label={`${CATEGORY_ICONS[cat] || '📌'} ${cat}`}
                    clickable
                    sx={{
                      fontWeight: isCurrent ? 800 : 600,
                      px: 1.5,
                      py: 2.2,
                      borderRadius: '20px',
                      fontSize: '0.84rem',
                      bgcolor: isCurrent ? '#4F46E5' : '#FFFFFF',
                      color: isCurrent ? '#FFFFFF' : '#374151',
                      border: isCurrent ? '1px solid #4338CA' : '1px solid #E5E7EB',
                      boxShadow: isCurrent ? '0 4px 14px rgba(79, 70, 229, 0.35)' : 'none',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: isCurrent ? '#4338CA' : '#F3F4F6',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          {/* Posts Grid or Loading / Empty states */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress size={40} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ maxWidth: 450, mx: 'auto', my: 4, borderRadius: '12px' }}>{error}</Alert>
          ) : posts.length === 0 ? (
            <Paper sx={{ textAlign: 'center', py: 8, px: 3, borderRadius: '20px', bgcolor: '#F9FAFB', border: '1px dashed #D1D5DB' }}>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                No articles found matching this filter
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Try switching categories or browsing all available articles.
              </Typography>
              <Button component={Link} to="/blog" variant="contained" sx={{ fontWeight: 700, borderRadius: '12px', px: 3 }}>
                Browse All Articles
              </Button>
            </Paper>
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
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, mb: 3 }}>
                  <Pagination
                    count={pages}
                    page={page}
                    onChange={(e, value) => {
                      setPage(value);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    color="primary"
                    size="medium"
                    shape="rounded"
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        fontWeight: 700,
                        borderRadius: '10px'
                      }
                    }}
                  />
                </Box>
              )}
            </>
          )}

        </Container>
      </Box>
    </Layout>
  );
}
