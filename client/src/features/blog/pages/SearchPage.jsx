import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Typography, Box, CircularProgress, Alert, TextField, Chip, Paper, InputAdornment, IconButton, Pagination } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import { request } from '../../../shared/lib/api';
import { usePosts } from '../../../hooks/usePosts';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { posts: recentPosts, loading: recentLoading, error: recentError } = usePosts({ limit: 3 });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        setSearchParams({ q: query.trim() });
      } else {
        setSearchParams({});
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, setSearchParams]);

  useEffect(() => {
    if (!q) { setResults([]); setTotal(0); setPages(0); return; }
    setLoading(true);
    setError('');
    request(`/api/posts/search?q=${encodeURIComponent(q)}&page=${page}&limit=9`)
      .then(data => { setResults(data.posts); setTotal(data.total); setPages(data.pages); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [q, page]);

  const resultText = useMemo(() => {
    if (!q) return '';
    return total === 0 ? 'No results found' : `${total} result${total === 1 ? '' : 's'} for "${q}"`;
  }, [total, q]);

  return (
    <Layout>
      <Seo title={q ? `Search: ${q} | Digital Home` : 'Search | Digital Home'} description="Search articles on Digital Home" noindex={true} />

      <>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>Search Insights</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Search all articles by title, content, and excerpt
        </Typography>

        <Box sx={{ mb: 4, maxWidth: 520 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: '16px',
              border: '1.5px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'background.paper',
              position: 'relative',
              overflow: 'hidden',
              transition: 'border-color 0.2s',
              '&:focus-within': {
                borderColor: 'transparent',
              },
              '&:focus-within::after': {
                opacity: 1,
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '2.5px',
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7, #6366f1)',
                backgroundSize: '200% auto',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
            }}
          >
            <Box sx={{ pl: 2.5, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
              <SearchIcon sx={{ fontSize: '1.3rem' }} />
            </Box>
            <TextField
              fullWidth
              placeholder="Search articles..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: { px: 1.5, py: 1.2, fontSize: '1rem', '&::placeholder': { color: 'text.disabled', opacity: 1 } },
                endAdornment: query && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setQuery('')}
                      sx={{ color: 'text.secondary', mr: 1 }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Paper>
        </Box>

        {error ? <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert> : null}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={48} /></Box>
        ) : q ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>{resultText}</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: '20px' }}>
              {results.map(post => <PostCard key={post._id} post={post} />)}
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
        ) : (
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
              ⚡ Trending Topics
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, mb: 5 }}>
              {['AI Tools', 'Sarkari Jobs', 'Health', 'Tech & Tutorials', 'Finance', 'News & Trends'].map((topic) => (
                <Chip 
                  key={topic}
                  label={topic}
                  clickable
                  onClick={() => setQuery(topic)}
                  sx={{ 
                    bgcolor: 'grey.100',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    '&:hover': { bgcolor: 'primary.main', color: 'white' }
                  }}
                />
              ))}
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              📖 Recent Insights
            </Typography>
            {recentLoading ? (
              <Box sx={{ py: 4 }}><CircularProgress size={24} /></Box>
            ) : recentError ? (
              <Alert severity="error">{recentError}</Alert>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: '20px' }}>
                {recentPosts.map(post => <PostCard key={post._id} post={post} />)}
              </Box>
            )}
          </Box>
        )}
      </>
    </Layout>
  );
}
