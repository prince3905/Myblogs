import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, TextField, Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Alert, Button, Paper, useTheme, Chip, Divider } from '@mui/material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import { usePosts } from '../../../hooks/usePosts';
import { useCategories } from '../../../hooks/useCategories';
import { postUrl } from '../../../shared/lib/category';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CalendarToday from '@mui/icons-material/CalendarToday';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Mail from '@mui/icons-material/Mail';
import AdSlot from '../../../components/AdSlot';

export default function BlogListPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  
  const { posts, loading: postsLoading, error: postsError, total, page, pages, setPage } = usePosts({ search, category, tags, dateFrom, dateTo, limit: 9 });
  const { categories } = useCategories();
  const theme = useTheme();

  const resultText = useMemo(() => `${total} article${total === 1 ? '' : 's'} found`, [total]);

  return (
    <Layout>
      <Seo title="All Insights | Digital Home" description="Browse our latest AI consulting insights and articles." />
      
      {/* Filter Section */}
      <Paper elevation={0} sx={{ py: { xs: 1.5, md: 3 }, mb: { xs: 1.5, md: 3 }, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', md: '2.125rem' }, mb: { xs: 0.5, md: 1 } }}>
            All Insights
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 1.5, md: 2 }, fontSize: { xs: '0.85rem', md: '0.95rem' } }}>
            Search by title, excerpt, or tags and filter by category.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              size="small"
              label="Search articles"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ 
                flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 11px)' },
                minWidth: { xs: '100%', sm: 180 }
              }}
            />
            <FormControl 
              size="small" 
              sx={{ 
                flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 11px)' },
                minWidth: { xs: '100%', sm: 150 }
              }}
            >
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="">All categories</MenuItem>
                {categories.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label="Tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              sx={{ 
                flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 11px)' },
                minWidth: { xs: '100%', sm: 150 }
              }}
            />
          </Box>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <DatePicker
                label="From Date"
                value={dateFrom}
                onChange={(newValue) => setDateFrom(newValue ? newValue : null)}
                slots={{
                  openPickerIcon: CalendarToday,
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    sx: { 
                      flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' },
                      minWidth: { xs: '100%', sm: 160 }
                    }
                  },
                  openPickerButton: {
                    size: "small",
                    sx: { mr: 0.5 }
                  }
                }}
              />
              <DatePicker
                label="To Date"
                value={dateTo}
                onChange={(newValue) => setDateTo(newValue ? newValue : null)}
                slots={{
                  openPickerIcon: CalendarToday,
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    sx: { 
                      flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' },
                      minWidth: { xs: '100%', sm: 160 }
                    }
                  },
                  openPickerButton: {
                    size: "small",
                    sx: { mr: 0.5 }
                  }
                }}
              />
            </Box>
          </LocalizationProvider>
        </Container>
      </Paper>

      {/* Main Content + Sidebar */}
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 0.9fr' }, gap: '24px' }}>
          {/* Left: Posts */}
          <Box>
            {postsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={48} />
              </Box>
            ) : postsError ? (
              <Alert severity="error" sx={{ mb: 2 }}>{postsError}</Alert>
            ) : (
              <>
                <Typography variant="body2" color="#6B7280" sx={{ mb: 2, fontWeight: 500 }}>
                  {resultText}
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: '20px' }}>
                  {posts.map((post, idx) => (
                    <Box key={post._id} sx={{ display: 'flex' }}>
                      <PostCard post={post} index={idx} />
                    </Box>
                  ))}
                </Box>

                {pages > 1 && (
                  <Box sx={{ display: 'flex', gap: { xs: 0.5, md: 1 }, justifyContent: 'center', mt: 4, mb: 3, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      size="small"
                      sx={{ borderRadius: 2, fontSize: { xs: '0.75rem', md: '0.875rem' }, px: { xs: 1, md: 2 } }}
                    >
                      ← Prev
                    </Button>
                    
                    {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                      <Button
                        key={p}
                        variant={p === page ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setPage(p)}
                        sx={{ 
                          minWidth: { xs: 32, md: 40 }, 
                          fontWeight: p === page ? 700 : 400,
                          borderRadius: 2,
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          display: { xs: p === page || p === 1 || p === pages || Math.abs(p - page) <= 1 ? 'inline-flex' : 'none', md: 'inline-flex' },
                        }}
                      >
                        {p}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outlined"
                      disabled={page >= pages}
                      onClick={() => setPage(page + 1)}
                      size="small"
                      sx={{ borderRadius: 2, fontSize: { xs: '0.75rem', md: '0.875rem' }, px: { xs: 1, md: 2 } }}
                    >
                      Next →
                    </Button>
                  </Box>
                )}
              </>
          )}
          </Box>

          {/* Right: Sidebar */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: { xs: 4, md: 0 } }}>
            {/* Search Box */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid #F2F2F2',
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Search insights..."
                onClick={() => window.location.href = '/search'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: '#F9FAFB',
                    '& fieldset': { borderColor: '#ECECEC' },
                    height: 44,
                    cursor: 'pointer',
                  }
                }}
                InputProps={{ readOnly: true }}
              />
            </Paper>

            {/* Trending Topics */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid #F2F2F2' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#111827' }}>
                <TrendingUp sx={{ mr: 1, fontSize: 20, color: '#4F46E5' }} />
                Trending Topics
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['AI Strategy', 'Web Development', 'MERN Stack', 'UI/UX Design', 'SEO Optimization'].map((topic) => (
                  <Chip 
                    key={topic}
                    label={topic}
                    size="small"
                    sx={{ 
                      bgcolor: '#F8F8F8',
                      color: '#4B5563',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      px: 1.5,
                      py: 0.5,
                    }}
                  />
                ))}
              </Box>
            </Paper>

            {/* Trending Blogs */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid #F2F2F2' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#111827' }}>
                📈 Trending Blogs
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {posts.slice(0, 5).map((post) => (
                  <Link
                    key={post._id}
                    to={postUrl(post)}
                    style={{ textDecoration: 'none' }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#4B5563',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        lineHeight: 1.4,
                        transition: 'color 0.2s',
                        '&:hover': { color: '#4F46E5' },
                      }}
                    >
                      {post.title}
                    </Typography>
                  </Link>
                ))}
                {posts.length === 0 && (
                  <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                    No posts yet
                  </Typography>
                )}
              </Box>
            </Paper>

            {/* Ad Slot */}
            <AdSlot format="sidebar" />

            {/* Newsletter Card */}
            <Paper elevation={0} sx={{ 
              p: 2.5,
              borderRadius: 3,
              background: '#050816',
              color: 'white',
              textAlign: 'center',
            }}>
              <Mail sx={{ fontSize: 28, mb: 1, color: '#818CF8' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'white', fontSize: '1rem' }}>
                Stay Updated
              </Typography>
              <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'rgba(255,255,255,0.9)' }}>
                Get the latest insights. No spam.
              </Typography>
              <Box 
                component="form"
                sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}
              >
                <TextField
                  type="email"
                  placeholder="your@email.com"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.95)',
                      '& fieldset': { border: 'none' },
                      height: 40,
                    }
                  }}
                />
                <Button 
                  type="submit"
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: '#4F46E5',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#4338CA' }
                  }}
                >
                  Subscribe
                </Button>
              </Box>
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
                No spam. Unsubscribe anytime.
              </Typography>
            </Paper>

          </Box>
        </Box>
      </Container>
    </Layout>
  );
}
