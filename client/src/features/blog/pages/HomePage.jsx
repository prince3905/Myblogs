import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box, Chip, Avatar, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import { usePosts } from '../../../hooks/usePosts';
import { postUrl } from '../../../shared/lib/category';
import { optimizeImage } from '../../../shared/lib/images';
import { request } from '../../../shared/lib/api';

const AlertCard = ({ alert, idx }) => {
  const isEven = idx % 2 === 0;
  const cardBorder = isEven ? '#F87171' : '#60A5FA';
  const cardBg = isEven ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' : 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)';
  const shadowColor = isEven ? 'rgba(239, 68, 68, 0.06)' : 'rgba(59, 130, 246, 0.06)';
  const hoverBorder = isEven ? '#EF4444' : '#3B82F6';
  const textCol = isEven ? '#991B1B' : '#1E40AF';
  const isNew = new Date() - new Date(alert.createdAt) < 3 * 24 * 60 * 60 * 1000;

  return (
    <Link to={`/job-alerts?alert=${alert._id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <Box
        sx={{
          p: { xs: 1.2, sm: 1.5 },
          flexGrow: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: cardBg,
          border: isNew ? `1.5px solid ${isEven ? '#EF4444' : '#3B82F6'}` : `1px solid ${cardBorder}`,
          borderRadius: '12px',
          position: 'relative',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isNew 
            ? `0 2px 8px ${isEven ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'}`
            : `0 2px 4px -1px ${shadowColor}`,
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: `0 8px 16px -3px ${shadowColor}`,
            borderColor: hoverBorder,
            '& .alert-board-title': { color: hoverBorder },
            '& .alert-card-title': { color: '#111827' }
          }
        }}
      >
        {isNew && (
          <Box
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.3,
              bgcolor: isEven ? '#EF4444' : '#3B82F6',
              color: 'white',
              px: 0.5,
              py: 0.1,
              borderRadius: '3px',
              fontSize: '0.5rem',
              fontWeight: 900,
              boxShadow: isEven ? '0 1px 4px rgba(239, 68, 68, 0.3)' : '0 1px 4px rgba(59, 130, 246, 0.3)',
              animation: 'pulse 1.5s infinite ease-in-out',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)', opacity: 0.9 },
                '50%': { transform: 'scale(1.05)', opacity: 1 },
                '100%': { transform: 'scale(1)', opacity: 0.9 }
              }
            }}
          >
            <Box sx={{ width: 3, height: 3, bgcolor: 'white', borderRadius: '50%' }} />
            NEW 🔥
          </Box>
        )}
        <Typography 
          className="alert-board-title"
          variant="caption" 
          sx={{ 
            fontWeight: 850, 
            color: textCol, 
            textTransform: 'uppercase', 
            fontSize: '0.58rem',
            letterSpacing: 0.3,
            mb: 0.3,
            pr: isNew ? 4 : 0,
            transition: 'color 0.2s ease'
          }}
        >
          {alert.boardName || 'Official Board'}
        </Typography>
        <Typography 
          className="alert-card-title"
          variant="body2" 
          sx={{ 
            fontWeight: 750, 
            color: '#374151', 
            lineHeight: 1.3,
            fontSize: '0.76rem',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            mb: 0.4,
            transition: 'color 0.2s ease'
          }}
        >
          {alert.title}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.58rem' }}>
            {new Date(alert.createdAt).toLocaleDateString()}
          </Typography>
          <Typography variant="caption" sx={{ color: textCol, fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.2 }}>
            Apply ↗
          </Typography>
        </Box>
      </Box>
    </Link>
  );
};

