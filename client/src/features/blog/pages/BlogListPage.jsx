import { useMemo, useState } from 'react';
import { Container, Typography, TextField, Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Alert, Button, Paper, useTheme, Chip, Divider } from '@mui/material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import { usePosts } from '../../../hooks/usePosts';
import { useCategories } from '../../../hooks/useCategories';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CalendarToday from '@mui/icons-material/CalendarToday';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Mail from '@mui/icons-material/Mail';

export default function BlogListPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  
  const { posts, loading: postsLoading, error: postsError, total, page, pages, setPage } = usePosts({ search, category, tags, dateFrom, dateTo, limit: 6 });
  const { categories } = useCategories();
  const theme = useTheme();

  const resultText = useMemo(() => `${total} article${total === 1 ? '' : 's'} found`, [total]);

  return (
    <Layout>
      <Seo title="All Insights | Digital Home" description="Browse our latest AI consulting insights and articles." />
      
      {/* Filter Section */}
      <Paper elevation={0} sx={{ py: { xs: 4, md: 6 }, mb: 4, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
            All Insights
          </Typography>
          <Typography variant="body1" color="#6B7280" sx={{ mb: 3, fontSize: '1.125rem' }}>
            Search by title, excerpt, or tags and filter by category.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              size="small"
              label="Search articles"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ 
                flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 11px)' },
                minWidth: { xs: '100%', sm: 200 }
              }}
            />
            <FormControl 
              size="small" 
              sx={{ 
                flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 11px)' },
                minWidth: { xs: '100%', sm: 200 }
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
                minWidth: { xs: '100%', sm: 200 }
              }}
            />
          </Box>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '70% 30%' }, gap: 4 }}>
          {/* Left: Posts */}
          <Box>
            {postsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={60} />
              </Box>
            ) : postsError ? (
              <Alert severity="error" sx={{ mb: 3 }}>{postsError}</Alert>
            ) : (
              <>
                <Typography variant="body2" color="#6B7280" sx={{ mb: 3, fontWeight: 500 }}>
                  {resultText}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {posts.map((post) => (
                    <Box 
                      key={post._id} 
                      sx={{ 
                        width: { xs: '100%', sm: 'calc(50% - 16px)' },
                        flexShrink: 0,
                      }}
                    >
                      <PostCard post={post} />
                    </Box>
                  ))}
                </Box>

                {pages > 1 && (
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 6, mb: 4 }}>
                    <Button
                      variant="outlined"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
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
                        sx={{ 
                          minWidth: 40, 
                          fontWeight: p === page ? 700 : 400,
                          borderRadius: 2,
                        }}
                      >
                        {p}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outlined"
                      disabled={page >= pages}
                      onClick={() => setPage(page + 1)}
                      sx={{ borderRadius: 2 }}
                    >
                      Next →
                    </Button>
                  </Box>
                )}
              </>
          )}
          </Box>

          {/* Right: Sidebar */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: { xs: 4, md: 0 } }}>
            {/* Search Box */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid #F2F2F2' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search insights..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: '#F9FAFB',
                    '& fieldset': { borderColor: '#ECECEC' },
                    height: 56,
                  }
                }}
              />
            </Paper>

            {/* Trending Topics */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid #F2F2F2' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#111827', fontSize: '1.125rem' }}>
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

            {/* Newsletter Card */}
            <Paper elevation={0} sx={{ 
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              background: '#050816',
              color: 'white',
              textAlign: 'center',
            }}>
              <Mail sx={{ fontSize: 40, mb: 2, color: '#818CF8' }} />
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: 'white' }}>
                Stay Updated
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
                Get the latest insights delivered to your inbox. No spam, ever.
              </Typography>
              <Box 
                component="form"
                sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 400, mx: 'auto' }}
              >
                <TextField
                  type="email"
                  placeholder="your@email.com"
                  size="small"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.95)',
                      '& fieldset': { border: 'none' },
                    }
                  }}
                />
                <Button 
                  type="submit"
                  variant="contained"
                  sx={{
                    bgcolor: '#4F46E5',
                    color: 'white',
                    fontWeight: 700,
                    px: 3,
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#4338CA' }
                  }}
                >
                  Subscribe
                </Button>
              </Box>
              <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'rgba(255,255,255,0.7)' }}>
                Join 500+ professionals who already subscribed
              </Typography>
            </Paper>

            {/* Profile Image Section */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Box
                component="img"
                src="/profile-placeholder.jpg"
                alt="Profile"
                sx={{
                  width: 320,
                  height: 320,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                  border: '4px solid white',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Container>
    </Layout>
  );
}
