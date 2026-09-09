import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Pagination from '@mui/material/Pagination';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import QuizIcon from '@mui/icons-material/Quiz';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import Layout from '../../blog/components/Layout';

const CATEGORIES = [
  'All',
  'National',
  'International',
  'Economy',
  'Defense',
  'Sports',
  'Appointments',
  'Days & Themes'
];

export default function CurrentAffairsListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchItems();
  }, [page, selectedCat, selectedDate]);

  async function fetchItems(searchTerm = search) {
    setLoading(true);
    try {
      let url = `/api/current-affairs?page=${page}&limit=9`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (selectedCat && selectedCat !== 'All') url += `&category=${encodeURIComponent(selectedCat)}`;
      if (selectedDate) url += `&date=${encodeURIComponent(selectedDate)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setItems(json.items || []);
        setTotalPages(json.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load current affairs:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchItems(search);
  }

  return (
    <Layout>
      <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: { xs: 3, md: 5 } }}>
        <Helmet>
          <title>Daily Current Affairs in Hindi 2026: दैनिक समसामयिकी और Daily GK Quiz</title>
          <meta name="description" content="आज का दैनिक करेंट अफेयर्स (Daily Current Affairs in Hindi) पढ़ें। UPSC, SSC, Railway, BPSC, Police व अन्य Sarkari Exam के लिए 10 महत्वपूर्ण डेली GK MCQs और Static GK नोट्स।" />
          <link rel="canonical" href="https://www.digitalhomeblog.in/current-affairs" />
        </Helmet>

      <Container maxWidth="lg">
        {/* Header Hero Banner */}
        <Box sx={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
          borderRadius: 4,
          p: { xs: 3, md: 5 },
          color: 'white',
          mb: 4,
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Chip
              icon={<AutoAwesomeIcon sx={{ color: '#FDE047 !important', fontSize: '1rem' }} />}
              label="⚡ Daily Exam Prep Booster"
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#FEF08A', fontWeight: 700, mb: 1.5 }}
            />
            <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', md: '2.5rem' }, mb: 1.5, letterSpacing: '-0.5px' }}>
              Daily Current Affairs & GK Quiz
            </Typography>
            <Typography variant="body1" sx={{ color: '#E0E7FF', fontSize: { xs: '0.95rem', md: '1.1rem' }, maxWidth: 800, lineHeight: 1.6, mb: 3 }}>
              UPSC, SSC CGL/CHSL, Railways RRB, Banking, BPSC, और UP Police परीक्षा के लिए दैनिक राष्ट्रीय व अंतर्राष्ट्रीय घटनाक्रमों का संपूर्ण विश्लेषण और 10 डेली प्रैक्टिस प्रश्न।
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/daily-quiz"
                variant="contained"
                startIcon={<QuizIcon />}
                sx={{
                  bgcolor: '#10B981',
                  color: 'white',
                  fontWeight: 700,
                  px: 3,
                  py: 1.2,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  '&:hover': { bgcolor: '#059669' }
                }}
              >
                🎯 Play Today's Daily Quiz
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Filters & Search Toolbar */}
        <Box sx={{ bgcolor: 'white', p: { xs: 2, md: 3 }, borderRadius: 3, border: '1px solid #E2E8F0', mb: 4 }}>
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' }, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search current affairs topics (e.g. ISRO, Budget, G20, Appointments)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#94A3B8', mr: 1 }} />
              }}
              sx={{ bgcolor: '#F8FAFC' }}
            />
            <TextField
              type="date"
              size="small"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
              sx={{ width: { xs: '100%', md: 220 }, bgcolor: '#F8FAFC' }}
            />
            <Button type="submit" variant="contained" sx={{ px: 3, fontWeight: 700, bgcolor: '#4F46E5', textTransform: 'none' }}>
              Search
            </Button>
          </Box>

          {/* Category Chips */}
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                clickable
                onClick={() => { setSelectedCat(cat); setPage(1); }}
                color={selectedCat === cat ? 'primary' : 'default'}
                variant={selectedCat === cat ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, fontSize: '0.8rem' }}
              />
            ))}
          </Box>
        </Box>

        {/* Article Cards Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#4F46E5' }} />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'white', borderRadius: 3, border: '1px solid #E2E8F0', p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
              No Current Affairs Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Try adjusting your search query or selecting a different date/category.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {items.map((item) => (
              <Card
                key={item._id}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px -10px rgba(0,0,0,0.08)'
                  }
                }}
              >
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  {/* Meta Badges */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Chip
                      icon={<CalendarMonthIcon sx={{ fontSize: '0.9rem !important' }} />}
                      label={item.dateString}
                      size="small"
                      sx={{ bgcolor: '#EEF2FF', color: '#4338CA', fontWeight: 700, fontSize: '0.75rem' }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B', fontSize: '0.75rem' }}>
                      <AccessTimeIcon sx={{ fontSize: '0.9rem' }} />
                      <span>{item.readingTimeMinutes || 6} min read</span>
                    </Box>
                  </Box>

                  {/* Title */}
                  <Typography
                    component={Link}
                    to={`/current-affairs/${item.slug}`}
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      lineHeight: 1.4,
                      color: '#0F172A',
                      textDecoration: 'none',
                      mb: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      '&:hover': { color: '#4F46E5' }
                    }}
                  >
                    {item.title}
                  </Typography>

                  {/* Summary */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#475569',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flexGrow: 1
                    }}
                  >
                    {item.summary}
                  </Typography>

                  {/* Action Buttons */}
                  <Box sx={{ pt: 2, borderTop: '1px solid #F1F5F9', display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                    <Button
                      component={Link}
                      to={`/current-affairs/${item.slug}`}
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      sx={{ fontWeight: 700, textTransform: 'none', color: '#4F46E5' }}
                    >
                      Read Full Article
                    </Button>
                    <Button
                      component={Link}
                      to={`/daily-quiz/${item.dateString}`}
                      size="small"
                      variant="outlined"
                      startIcon={<QuizIcon sx={{ fontSize: '0.9rem !important' }} />}
                      sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        color: '#059669',
                        borderColor: '#A7F3D0',
                        fontSize: '0.75rem',
                        '&:hover': { bgcolor: '#ECFDF5', borderColor: '#10B981' }
                      }}
                    >
                      Quiz (10 MCQs)
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
              shape="rounded"
            />
          </Box>
        )}
      </Container>
    </Box>
  </Layout>
  );
}
