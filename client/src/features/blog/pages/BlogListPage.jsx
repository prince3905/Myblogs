import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, TextField, Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Alert, Button, Paper, useTheme, Chip, Divider, Grid, Collapse, Pagination } from '@mui/material';
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
import FilterList from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ResetIcon from '@mui/icons-material/RestartAlt';
import AdSlot from '../../../components/AdSlot';

export default function BlogListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortOption, setSortOption] = useState('date-desc');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [sortBy, order] = useMemo(() => {
    const parts = sortOption.split('-');
    return [parts[0], parts[1]];
  }, [sortOption]);
  
  const { posts, loading: postsLoading, error: postsError, total, page, pages, setPage } = usePosts({ search: debouncedSearch, category, tags, dateFrom, dateTo, sortBy, order, limit: 9 });
  const { categories } = useCategories();
  const theme = useTheme();

  const resultText = useMemo(() => `${total} article${total === 1 ? '' : 's'} found`, [total]);

  return (
    <Layout>
      <Seo title="All Insights & Articles | Digital Home" description="Browse our latest Sarkari jobs, admit cards, tech guides, and health articles." />
      
      <Box sx={{ pt: { xs: 2, md: 3 }, pb: { xs: 4, md: 6 } }}>
        <Container maxWidth="xl">
          {/* Header Title Section */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1.5, fontSize: '0.65rem' }}>
              Comprehensive Knowledge Base
            </Typography>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{ 
                fontWeight: 800, 
                mt: 0.5, 
                letterSpacing: '-0.02em', 
                color: '#111827', 
                fontSize: { xs: '1.35rem', md: '1.65rem' } 
              }}
            >
              All Articles & Insights 🚀
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mt: 0.5, maxWidth: 600, mx: 'auto', fontSize: '0.82rem' }}
            >
              Browse, search, and filter latest Sarkari Jobs, Admit Cards, Results, Tech Guides, and Health Updates.
            </Typography>
          </Box>

          {/* Sleek Centered 30px Pill Search & Filter Bar matching Live Job Alerts */}
          <Paper 
            elevation={0} 
            id="search-filter-section"
            sx={{ 
              p: 1.5, 
              borderRadius: '30px', 
              border: '1px solid #ECECEC', 
              bgcolor: 'background.paper',
              boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
              mb: 4,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1.5,
              alignItems: 'center',
              maxWidth: '960px',
              mx: 'auto'
            }}
          >
            <TextField
              fullWidth
              placeholder="Search articles by Keyword, Title, Topic..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: '#9CA3AF', mr: 1, fontSize: '1.2rem' }} />
                )
              }}
              sx={{
                flex: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '30px',
                  bgcolor: '#F9FAFB',
                  pl: 2,
                  '& fieldset': { borderColor: '#E5E7EB' },
                  '&:hover fieldset': { borderColor: '#CBD5E1' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                }
              }}
            />

            <FormControl sx={{ flex: 1.2, minWidth: { xs: '100%', sm: 180 } }} size="small">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#9CA3AF', fontSize: '0.85rem' }}>
                        <FilterList sx={{ fontSize: 16 }} /> Filter Category
                      </Box>
                    );
                  }
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, fontSize: '0.85rem', color: 'primary.main' }}>
                       <FilterList sx={{ fontSize: 16 }} /> {selected}
                    </Box>
                  );
                }}
                sx={{ 
                  borderRadius: '30px', 
                  bgcolor: '#F9FAFB',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
                }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((item) => (
                  <MenuItem key={item} value={item}>{item}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ flex: 1, minWidth: { xs: '100%', sm: 150 } }} size="small">
              <Select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                sx={{ 
                  borderRadius: '30px', 
                  bgcolor: '#F9FAFB',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
                }}
              >
                <MenuItem value="date-desc">Newest First</MenuItem>
                <MenuItem value="date-asc">Oldest First</MenuItem>
                <MenuItem value="views-desc">Most Views</MenuItem>
                <MenuItem value="title-asc">Title (A-Z)</MenuItem>
                <MenuItem value="title-desc">Title (Z-A)</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant={showAdvanced ? "contained" : "outlined"}
              size="small"
              onClick={() => setShowAdvanced(!showAdvanced)}
              startIcon={<FilterList />}
              sx={{ 
                borderRadius: '30px',
                height: 40,
                px: 2,
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              More
            </Button>

            {(searchQuery || category || tags || dateFrom || dateTo) && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setSearchQuery('');
                  setCategory('');
                  setTags('');
                  setDateFrom(null);
                  setDateTo(null);
                }}
                startIcon={<ResetIcon />}
                sx={{ 
                  borderRadius: '30px', 
                  fontWeight: 700, 
                  textTransform: 'none', 
                  py: 0.8, 
                  px: 2.5, 
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Reset
              </Button>
            )}
          </Paper>

          <Collapse in={showAdvanced} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Tags (comma-separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  sx={{ 
                    flex: '1 1 100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                    }
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
                          minWidth: { xs: '100%', sm: 160 },
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                          }
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
                          minWidth: { xs: '100%', sm: 160 },
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                          }
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
            </Box>
          </Collapse>

      {/* Main Content + Sidebar */}
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2.1fr 0.9fr' }, gap: '24px' }}>
          {/* Left: Posts */}
          <Box sx={{ minWidth: 0 }}>
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
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: '20px' }}>
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
          </Box>

          {/* Right: Sidebar */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
            {/* Search Box */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid #F2F2F2',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden'
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
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid #F2F2F2',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
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
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid #F2F2F2',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
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
            <Paper
              elevation={0}
              sx={{ 
                p: 2.5,
                borderRadius: 3,
                background: '#050816',
                color: 'white',
                textAlign: 'center',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
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
    </Container>
  </Box>
</Layout>
  );
}
