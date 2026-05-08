import { useMemo, useState } from 'react';
import { Container, Typography, TextField, Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Alert, Button, Paper, useTheme } from '@mui/material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import { usePosts } from '../../../hooks/usePosts';
import { useCategories } from '../../../hooks/useCategories';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CalendarToday from '@mui/icons-material/CalendarToday';

export default function BlogListPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const { posts, loading: postsLoading, error: postsError, total, page, pages, setPage } = usePosts({ search, category, tags, dateFrom, dateTo, limit: 6 });
  const { categories } = useCategories();
  const theme = useTheme();

  const resultText = useMemo(() => `${total} article${total === 1 ? '' : 's'} found`, [total]);

  return (
    <Layout>
      <Seo title="Blog Articles | Inkspire Blog" description="Browse SEO-friendly articles with category filters and search." />
      
      <Paper elevation={0} sx={{ py: { xs: 4, md: 6 }, mb: 4, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography variant="h2" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
            All Blog Posts
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
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
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' },
                minWidth: { xs: '100%', sm: 200 }
              }}
            />
            <FormControl 
              size="small" 
              sx={{ 
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' },
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
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' },
                minWidth: { xs: '100%', sm: 200 }
              }}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From Date"
                value={dateFrom ? new Date(dateFrom) : null}
                onChange={(newValue) => setDateFrom(newValue ? newValue.toISOString().split('T')[0] : '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    sx={{ 
                      flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' },
                      minWidth: { xs: '100%', sm: 160 }
                    }}
                  />
                )}
              />
              <DatePicker
                label="To Date"
                value={dateTo ? new Date(dateTo) : null}
                onChange={(newValue) => setDateTo(newValue ? newValue.toISOString().split('T')[0] : '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    sx={{ 
                      flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' },
                      minWidth: { xs: '100%', sm: 160 }
                    }}
                  />
                )}
              />
            </LocalizationProvider>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="lg">
        {postsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : postsError ? (
          <Alert severity="error" sx={{ mb: 3 }}>{postsError}</Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
              {resultText}
            </Typography>
            
            {/* 2-column flexbox layout like HomePage */}
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

            {/* Pagination */}
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
      </Container>
    </Layout>
  );
}