const CategoryRowSlider = ({ categoryName, posts, loading }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const mobileScrollRef = useRef(null);
  const sliderRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  // Setup Intersection Observer for lazy autoplay with browser compatibility fallback
  useEffect(() => {
    if (typeof window === 'undefined' || !sliderRef.current) return;
    if (!window.IntersectionObserver) {
      setIsIntersecting(true);
      return;
    }
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, { threshold: 0.1 });

    observer.observe(sliderRef.current);
    return () => observer.disconnect();
  }, []);

  // Split posts into pages of 4 items for desktop
  const desktopPages = [];
  for (let i = 0; i < posts.length; i += 4) {
    desktopPages.push(posts.slice(i, i + 4));
  }

  // Split posts into pages of 2 items for mobile
  const mobilePages = [];
  for (let i = 0; i < posts.length; i += 2) {
    mobilePages.push(posts.slice(i, i + 2));
  }

  const maxSlide = Math.max(0, desktopPages.length - 1);

  const handleNext = () => {
    if (currentSlide < maxSlide) {
      setCurrentSlide(prev => prev + 1);
      setLastInteraction(Date.now());
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      setLastInteraction(Date.now());
    }
  };

  // Autoplay slideshow timer (only active when category section is visible in the viewport)
  useEffect(() => {
    if (loading || posts.length === 0 || !isIntersecting) return;

    const timer = setInterval(() => {
      // 1. Desktop Autoplay
      if (maxSlide > 0) {
        setCurrentSlide(prev => (prev < maxSlide ? prev + 1 : 0));
      }

      // 2. Mobile Autoplay
      if (mobileScrollRef.current) {
        const container = mobileScrollRef.current;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        const currentScrollLeft = container.scrollLeft;

        let nextScrollLeft = currentScrollLeft + clientWidth;
        if (nextScrollLeft + clientWidth >= scrollWidth - 10) {
          nextScrollLeft = 0;
        }

        container.scrollTo({
          left: nextScrollLeft,
          behavior: 'smooth'
        });
      }
    }, 6000); // Autoplay every 6 seconds

    return () => clearInterval(timer);
  }, [posts, loading, isIntersecting, maxSlide, currentSlide, lastInteraction]);

  if (loading) {
    return (
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" component="h3" sx={{ fontWeight: 700, mb: 3, fontSize: { xs: '1.25rem', md: '1.5rem' }, color: '#111827' }}>
          {categoryName}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: '24px' }}>
          {[...Array(4)].map((_, idx) => (
            <Box key={idx} sx={{ height: 280, bgcolor: '#f3f4f6', borderRadius: '16px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (posts.length === 0) return null;

  return (
    <Box ref={sliderRef} sx={{ mb: 6, position: 'relative' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 5, height: 26, bgcolor: '#4F46E5', borderRadius: '4px' }} />
          <Typography
            variant="h3"
            component="h3"
            sx={{
              fontWeight: 850, 
              color: '#0f172a', 
              letterSpacing: '-0.025em',
              fontSize: { xs: '1.35rem', sm: '1.55rem', md: '1.75rem' }
            }}
          >
            {categoryName}
          </Typography>
        </Box>
        <Button
          component={Link}
          to={`/category/${encodeURIComponent(categoryName)}`}
          sx={{
            fontWeight: 700, 
            fontSize: { xs: '0.85rem', md: '0.92rem' },
            color: '#4F46E5',
            borderRadius: '8px',
            px: 1.5,
            py: 0.5,
            '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.08)' }
          }}
        >
          View all →
        </Button>
      </Box>

      {/* Desktop Slider View (sm and up) */}
      <Box sx={{ display: { xs: 'none', sm: 'block' }, position: 'relative', width: '100%' }}>
        <Box sx={{ overflow: 'hidden', width: '100%', borderRadius: '16px' }}>
          <Box sx={{
            display: 'flex',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: `translate3d(-${currentSlide * 100}%, 0, 0)`,
            width: '100%'
          }}>
            {desktopPages.map((pageItems, pageIdx) => (
              <Box key={pageIdx} sx={{ flex: '0 0 100%', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
                {pageItems.map((post) => (
                  <Box key={post._id} component="article" sx={{ minWidth: 0 }}>
                    <PostCard post={post} headingLevel="h4" />
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Desktop Navigation Arrows */}
        {currentSlide > 0 && (
          <IconButton
            onClick={handlePrev}
            aria-label="Previous Slide"
            sx={{
              position: 'absolute',
              left: -20,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #E5E7EB',
              color: '#374151',
              zIndex: 10,
              width: 40,
              height: 40,
              '&:hover': { bgcolor: '#F3F4F6' }
            }}
          >
            <ChevronLeft />
          </IconButton>
        )}

        {currentSlide < maxSlide && (
          <IconButton
            onClick={handleNext}
            aria-label="Next Slide"
            sx={{
              position: 'absolute',
              right: -20,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #E5E7EB',
              color: '#374151',
              zIndex: 10,
              width: 40,
              height: 40,
              '&:hover': { bgcolor: '#F3F4F6' }
            }}
          >
            <ChevronRight />
          </IconButton>
        )}
      </Box>

      {/* Mobile Swipeable View (xs, finger scroll, 1 prominent wide card view with peek next) */}
      <Box
        ref={mobileScrollRef}
        onTouchStart={() => setLastInteraction(Date.now())}
        sx={{
          display: { xs: 'flex', sm: 'none' },
          overflowX: 'auto',
          gap: 2,
          pb: 1.5,
          px: 0.5,
          scrollSnapType: 'x mandatory',
          '&::-webkit-scrollbar': { display: 'none' }
        }}
      >
        {posts.map((post) => (
          <Box key={post._id} component="article" sx={{ flex: '0 0 82%', width: '82%', scrollSnapAlign: 'start' }}>
            <PostCard post={post} headingLevel="h4" />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default function HomePage() {
  const { posts, loading, error } = usePosts({ limit: 1 });
  const featuredPost = posts.length > 0 ? posts[0] : null;
  const regularPosts = [];

  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const mobileScrollRef = useRef(null);
  const mobileStoriesScrollRef = useRef(null);

  const [categoriesData, setCategoriesData] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [stories, setStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);

  const handleNext = () => {
    const maxSlide = Math.max(0, Math.ceil(alerts.length / 8) - 1);
    if (currentSlide < maxSlide) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const desktopPages = [];
  for (let i = 0; i < alerts.length; i += 8) {
    desktopPages.push(alerts.slice(i, i + 8));
  }

  const mobilePairs = [];
  for (let i = 0; i < alerts.length; i += 2) {
    mobilePairs.push(alerts.slice(i, i + 2));
  }

  useEffect(() => {
    request('/api/public/live-alerts?status=active&limit=24')
      .then(res => {
        if (res.success) {
          setAlerts(res.data || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingAlerts(false));
  }, []);
  useEffect(() => {
    request('/api/public/web-stories?limit=12')
      .then(res => {
        if (res.success) {
          setStories(res.data || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingStories(false));
  }, []);
  useEffect(() => {
    const categories = [
      'Sarkari Jobs & Exams',
      'Health & Wellness',
      'Tech & Tutorials',
      'AI & Web Tools',
      'News & Trends',
      'Finance & Business'
    ];

    setLoadingCategories(true);
    Promise.all(
      categories.map(cat => 
        request(`/api/posts?category=${encodeURIComponent(cat)}&limit=12`)
          .then(res => ({ category: cat, posts: res.posts || [] }))
          .catch(err => {
            console.error(`Error fetching category ${cat}:`, err);
            return { category: cat, posts: [] };
          })
      )
    ).then(results => {
      const dataMap = {};
      results.forEach(item => {
        dataMap[item.category] = item.posts;
      });
      setCategoriesData(dataMap);
      setLoadingCategories(false);
    });
  }, []);
  // Autoplay slideshow timer (advances every 5 seconds, manual arrow click resets the timer)
  useEffect(() => {
    if (loadingAlerts || alerts.length === 0) return;
    
    const maxSlide = Math.max(0, Math.ceil(alerts.length / 8) - 1);

    const timer = setInterval(() => {
      // 1. Desktop Slider Autoplay
      if (maxSlide > 0) {
        setCurrentSlide(prev => (prev < maxSlide ? prev + 1 : 0));
      }

      // 2. Mobile Slider Autoplay
      if (mobileScrollRef.current) {
        const container = mobileScrollRef.current;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        const currentScrollLeft = container.scrollLeft;

        // Advance by one full page/screen width
        let nextScrollLeft = currentScrollLeft + clientWidth;

        // If we have reached near the end of scrollable content, wrap back to 0
        if (nextScrollLeft + clientWidth >= scrollWidth - 10) {
          nextScrollLeft = 0;
        }

        container.scrollTo({
          left: nextScrollLeft,
          behavior: 'smooth'
        });
      }

      // 3. Mobile Web Stories Autoplay
      if (mobileStoriesScrollRef.current && window.innerWidth < 600 && stories.length > 2) {
        const container = mobileStoriesScrollRef.current;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        const currentScrollLeft = container.scrollLeft;

        // Slide by half of the screen size (roughly 1 card + gap spacing)
        let nextScrollLeft = currentScrollLeft + (clientWidth / 2 + 10);
        if (nextScrollLeft >= scrollWidth - clientWidth - 10) {
          nextScrollLeft = 0;
        }

        container.scrollTo({
          left: nextScrollLeft,
          behavior: 'smooth'
        });
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [alerts, loadingAlerts, currentSlide, stories, loadingStories]);

  return (
    <Layout>
      <Seo title="Digital Home | Your Daily Dose of Information & Insights" description="Sarkari Result, Admit Card, Latest Jobs, Vacancies, Sarkari Result Tools, Kids Games (बचो का गेम), Health, Education, and Tech Insights from Digital Home Blog." keywords="sarkari result, admit card, latest jobs, vacancies, govt jobs, sarkari result tools, kids games, bacho ka game, health tips, education, tech tutorials, all insights blog, digital home" />

      <Typography
        component="h1"
        sx={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        }}
      >
        Digital Home - Latest Sarkari Jobs, Exams & Tech Updates
      </Typography>

      {/* Live Job Alerts Board Section */}
      <Box 
        component="section" 
        sx={{ 
          pt: { xs: 2.5, md: 3 }, 
          pb: { xs: 2.5, md: 3.5 }, 
          borderBottom: '1px solid #ECECEC',
          bgcolor: '#FFFFFF'
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: '#EF4444',
                  animation: 'pulse 1.6s infinite ease-in-out',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(0.8)', opacity: 0.5 },
                    '50%': { transform: 'scale(1.4)', opacity: 1 },
                    '100%': { transform: 'scale(0.8)', opacity: 0.5 }
                  }
                }} 
              />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800, color: '#111827', letterSpacing: '-0.02em',
                  fontSize: { xs: '1.4rem', md: '1.8rem' }
                }}
              >
                Live Job Alerts & Updates
              </Typography>
            </Box>
            <Button
              component={Link}
              to="/job-alerts"
              sx={{
                fontWeight: 700, fontSize: '0.85rem',
                color: '#EF4444',
                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.04)' }
              }}
            >
              View All Alerts →
            </Button>
          </Box>

          {loadingAlerts ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>Loading updates...</Typography>
          ) : alerts.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, fontStyle: 'italic' }}>No active updates at the moment.</Typography>
          ) : (
            <>
              {/* Desktop Slider View (sm and up) */}
              <Box sx={{ display: { xs: 'none', sm: 'block' }, position: 'relative', width: '100%' }}>
                <Box sx={{ overflow: 'hidden', width: '100%', borderRadius: '12px' }}>
                  <Box sx={{
                    display: 'flex',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: `translate3d(-${currentSlide * 100}%, 0, 0)`,
                    width: '100%'
                  }}>
                    {desktopPages.map((pageItems, pageIdx) => (
                      <Box key={pageIdx} sx={{ flex: '0 0 100%', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, px: 0.5 }}>
                        {pageItems.map((alert, idx) => (
                          <AlertCard key={alert._id} alert={alert} idx={pageIdx * 8 + idx} />
                        ))}
                      </Box>
                    ))}
                  </Box>
                </Box>
                
                {/* Arrow navigation buttons */}
                {currentSlide > 0 && (
                  <IconButton 
                    onClick={handlePrev}
                    aria-label="Previous Slide"
                    sx={{
                      position: 'absolute',
                      left: -20,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      border: '1px solid #E5E7EB',
                      color: '#374151',
                      zIndex: 10,
                      width: 40,
                      height: 40,
                      '&:hover': { bgcolor: '#F3F4F6' }
                    }}
                  >
                    <ChevronLeft />
                  </IconButton>
                )}

                {currentSlide < desktopPages.length - 1 && (
                  <IconButton 
                    onClick={handleNext}
                    aria-label="Next Slide"
                    sx={{
                      position: 'absolute',
                      right: -20,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      border: '1px solid #E5E7EB',
                      color: '#374151',
                      zIndex: 10,
                      width: 40,
                      height: 40,
                      '&:hover': { bgcolor: '#F3F4F6' }
                    }}
                  >
                    <ChevronRight />
                  </IconButton>
                )}
              </Box>

              {/* Mobile Swipeable View (xs, finger scroll, no arrows, 2 rows of cards) */}
              <Box 
                ref={mobileScrollRef}
                sx={{
                display: { xs: 'flex', sm: 'none' },
                overflowX: 'auto',
                gap: 2,
                pb: 1.5,
                px: 0.5,
                scrollSnapType: 'x mandatory',
                '&::-webkit-scrollbar': { display: 'none' }
              }}>
                {mobilePairs.map((pair, pairIdx) => (
                  <Box key={pairIdx} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: '0 0 calc(50% - 8px)', scrollSnapAlign: 'start' }}>
                    {pair.map((alert, idx) => (
                      <Box key={alert._id} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <AlertCard alert={alert} idx={pairIdx * 2 + idx} />
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Container>
      </Box>

      {/* Web Stories Section */}
      {!loadingStories && stories.length > 0 && (
        <Box 
          component="section" 
          sx={{ 
            py: { xs: 3, md: 4 }, 
            bgcolor: '#F9FAFB', 
            borderBottom: '1px solid #ECECEC'
          }}
        >
          <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box 
                  sx={{ 
                    px: 1.5, py: 0.5,
                    bgcolor: '#2563EB',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    animation: 'pulseGlow 2s infinite ease-in-out',
                    '@keyframes pulseGlow': {
                      '0%': { boxShadow: '0 0 0 0 rgba(37,99,235,0.7)' },
                      '70%': { boxShadow: '0 0 0 10px rgba(37,99,235,0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(37,99,235,0)' }
                    }
                  }}
                >
                  Stories
                </Box>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800, color: '#111827', letterSpacing: '-0.02em',
                    fontSize: { xs: '1.4rem', md: '1.8rem' }
                  }}
                >
                  Visual Web Stories
                </Typography>
              </Box>
            </Box>

            <Box 
              ref={mobileStoriesScrollRef}
              sx={{ 
                display: 'flex',
                gap: 2.5,
                overflowX: 'auto',
                pb: 2,
                pt: 0.5,
                px: 0.5,
                scrollSnapType: 'x mandatory',
                '&::-webkit-scrollbar': { height: '6px' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#E5E7EB', borderRadius: '99px' },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }
              }}
            >
              {stories.map((story) => (
                <Box 
                  key={story._id}
                  component="a"
                  href={`/web-stories/${story.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    flex: { xs: '0 0 160px', sm: '0 0 200px', md: '0 0 220px' },
                    aspectRatio: '9/16',
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 12px 25px rgba(37,99,235,0.25)',
                      '& img': {
                        transform: 'scale(1.08)'
                      }
                    }
                  }}
                >
                  {/* Background Image */}
                  <Box 
                    component="img"
                    src={story.slides[0]?.image}
                    alt={story.title}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      transition: 'transform 0.5s ease'
                    }}
                  />
                  {/* Overlay Gradient */}
                  <Box 
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '70%',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      p: 2,
                      color: '#fff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <Typography 
                      sx={{
                        fontSize: { xs: '0.85rem', sm: '0.95rem' },
                        fontWeight: 800,
                        lineHeight: 1.3,
                        mb: 0.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textShadow: '0 1.5px 3px rgba(0,0,0,0.8)'
                      }}
                    >
                      {story.title}
                    </Typography>
                    <Typography 
                      sx={{
                        fontSize: '0.65rem',
                        opacity: 0.8,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {new Date(story.createdAt).toLocaleDateString('hi-IN', { month: 'short', day: 'numeric' })}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>
      )}

      {/* Hero Section - Featured Article (H1) or Loading Skeleton (Unified to prevent CLS) */}
      <Box component="section" sx={{ pt: { xs: 2.5, md: 4 }, pb: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 3, md: 5 },
            alignItems: { md: 'center' }
          }}>
            {/* Image (left side) */}
            <Box 
              component={!loading && featuredPost ? Link : Box} 
              {...(!loading && featuredPost ? { to: postUrl(featuredPost) } : {})}
              sx={{ 
                textDecoration: 'none', 
                flex: { md: '0 0 55%' }, 
                display: 'block',
                width: '100%'
              }}
            >
              <Box sx={{ 
                position: 'relative', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                aspectRatio: '16/9',
                width: '100%',
                bgcolor: '#f1f5f9'
              }}>
                {loading ? (
                  <Box sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: '#e2e8f0',
                    animation: 'pulse 1.5s infinite ease-in-out'
                  }} />
                ) : featuredPost?.featuredImage ? (
                  <Box
                    component="img"
                    src={optimizeImage(featuredPost.featuredImage, 700)}
                    alt={featuredPost.title}
                    width="700"
                    height="380"
                    loading="eager"
                    fetchPriority="high"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.4s ease',
                      '&:hover': { transform: 'scale(1.02)' },
                    }}
                  />
                ) : featuredPost ? (
                  <Box sx={{ width: '100%', height: '100%', bgcolor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>{featuredPost.category}</Typography>
                  </Box>
                ) : null}
              </Box>
            </Box>
 
            {/* Content (right side) */}
            <Box 
              sx={{ 
                flex: { md: '0 0 40%' }, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                width: '100%'
              }}
            >
              {loading ? (
                <>
                  <Box sx={{ height: 36, bgcolor: '#ECECEC', borderRadius: '8px', mb: 2, width: '90%', animation: 'pulse 1.5s infinite ease-in-out' }} />
                  <Box sx={{ height: 20, bgcolor: '#ECECEC', borderRadius: '8px', mb: 1, width: '100%', animation: 'pulse 1.5s infinite ease-in-out' }} />
                  <Box sx={{ height: 20, bgcolor: '#ECECEC', borderRadius: '8px', mb: 1, width: '95%', animation: 'pulse 1.5s infinite ease-in-out' }} />
                  <Box sx={{ height: 20, bgcolor: '#ECECEC', borderRadius: '8px', mb: 3, width: '70%', animation: 'pulse 1.5s infinite ease-in-out' }} />
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#ECECEC', animation: 'pulse 1.5s infinite ease-in-out' }} />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ height: 16, bgcolor: '#ECECEC', borderRadius: '4px', mb: 0.5, width: '40%', animation: 'pulse 1.5s infinite ease-in-out' }} />
                      <Box sx={{ height: 12, bgcolor: '#ECECEC', borderRadius: '4px', width: '30%', animation: 'pulse 1.5s infinite ease-in-out' }} />
                    </Box>
                  </Box>
                </>
              ) : featuredPost ? (
                <>
                  <Box sx={{ mb: 1.5 }}>
                    <Chip
                      label={featuredPost.category}
                      size="small"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        borderRadius: '8px',
                        px: 1,
                        height: 28,
                      }}
                    />
                  </Box>
                  <Link to={postUrl(featuredPost)} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography
                      variant="h1"
                      sx={{
                        fontWeight: 900,
                        mb: 1.5,
                        fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.25rem' },
                        lineHeight: 1.25,
                        color: '#0f172a',
                        letterSpacing: '-0.035em',
                        transition: 'color 0.2s ease-in-out',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      {featuredPost.title}
                    </Typography>
                  </Link>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 2.5,
                      color: '#4B5563',
                      fontSize: { xs: '0.85rem', md: '0.95rem' },
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {featuredPost.excerpt}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: '#4F46E5', fontSize: '0.9rem', fontWeight: 600 }}>
                      {featuredPost.author?.charAt(0) || 'H'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                        {featuredPost.author || 'Harry Prince'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#4B5563', fontWeight: 500, fontSize: '0.75rem' }}>
                        {new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}{featuredPost.readingTime || 5} min read
                      </Typography>
                    </Box>
                  </Box>
                </>
              ) : null}
            </Box>
          </Box>
        </Container>
        {loading && (
          <style>{`
            @keyframes pulse {
              0% { opacity: 0.6; }
              50% { opacity: 1; }
              100% { opacity: 0.6; }
            }
          `}</style>
        )}
      </Box>

      {/* Latest Insights Section (H2) */}
      <Box component="section" sx={{ py: { xs: 4, md: 6 }, bgcolor: '#F9FAFB' }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 750, color: '#111827', letterSpacing: '-0.02em', mb: 5,
              fontSize: { xs: '1.5rem', md: '2rem' }
            }}
          >
            Latest Insights
          </Typography>

          {[
            'Sarkari Jobs & Exams',
            'Health & Wellness',
            'Tech & Tutorials',
            'AI & Web Tools',
            'News & Trends',
            'Finance & Business'
          ].map(cat => (
            <CategoryRowSlider 
              key={cat}
              categoryName={cat}
              posts={categoriesData[cat] || []}
              loading={loadingCategories}
            />
          ))}
        </Container>
      </Box>

      {/* Explore Tools & Games Section (H2) */}
      <Box 
        component="section"
        id="inkspire-utility-box"
        sx={{ 
          minHeight: { xs: '736px', md: '440px' }, 
          contain: 'layout', 
          display: 'block', 
          py: { xs: 3, md: 4.5 }
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', mb: 4,
              fontSize: { xs: '1.5rem', md: '2rem' }
            }}
          >
            Explore More
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: '24px' }}>
            {/* Tools Card */}
            <Link to="/tools" style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  p: { xs: 3, md: 4 }, borderRadius: '24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white', height: { xs: 280, md: 280 },
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 20px 60px rgba(102,126,234,0.3)' }
                }}
              >
                <Typography sx={{ fontSize: '2.5rem', mb: 1.5 }}>🛠️</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '1.5rem', mb: 1, color: 'white' }}>
                  Student Utility Tools
                </Typography>
                <Typography sx={{ opacity: 0.9, lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Photo compressor under 20KB, PDF tools, passport size maker, signature creator, image to PDF converter, and more — all free, all in your browser.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                  <Chip label="Photo Compressor" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 500 }} />
                  <Chip label="PDF Tools" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 500 }} />
                  <Chip label="Passport Size" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 500 }} />
                </Box>
              </Box>
            </Link>

            {/* Games Card */}
            <Link to="/games" style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  p: { xs: 3, md: 4 }, borderRadius: '24px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white', height: { xs: 280, md: 280 },
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 20px 60px rgba(245,87,108,0.3)' }
                }}
              >
                <Typography sx={{ fontSize: '2.5rem', mb: 1.5 }}>🎮</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '1.5rem', mb: 1, color: 'white' }}>
                  Kids Educational Games
                </Typography>
                <Typography sx={{ opacity: 0.9, lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Fun learning games for kids — alphabet matching, math booster, animal shadow & sound quiz. Playful way to learn while having fun!
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                  <Chip label="Alphabet Quiz" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 500 }} />
                  <Chip label="Math Booster" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 500 }} />
                  <Chip label="Animal Sounds" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 500 }} />
                </Box>
              </Box>
            </Link>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
}
