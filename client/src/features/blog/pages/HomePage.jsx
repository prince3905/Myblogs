import { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box, Chip, Avatar, IconButton, CircularProgress } from '@mui/material';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import WhatsApp from '@mui/icons-material/WhatsApp';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import { usePosts } from '../../../hooks/usePosts';
import { postUrl, catSlug } from '../../../shared/lib/category';
import { optimizeImage } from '../../../shared/lib/images';
import { request } from '../../../shared/lib/api';

const QUICK_EXAM_FILTERS = [
  { label: '🌟 All Updates', query: '', color: '#4F46E5', icon: '⚡' },
  { label: '📚 Daily Current Affairs & Quiz', query: '__current_affairs__', color: '#10B981', icon: '🔥' },
  { label: '🚆 Railway / RRB', query: 'rrb', color: '#0284C7', icon: '🚆' },
  { label: '📋 SSC Exams', query: 'ssc', color: '#D97706', icon: '📋' },
  { label: '🏦 Bank / IBPS / SBI', query: 'bank', color: '#059669', icon: '🏦' },
  { label: '👮 Police & Defence / Army', query: 'police', color: '#DC2626', icon: '👮' },
  { label: '🏢 BPSC / State PSC', query: 'bpsc', color: '#7C3AED', icon: '🏢' },
  { label: '📑 UPSSSC / UKSSSC', query: 'upsssc', color: '#EA580C', icon: '📑' },
  { label: '🎓 10th & 12th Board Results', query: 'board', color: '#E11D48', icon: '🎓' },
  { label: '🔑 Answer Keys', query: 'answer key', color: '#0D9488', icon: '🔑' },
  { label: '📄 Syllabus & Pattern', query: 'syllabus', color: '#4338CA', icon: '📄' },
  { label: '🎓 Admissions & CUET', query: 'admission', color: '#9333EA', icon: '🎓' },
  { label: '🛠️ Free Student Tools', query: '__tools__', color: '#2563EB', icon: '🛠️' }
];

const InteractivePillMarquee = () => {
  const items = QUICK_EXAM_FILTERS;

  return (
    <Box 
      sx={{ 
        mb: 2.5, 
        position: 'relative',
        width: '100%',
        py: 0.5
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.2,
          overflowX: 'auto',
          py: 0.8,
          px: 0.5,
          cursor: 'grab',
          userSelect: 'none',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { height: '4px' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '10px' },
          '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.02)' }
        }}
      >
        {items.map((f, i) => {
          const targetUrl = f.query === '__tools__' 
            ? '/tools' 
            : f.query === '__current_affairs__'
            ? '/current-affairs'
            : (f.query ? `/job-alerts?search=${encodeURIComponent(f.query)}` : '/job-alerts');
          return (
            <Chip
              key={i}
              component={Link}
              to={targetUrl}
              label={`${f.icon} ${f.label}`}
              clickable
              sx={{
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '0.78rem',
                py: 2.1,
                px: 1.3,
                borderRadius: '30px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                bgcolor: '#FFFFFF',
                color: '#334155',
                border: '1.5px solid #E2E8F0',
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                '&:hover': {
                  bgcolor: `${f.color}15`,
                  color: f.color,
                  borderColor: f.color,
                  transform: 'translateY(-2px)'
                }
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

const InteractiveAlertsMarquee = ({ alerts = [], onLoadMore, hasMore = false, loadingMore = false }) => {
  const scrollContainerRef = useRef(null);

  const handleScroll = (e) => {
    const container = e.target;
    if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 250) {
      if (hasMore && !loadingMore && onLoadMore) {
        onLoadMore();
      }
    }
  };

  const handleScrollManual = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -320 : 320;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    if (direction === 'right' && hasMore && !loadingMore && onLoadMore) {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 500) {
        onLoadMore();
      }
    }
  };

  if (!alerts || alerts.length === 0) return null;

  // Group alerts into 2-card vertical stacks (2 rows per column)
  const displayPairs = [];
  for (let i = 0; i < alerts.length; i += 2) {
    displayPairs.push(alerts.slice(i, i + 2));
  }

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        width: '100%', 
        overflow: 'hidden',
        py: 0.5
      }}
    >
      {/* Left Navigation Arrow */}
      <IconButton 
        onClick={() => handleScrollManual('left')}
        aria-label="Scroll Left"
        sx={{
          position: 'absolute',
          left: 4,
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          border: '1px solid #E5E7EB',
          color: '#374151',
          zIndex: 10,
          width: 36,
          height: 36,
          display: { xs: 'none', sm: 'inline-flex' },
          '&:hover': { bgcolor: '#F3F4F6' }
        }}
      >
        <ChevronLeft sx={{ fontSize: 20 }} />
      </IconButton>

      {/* Right Navigation Arrow */}
      <IconButton 
        onClick={() => handleScrollManual('right')}
        aria-label="Scroll Right"
        sx={{
          position: 'absolute',
          right: 4,
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          border: '1px solid #E5E7EB',
          color: '#374151',
          zIndex: 10,
          width: 36,
          height: 36,
          display: { xs: 'none', sm: 'inline-flex' },
          '&:hover': { bgcolor: '#F3F4F6' }
        }}
      >
        <ChevronRight sx={{ fontSize: 20 }} />
      </IconButton>

      {/* Scrollable Track */}
      <Box
        ref={scrollContainerRef}
        onScroll={handleScroll}
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 1.5,
          overflowX: 'auto',
          py: 1,
          px: { xs: 1.5, sm: 1 },
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: { xs: 'x mandatory', sm: 'none' },
          '&::-webkit-scrollbar': { height: '4px' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '10px' },
          '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.02)' }
        }}
      >
        {displayPairs.map((pair, pIdx) => (
          <Box 
            key={pIdx} 
            sx={{ 
              flex: { xs: '0 0 280px', sm: '0 0 270px', md: '0 0 270px' }, 
              width: { xs: '280px', sm: '270px', md: '270px' },
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}
          >
            {pair.map((alert, idx) => (
              <Box key={alert._id} sx={{ flex: 1, minHeight: '95px', display: 'flex' }}>
                <AlertCard alert={alert} idx={pIdx * 2 + idx} />
              </Box>
            ))}
          </Box>
        ))}

        {loadingMore && (
          <Box sx={{ flex: '0 0 80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={24} sx={{ color: '#4F46E5' }} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

const InteractiveStoriesMarquee = ({ stories = [], onLoadMore, hasMore = false, loadingMore = false }) => {
  const scrollContainerRef = useRef(null);

  const handleScroll = (e) => {
    const container = e.target;
    if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 250) {
      if (hasMore && !loadingMore && onLoadMore) {
        onLoadMore();
      }
    }
  };

  const handleScrollManual = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -280 : 280;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    if (direction === 'right' && hasMore && !loadingMore && onLoadMore) {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 450) {
        onLoadMore();
      }
    }
  };

  if (!stories || stories.length === 0) return null;

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        width: '100%', 
        overflow: 'hidden',
        py: 0.5
      }}
    >
      {/* Left Navigation Arrow */}
      <IconButton 
        onClick={() => handleScrollManual('left')}
        aria-label="Scroll Left"
        sx={{
          position: 'absolute',
          left: 4,
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          border: '1px solid #E5E7EB',
          color: '#374151',
          zIndex: 10,
          width: 36,
          height: 36,
          display: { xs: 'none', sm: 'inline-flex' },
          '&:hover': { bgcolor: '#F3F4F6' }
        }}
      >
        <ChevronLeft sx={{ fontSize: 20 }} />
      </IconButton>

      {/* Right Navigation Arrow */}
      <IconButton 
        onClick={() => handleScrollManual('right')}
        aria-label="Scroll Right"
        sx={{
          position: 'absolute',
          right: 4,
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          border: '1px solid #E5E7EB',
          color: '#374151',
          zIndex: 10,
          width: 36,
          height: 36,
          display: { xs: 'none', sm: 'inline-flex' },
          '&:hover': { bgcolor: '#F3F4F6' }
        }}
      >
        <ChevronRight sx={{ fontSize: 20 }} />
      </IconButton>

      {/* Scrollable Track */}
      <Box
        ref={scrollContainerRef}
        onScroll={handleScroll}
        sx={{
          display: 'flex',
          gap: 2.2,
          overflowX: 'auto',
          py: 1,
          px: { xs: 1, sm: 1 },
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: { xs: 'x mandatory', sm: 'none' },
          '&::-webkit-scrollbar': { height: '4px' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '10px' },
          '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.02)' }
        }}
      >
        {stories.map((story, sIdx) => (
          <Box 
            key={`${story._id}-${sIdx}`}
            component="a"
            href={`/web-stories/${story.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              flex: { xs: '0 0 160px', sm: '0 0 190px', md: '0 0 210px' },
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
              src={optimizeImage(story.slides[0]?.image, 220, 391)}
              alt={story.title}
              width="220"
              height="391"
              loading={sIdx < 2 ? "eager" : "lazy"}
              fetchpriority={sIdx === 0 ? "high" : "auto"}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />

            {/* Gradient Overlay */}
            <Box 
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.85) 100%)'
              }}
            />

            {/* Top Badge: Slide Count */}
            <Box 
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                bgcolor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                color: '#fff',
                px: 0.8,
                py: 0.2,
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 0.4
              }}
            >
              📖 {story.slides?.length || 5}
            </Box>

            {/* Content Bottom */}
            <Box 
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.4
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#60A5FA', 
                  fontWeight: 800, 
                  textTransform: 'uppercase',
                  fontSize: '0.62rem',
                  letterSpacing: 0.5
                }}
              >
                {story.category || 'Web Story'}
              </Typography>
              <Typography 
                sx={{
                  color: '#fff',
                  fontWeight: 750,
                  fontSize: { xs: '0.78rem', sm: '0.85rem' },
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textShadow: '0 2px 4px rgba(0,0,0,0.6)'
                }}
              >
                {story.title}
              </Typography>
            </Box>
          </Box>
        ))}

        {loadingMore && (
          <Box sx={{ flex: '0 0 80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={24} sx={{ color: '#4F46E5' }} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 0.4, borderTop: '1px dashed rgba(0,0,0,0.08)' }}>
          <Typography variant="caption" sx={{ color: '#4B5563', fontSize: '0.62rem', fontWeight: 700 }}>
            📅 {new Date(alert.parsedPostDate || alert.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Typography>
          {alert.lastDate && alert.lastDate !== 'N/A' && alert.lastDate !== 'Check Detail Page' ? (
            <Typography variant="caption" sx={{ color: '#DC2626', fontSize: '0.62rem', fontWeight: 800, bgcolor: '#FEE2E2', px: 0.6, py: 0.1, borderRadius: '4px' }}>
              ⏳ {alert.lastDate}
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: textCol, fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.2 }}>
              Apply ↗
            </Typography>
          )}
        </Box>
      </Box>
    </Link>
  );
};

const QUICK_PILLARS = [
  {
    title: 'Latest Jobs',
    subtitle: 'Govt & State Vacancies',
    category: 'Latest Jobs',
    url: '/job-alerts?category=Latest+Jobs',
    icon: '💼',
    gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
    borderColor: '#3B82F6',
    accentColor: '#1D4ED8',
    countBadge: '500+ Active',
    badgeBg: '#DBEAFE',
    badgeColor: '#1E40AF'
  },
  {
    title: 'Results',
    subtitle: 'Scorecards & Merit Lists',
    category: 'Results',
    url: '/job-alerts?category=Results',
    icon: '🏆',
    gradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
    borderColor: '#10B981',
    accentColor: '#047857',
    countBadge: '30+ Live',
    badgeBg: '#D1FAE5',
    badgeColor: '#065F46'
  },
  {
    title: 'Admit Card',
    subtitle: 'Hall Tickets & Call Letters',
    category: 'Admit Card',
    url: '/job-alerts?category=Admit+Card',
    icon: '🎫',
    gradient: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
    borderColor: '#6366F1',
    accentColor: '#4338CA',
    countBadge: '20+ Active',
    badgeBg: '#E0E7FF',
    badgeColor: '#3730A3'
  },
  {
    title: 'Answer Key',
    subtitle: 'Keys & Objections',
    category: 'Answer Key',
    url: '/job-alerts?category=Answer+Key',
    icon: '🔑',
    gradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
    borderColor: '#F59E0B',
    accentColor: '#B45309',
    countBadge: '25+ Keys',
    badgeBg: '#FEF3C7',
    badgeColor: '#92400E'
  }
];

const QuickActionPillars = ({ categoryCounts = {} }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: { xs: 1.5, sm: 2, md: 2.2 }
        }}
      >
        {QUICK_PILLARS.map((pillar, i) => {
          const count = categoryCounts[pillar.category] || categoryCounts[pillar.title];
          const displayBadge = count ? `${count} Active` : pillar.countBadge;
          return (
            <Box
              key={i}
              component={Link}
              to={pillar.url}
              sx={{
                textDecoration: 'none',
                p: { xs: 1.5, sm: 1.8, md: 2 },
                borderRadius: '16px',
                background: pillar.gradient,
                border: `1.5px solid ${pillar.borderColor}35`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 10px 20px ${pillar.borderColor}25`,
                  borderColor: pillar.borderColor
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
                <Box
                  sx={{
                    width: { xs: 36, md: 42 },
                    height: { xs: 36, md: 42 },
                    borderRadius: '12px',
                    bgcolor: '#FFFFFF',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: { xs: '1.2rem', md: '1.35rem' }
                  }}
                >
                  {pillar.icon}
                </Box>
                <Chip
                  label={displayBadge}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '0.62rem', md: '0.68rem' },
                    height: { xs: 20, md: 22 },
                    bgcolor: pillar.badgeBg,
                    color: pillar.badgeColor,
                    border: `1px solid ${pillar.borderColor}40`,
                    borderRadius: '6px'
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '0.92rem', sm: '1.02rem', md: '1.1rem' },
                    color: '#0F172A',
                    lineHeight: 1.25,
                    mb: 0.3
                  }}
                >
                  {pillar.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748B',
                    fontWeight: 600,
                    fontSize: { xs: '0.68rem', md: '0.74rem' },
                    display: 'block'
                  }}
                >
                  {pillar.subtitle}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const POPULAR_STATES = [
  { label: 'All India', code: 'all', icon: '🇮🇳' },
  { label: 'Uttar Pradesh', code: 'up', icon: '🏛️' },
  { label: 'Bihar', code: 'bihar', icon: '🏛️' },
  { label: 'Rajasthan', code: 'rajasthan', icon: '🏛️' },
  { label: 'Madhya Pradesh', code: 'mp', icon: '🏛️' },
  { label: 'Maharashtra', code: 'maharashtra', icon: '🏛️' },
  { label: 'Haryana', code: 'haryana', icon: '🏛️' },
  { label: 'Delhi / NCR', code: 'delhi', icon: '🏛️' },
  { label: 'West Bengal', code: 'wb', icon: '🏛️' },
  { label: 'Jharkhand', code: 'jharkhand', icon: '🏛️' },
  { label: 'Gujarat', code: 'gujarat', icon: '🏛️' },
  { label: 'Uttarakhand', code: 'uttarakhand', icon: '🏛️' },
  { label: 'Punjab', code: 'punjab', icon: '🏛️' },
  { label: 'Chhattisgarh', code: 'cg', icon: '🏛️' },
  { label: 'Karnataka', code: 'karnataka', icon: '🏛️' },
  { label: 'Tamil Nadu', code: 'tn', icon: '🏛️' },
  { label: 'Telangana', code: 'telangana', icon: '🏛️' },
  { label: 'Andhra Pradesh', code: 'ap', icon: '🏛️' },
  { label: 'Odisha', code: 'odisha', icon: '🏛️' },
  { label: 'Assam', code: 'assam', icon: '🏛️' },
  { label: 'Himachal', code: 'hp', icon: '🏛️' },
  { label: 'J&K', code: 'jk', icon: '🏛️' }
];

const StateFilterStrip = ({ activeState = 'all', onSelectState }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#64748B',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            gap: 0.6
          }}
        >
          📍 Explore Jobs & Results By State
        </Typography>
        <Link
          to="/job-alerts"
          style={{ textDecoration: 'none', color: '#2563EB', fontSize: '0.75rem', fontWeight: 700 }}
        >
          All 28 States →
        </Link>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          overflowX: 'auto',
          py: 0.5,
          userSelect: 'none',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { height: '4px' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '10px' },
          '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.02)' }
        }}
      >
        {POPULAR_STATES.map((st) => {
          const isSelected = activeState === st.code;
          return (
            <Chip
              key={st.code}
              label={`${st.icon} ${st.label}`}
              onClick={() => onSelectState(st.code)}
              clickable
              sx={{
                fontWeight: isSelected ? 800 : 600,
                fontSize: '0.75rem',
                py: 1.8,
                px: 1.2,
                borderRadius: '24px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                bgcolor: isSelected ? '#1E40AF' : '#F8FAFC',
                color: isSelected ? '#FFFFFF' : '#334155',
                border: isSelected ? '1.5px solid #1E40AF' : '1px solid #E2E8F0',
                boxShadow: isSelected ? '0 4px 10px rgba(30, 64, 175, 0.25)' : 'none',
                '&:hover': {
                  bgcolor: isSelected ? '#1D4ED8' : '#F1F5F9',
                  borderColor: isSelected ? '#1D4ED8' : '#CBD5E1'
                }
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

const HubAlertItem = ({ alert, accentColor }) => {
  const isNew = new Date() - new Date(alert.createdAt) < 7 * 24 * 60 * 60 * 1000;
  return (
    <Link
      to={`/job-alerts?alert=${alert._id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <Box
        sx={{
          py: 1.2,
          px: 1.4,
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          borderBottom: '1px solid #F1F5F9',
          '&:last-child': { borderBottom: 'none' },
          '&:hover': {
            bgcolor: '#F8FAFC',
            transform: 'translateX(3px)',
            '& .hub-item-title': { color: accentColor }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              fontSize: '0.62rem',
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: 0.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '70%'
            }}
          >
            {alert.boardName || 'Official'}
          </Typography>
          {isNew && (
            <Box
              sx={{
                bgcolor: '#EF4444',
                color: '#fff',
                fontSize: '0.52rem',
                fontWeight: 900,
                px: 0.6,
                py: 0.1,
                borderRadius: '4px',
                letterSpacing: 0.2
              }}
            >
              NEW 🔥
            </Box>
          )}
        </Box>
        <Typography
          className="hub-item-title"
          sx={{
            fontWeight: 650,
            fontSize: { xs: '0.78rem', md: '0.82rem' },
            color: '#1E293B',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: 'color 0.2s ease'
          }}
        >
          {alert.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.2 }}>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.64rem', fontWeight: 600 }}>
            📅 {new Date(alert.parsedPostDate || alert.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Typography>
          {alert.lastDate && alert.lastDate !== 'N/A' && alert.lastDate !== 'Check Detail Page' ? (
            <Typography variant="caption" sx={{ color: '#DC2626', fontSize: '0.64rem', fontWeight: 700, bgcolor: '#FEE2E2', px: 0.6, py: 0.1, borderRadius: '4px' }}>
              ⏳ {alert.lastDate}
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: accentColor, fontSize: '0.64rem', fontWeight: 700 }}>
              View ↗
            </Typography>
          )}
        </Box>
      </Box>
    </Link>
  );
};

const AdaptiveHighlightsHub = ({ results = [], admitCards = [], latestJobs = [] }) => {
  const [mobileTab, setMobileTab] = useState(0);

  const columns = [
    {
      title: 'Latest Jobs',
      icon: '💼',
      category: 'Latest Jobs',
      url: '/job-alerts?category=Latest+Jobs',
      items: latestJobs,
      headerBg: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
      accentColor: '#DC2626',
      borderColor: '#FECACA'
    },
    {
      title: 'Results',
      icon: '🏆',
      category: 'Results',
      url: '/job-alerts?category=Results',
      items: results,
      headerBg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      accentColor: '#059669',
      borderColor: '#A7F3D0'
    },
    {
      title: 'Admit Cards',
      icon: '🎫',
      category: 'Admit Card',
      url: '/job-alerts?category=Admit+Card',
      items: admitCards,
      headerBg: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
      accentColor: '#4F46E5',
      borderColor: '#C7D2FE'
    }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      {/* Desktop & Tablet: 3 Side-by-Side Professional Highlight Columns */}
      <Box
        sx={{
          display: { xs: 'none', md: 'grid' },
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2.5
        }}
      >
        {columns.map((col, idx) => (
          <Box
            key={idx}
            sx={{
              borderRadius: '16px',
              bgcolor: '#FFFFFF',
              border: `1.5px solid #E2E8F0`,
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: `0 10px 25px ${col.accentColor}20`,
                borderColor: col.borderColor
              }
            }}
          >
            {/* Column Header */}
            <Box
              sx={{
                background: col.headerBg,
                color: '#FFFFFF',
                py: 1.4,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '1.2rem' }}>{col.icon}</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em', color: '#FFFFFF' }}>
                  {col.title}
                </Typography>
              </Box>
              <Chip
                label={`${col.items.length} Live`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.22)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  height: 22
                }}
              />
            </Box>

            {/* Column List */}
            <Box sx={{ p: 1.2, flexGrow: 1, minHeight: '280px', display: 'flex', flexDirection: 'column' }}>
              {col.items.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', color: '#94A3B8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  No active {col.title.toLowerCase()} updates right now.
                </Box>
              ) : (
                col.items.map(item => (
                  <HubAlertItem key={item._id} alert={item} accentColor={col.accentColor} />
                ))
              )}
            </Box>

            {/* Column Footer */}
            <Box sx={{ p: 1.4, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
              <Button
                component={Link}
                to={col.url}
                size="small"
                sx={{
                  fontWeight: 750,
                  fontSize: '0.78rem',
                  color: col.accentColor,
                  textTransform: 'none',
                  '&:hover': { bgcolor: `${col.accentColor}12` }
                }}
              >
                View All {col.title} →
              </Button>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Mobile: 3-Tab Segmented Thumb-Friendly Switcher */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Box
          sx={{
            display: 'flex',
            bgcolor: '#F1F5F9',
            p: 0.5,
            borderRadius: '14px',
            mb: 2,
            gap: 0.5
          }}
        >
          {columns.map((col, idx) => {
            const isTabActive = mobileTab === idx;
            return (
              <Box
                key={idx}
                onClick={() => setMobileTab(idx)}
                sx={{
                  flex: 1,
                  py: 1,
                  px: 0.8,
                  borderRadius: '10px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  bgcolor: isTabActive ? '#FFFFFF' : 'transparent',
                  boxShadow: isTabActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  color: isTabActive ? col.accentColor : '#64748B'
                }}
              >
                <Typography
                  sx={{
                    fontWeight: isTabActive ? 800 : 600,
                    fontSize: '0.76rem',
                    lineHeight: 1.2
                  }}
                >
                  {col.icon} {col.title}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Mobile Active Tab Content Box */}
        {(() => {
          const activeCol = columns[mobileTab];
          return (
            <Box
              sx={{
                borderRadius: '16px',
                bgcolor: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)'
              }}
            >
              <Box
                sx={{
                  background: activeCol.headerBg,
                  color: '#FFFFFF',
                  py: 1.2,
                  px: 1.8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#FFFFFF' }}>
                  {activeCol.icon} Latest {activeCol.title}
                </Typography>
                <Chip
                  label={`${activeCol.items.length} Live`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.22)',
                    color: '#FFFFFF',
                    fontWeight: 850,
                    fontSize: '0.65rem',
                    height: 20
                  }}
                />
              </Box>
              <Box sx={{ p: 1, minHeight: '220px' }}>
                {activeCol.items.length === 0 ? (
                  <Box sx={{ py: 3, textAlign: 'center', color: '#94A3B8', fontStyle: 'italic', fontSize: '0.8rem' }}>
                    No active updates right now.
                  </Box>
                ) : (
                  activeCol.items.map(item => (
                    <HubAlertItem key={item._id} alert={item} accentColor={activeCol.accentColor} />
                  ))
                )}
              </Box>
              <Box sx={{ p: 1.2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                <Button
                  component={Link}
                  to={activeCol.url}
                  size="small"
                  fullWidth
                  sx={{
                    fontWeight: 750,
                    fontSize: '0.78rem',
                    color: activeCol.accentColor,
                    textTransform: 'none'
                  }}
                >
                  View All {activeCol.title} →
                </Button>
              </Box>
            </Box>
          );
        })()}
      </Box>
    </Box>
  );
};

const CategoryRowSlider = ({ categoryName, posts: initialPosts = [], loading: initialLoading }) => {
  const [catPosts, setCatPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const mobileScrollRef = useRef(null);
  const sliderRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  useEffect(() => {
    if (initialPosts && initialPosts.length > 0) {
      setCatPosts(initialPosts);
    }
  }, [initialPosts]);

  const loadMoreChunk = async () => {
    if (loadingMore || !hasMore) return 0;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await request(`/api/posts?category=${encodeURIComponent(categoryName)}&page=${nextPage}&limit=6`);
      const newPosts = res.posts || [];
      if (newPosts.length > 0) {
        setCatPosts(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const filtered = newPosts.filter(p => !existingIds.has(p._id));
          return [...prev, ...filtered];
        });
        setPage(nextPage);
      }
      if (newPosts.length < 6) {
        setHasMore(false);
      }
      return newPosts.length;
    } catch (err) {
      console.error(err);
      return 0;
    } finally {
      setLoadingMore(false);
    }
  };

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
  for (let i = 0; i < catPosts.length; i += 4) {
    desktopPages.push(catPosts.slice(i, i + 4));
  }

  const maxSlide = Math.max(0, desktopPages.length - 1);

  const handleNext = async () => {
    if (currentSlide < maxSlide) {
      setCurrentSlide(prev => prev + 1);
      setLastInteraction(Date.now());
      if (currentSlide >= maxSlide - 1 && hasMore && !loadingMore) {
        loadMoreChunk();
      }
    } else if (hasMore && !loadingMore) {
      const added = await loadMoreChunk();
      if (added > 0) {
        setCurrentSlide(prev => prev + 1);
        setLastInteraction(Date.now());
      }
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      setLastInteraction(Date.now());
    }
  };

  const handleMobileScroll = (e) => {
    const container = e.target;
    if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 150) {
      if (hasMore && !loadingMore) {
        loadMoreChunk();
      }
    }
  };

  // Category sliders are manually slided by user with unlimited chunk fetching

  if (initialLoading || catPosts.length === 0) {
    return (
      <Box component="section" sx={{ mb: 6, minHeight: { xs: '360px', md: '420px' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box sx={{ width: 5, height: 26, bgcolor: '#4F46E5', borderRadius: '4px' }} />
          <Typography variant="h3" component="h3" sx={{ fontWeight: 850, color: '#0f172a', fontSize: { xs: '1.35rem', sm: '1.55rem', md: '1.75rem' } }}>
            {categoryName}
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: '24px' }}>
          {[...Array(4)].map((_, idx) => (
            <Box key={idx} sx={{ height: { xs: 260, md: 320 }, bgcolor: '#f1f5f9', borderRadius: '20px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box component="section" ref={sliderRef} sx={{ mb: 6, position: 'relative', minHeight: { xs: '360px', md: '420px' } }}>
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
          to={`/category/${catSlug(categoryName)}`}
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

        {(currentSlide < maxSlide || hasMore) && (
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

      {/* Mobile Swipeable View */}
      <Box
        ref={mobileScrollRef}
        onScroll={handleMobileScroll}
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
        {catPosts.map((post) => (
          <Box key={post._id} component="article" sx={{ flex: '0 0 82%', width: '82%', scrollSnapAlign: 'start' }}>
            <PostCard post={post} headingLevel="h4" />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const LazyCategorySection = ({ categoryName, initialPosts = [] }) => {
  const [isVisible, setIsVisible] = useState(initialPosts.length > 0);
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const ref = useRef(null);

  useEffect(() => {
    if (initialPosts.length > 0) {
      setPosts(initialPosts);
      setLoading(false);
      setIsVisible(true);
      return;
    }

    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px' });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [initialPosts]);

  useEffect(() => {
    if (!isVisible || posts.length > 0) return;
    setLoading(true);
    request(`/api/posts?category=${encodeURIComponent(categoryName)}&limit=6`)
      .then(res => setPosts(res.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [isVisible, categoryName]);

  return (
    <Box ref={ref} sx={{ minHeight: isVisible ? 'auto' : { xs: '320px', md: '380px' } }}>
      {isVisible ? (
        <CategoryRowSlider
          categoryName={categoryName}
          posts={posts}
          loading={loading}
        />
      ) : null}
    </Box>
  );
};

const HeroSectionSlider = ({ initialPosts = [], loading: initialLoading }) => {
  const [heroPosts, setHeroPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (initialPosts && initialPosts.length > 0) {
      setHeroPosts(initialPosts);
    }
  }, [initialPosts]);

  const loadMoreHeroChunk = async () => {
    if (loadingMore || !hasMore) return 0;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await request(`/api/posts?category=${encodeURIComponent('Sarkari Jobs & Exams')}&page=${nextPage}&limit=6`);
      const newPosts = res.posts || [];
      if (newPosts.length > 0) {
        setHeroPosts(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const filtered = newPosts.filter(p => !existingIds.has(p._id));
          return [...prev, ...filtered];
        });
        setPage(nextPage);
      }
      if (newPosts.length < 6) {
        setHasMore(false);
      }
      return newPosts.length;
    } catch (err) {
      console.error(err);
      return 0;
    } finally {
      setLoadingMore(false);
    }
  };

  const handleNext = async () => {
    if (currentSlide < heroPosts.length - 1) {
      setCurrentSlide(prev => prev + 1);
      if (currentSlide >= heroPosts.length - 2 && hasMore && !loadingMore) {
        loadMoreHeroChunk();
      }
    } else if (hasMore && !loadingMore) {
      const added = await loadMoreHeroChunk();
      if (added > 0) {
        setCurrentSlide(prev => prev + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  // Touch Swipe handlers for Mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      handleNext();
    } else if (distance < -50) {
      handlePrev();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Hero section slider is manually slided by user with unlimited chunk fetching

  if (initialLoading || heroPosts.length === 0) {
    return (
      <Box component="section" sx={{ pt: { xs: 2.5, md: 4 }, pb: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 3, md: 5 } }}>
            <Box sx={{ flex: { md: '0 0 55%' }, aspectRatio: '16/9', bgcolor: '#e2e8f0', borderRadius: '24px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <Box sx={{ flex: { md: '0 0 40%' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ height: 26, width: 120, bgcolor: '#ECECEC', borderRadius: '8px' }} />
              <Box sx={{ height: 70, bgcolor: '#ECECEC', borderRadius: '8px' }} />
              <Box sx={{ height: 40, bgcolor: '#ECECEC', borderRadius: '8px' }} />
            </Box>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box component="section" sx={{ pt: { xs: 2.5, md: 4 }, pb: { xs: 2, md: 4 }, position: 'relative' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
        <Box 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          sx={{ position: 'relative', overflow: 'hidden', width: '100%', borderRadius: '24px' }}
        >
          <Box sx={{
            display: 'flex',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: `translate3d(-${currentSlide * 100}%, 0, 0)`,
            width: '100%'
          }}>
            {heroPosts.map((post, idx) => (
              <Box key={post._id || idx} sx={{ flex: '0 0 100%', width: '100%', boxSizing: 'border-box' }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: { xs: 3, md: 5 },
                  alignItems: { md: 'center' }
                }}>
                  {/* Image (left side) */}
                  <Box 
                    component={Link} 
                    to={postUrl(post)}
                    sx={{ textDecoration: 'none', flex: { md: '0 0 55%' }, display: 'block', width: '100%' }}
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
                      {post.featuredImage ? (
                        <Box
                          component="img"
                          src={optimizeImage(post.featuredImage, 550)}
                          srcSet={`${optimizeImage(post.featuredImage, 360)} 360w, ${optimizeImage(post.featuredImage, 550)} 550w`}
                          sizes="(max-width: 600px) 100vw, 550px"
                          alt={post.title}
                          width="550"
                          height="310"
                          loading={idx === 0 ? 'eager' : 'lazy'}
                          fetchPriority={idx === 0 ? 'high' : 'auto'}
                          decoding="async"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            transition: 'transform 0.4s ease',
                            '&:hover': { transform: 'scale(1.02)' },
                          }}
                        />
                      ) : (
                        <Box sx={{ width: '100%', height: '100%', bgcolor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>{post.category}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
    
                  {/* Content (right side) */}
                  <Box 
                    sx={{ 
                      flex: { md: '0 0 40%' }, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center',
                      minHeight: { xs: '210px', md: '260px' },
                      width: '100%'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Chip
                        label={post.category}
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
                      <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 800, fontSize: '0.75rem' }}>
                        🔥 Featured #{idx + 1}
                      </Typography>
                    </Box>
                    <Link to={postUrl(post)} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <Typography
                        variant="h1"
                        sx={{
                          fontWeight: 900,
                          mb: 1.5,
                          minHeight: { xs: '58px', md: '80px' },
                          fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2.15rem' },
                          lineHeight: 1.25,
                          color: '#0f172a',
                          letterSpacing: '-0.035em',
                          transition: 'color 0.2s ease-in-out',
                          '&:hover': { color: 'primary.main' }
                        }}
                      >
                        {post.title}
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
                      {post.excerpt}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', minHeight: '42px' }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: '#4F46E5', fontSize: '0.9rem', fontWeight: 600 }}>
                        {post.author?.charAt(0) || 'H'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                          {post.author || 'Harry Prince'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#4B5563', fontWeight: 500, fontSize: '0.75rem' }}>
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' · '}{post.readingTime || 5} min read
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Desktop & Mobile Chevron Floating Navigation Arrows */}
          {currentSlide > 0 && (
            <IconButton 
              onClick={handlePrev}
              aria-label="Previous Featured Slide"
              sx={{
                position: 'absolute',
                left: { xs: 4, md: 10 },
                top: '40%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                border: '1px solid #E5E7EB',
                color: '#111827',
                zIndex: 10,
                width: { xs: 36, md: 44 },
                height: { xs: 36, md: 44 },
                '&:hover': { bgcolor: 'white' }
              }}
            >
              <ChevronLeft />
            </IconButton>
          )}

          {(currentSlide < heroPosts.length - 1 || hasMore) && (
            <IconButton 
              onClick={handleNext}
              aria-label="Next Featured Slide"
              sx={{
                position: 'absolute',
                right: { xs: 4, md: 10 },
                top: '40%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                border: '1px solid #E5E7EB',
                color: '#111827',
                zIndex: 10,
                width: { xs: 36, md: 44 },
                height: { xs: 36, md: 44 },
                '&:hover': { bgcolor: 'white' }
              }}
            >
              <ChevronRight />
            </IconButton>
          )}
        </Box>
      </Container>
    </Box>
  );
};

const DailyCurrentAffairsSlider = ({ items = [], loading = false }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  if (loading || !items || items.length === 0) return null;

  const handleNext = () => {
    if (currentSlide < items.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 40) {
      handleNext();
    } else if (distance < -40) {
      handlePrev();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <Box 
      component="section" 
      sx={{ 
        py: { xs: 2.5, md: 3.5 }, 
        bgcolor: '#F8FAFC', 
        borderBottom: '1px solid #ECECEC',
        position: 'relative'
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
        {/* Header with Navigation Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: '#10B981',
                animation: 'pulseGreen 1.6s infinite ease-in-out',
                '@keyframes pulseGreen': {
                  '0%': { transform: 'scale(0.8)', opacity: 0.5 },
                  '50%': { transform: 'scale(1.4)', opacity: 1 },
                  '100%': { transform: 'scale(0.8)', opacity: 0.5 }
                }
              }} 
            />
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em',
                fontSize: { xs: '1.25rem', md: '1.6rem' }
              }}
            >
              Daily Current Affairs & GK Quiz
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Slide Quick Jump Dots / Day Selector */}
            {items.length > 1 && (
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.8, mr: 1 }}>
                {items.map((it, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    sx={{
                      width: currentSlide === idx ? 24 : 8,
                      height: 8,
                      borderRadius: '4px',
                      bgcolor: currentSlide === idx ? '#4F46E5' : '#CBD5E1',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    title={it.dateString}
                  />
                ))}
              </Box>
            )}

            <Button
              component={Link}
              to="/current-affairs"
              sx={{
                fontWeight: 700, fontSize: '0.85rem',
                color: '#4F46E5',
                '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.08)' }
              }}
            >
              All Archives →
            </Button>
          </Box>
        </Box>

        {/* Carousel Viewport with Touch Drag */}
        <Box
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          sx={{ position: 'relative', overflow: 'hidden', width: '100%', borderRadius: 3 }}
        >
          <Box
            sx={{
              display: 'flex',
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: `translate3d(-${currentSlide * 100}%, 0, 0)`,
              width: '100%'
            }}
          >
            {items.map((post, idx) => (
              <Box 
                key={post._id || idx} 
                sx={{ 
                  flex: '0 0 100%', 
                  width: '100%', 
                  boxSizing: 'border-box' 
                }}
              >
                {/* 2-Column Responsive Layout (Capsule + Quiz Card) */}
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' }, 
                    gap: { xs: 2, md: 2.5 },
                    alignItems: 'stretch'
                  }}
                >
                  {/* Left Column: Daily Capsule */}
                  <Box
                    sx={{
                      bgcolor: '#FFFFFF',
                      borderRadius: 3,
                      border: '1px solid #E2E8F0',
                      p: { xs: 2.5, md: 3 },
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        borderColor: '#CBD5E1'
                      }
                    }}
                  >
                    <Box>
                      {/* Badges Row */}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1.5 }}>
                        <Chip
                          label={`📅 ${post.dateString} ${idx === 0 ? '• TODAY' : ''}`}
                          size="small"
                          sx={{ 
                            bgcolor: idx === 0 ? '#4F46E5' : '#EEF2FF', 
                            color: idx === 0 ? '#FFFFFF' : '#4338CA', 
                            fontWeight: 800, 
                            fontSize: '0.72rem' 
                          }}
                        />
                        <Chip
                          label="⚡ 100% Exam Focused"
                          size="small"
                          sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 800, fontSize: '0.72rem' }}
                        />
                        <Chip
                          label="🎯 10 MCQs Quiz Included"
                          size="small"
                          sx={{ bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 800, fontSize: '0.72rem' }}
                        />
                      </Box>

                      {/* Title */}
                      <Typography
                        component={Link}
                        to={`/current-affairs/${post.slug}`}
                        variant="h3"
                        sx={{
                          fontSize: { xs: '1.05rem', md: '1.25rem' },
                          fontWeight: 800,
                          color: '#1E293B',
                          lineHeight: 1.4,
                          mb: 1.2,
                          display: 'block',
                          textDecoration: 'none',
                          transition: 'color 0.2s ease',
                          '&:hover': { color: '#4F46E5' }
                        }}
                      >
                        {post.title}
                      </Typography>

                      {/* Summary */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#64748B',
                          fontSize: { xs: '0.85rem', md: '0.9rem' },
                          lineHeight: 1.6,
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: { xs: 2, md: 3 },
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {post.summary}
                      </Typography>

                      {/* Topic Chips */}
                      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2.5 }}>
                        {['National', 'International', 'Economy', 'Defense', 'Sports', 'Static GK'].map(cat => (
                          <Chip
                            key={cat}
                            label={`• ${cat}`}
                            size="small"
                            sx={{
                              bgcolor: '#F1F5F9',
                              color: '#475569',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              height: '22px'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', pt: 2, borderTop: '1px solid #F1F5F9' }}>
                      <Button
                        component={Link}
                        to={`/current-affairs/${post.slug}`}
                        variant="contained"
                        sx={{
                          bgcolor: '#4F46E5',
                          color: 'white',
                          fontWeight: 700,
                          textTransform: 'none',
                          borderRadius: 2,
                          px: 2.5,
                          py: 0.9,
                          fontSize: '0.85rem',
                          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                          '&:hover': { bgcolor: '#4338CA' }
                        }}
                      >
                        📖 Read Full Capsule →
                      </Button>
                      <Button
                        component={Link}
                        to={`/current-affairs/${post.slug}#quiz-section`}
                        variant="outlined"
                        sx={{
                          borderColor: '#10B981',
                          color: '#059669',
                          fontWeight: 700,
                          textTransform: 'none',
                          borderRadius: 2,
                          px: 2,
                          py: 0.9,
                          fontSize: '0.85rem',
                          '&:hover': { bgcolor: '#ECFDF5', borderColor: '#059669' }
                        }}
                      >
                        🎯 Practice 10 MCQs
                      </Button>
                    </Box>
                  </Box>

                  {/* Right Column: Timed Mock Quiz Card */}
                  <Box
                    sx={{
                      background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
                      borderRadius: 3,
                      p: { xs: 2.5, md: 3 },
                      color: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Box>
                      <Chip
                        label={`⚡ 10-Min Mock (${post.dateString})`}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#FEF08A', fontWeight: 800, mb: 1.5 }}
                      />
                      <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.15rem', md: '1.3rem' }, mb: 1, letterSpacing: '-0.3px' }}>
                        Daily GK Practice Quiz
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#E0E7FF', fontSize: '0.82rem', lineHeight: 1.5, mb: 2 }}>
                        UPSC, SSC, Railway व Police परीक्षा हेतु इस दिन के 10 महत्वपूर्ण MCQs हल करें और इंस्टेंट रिजल्ट पाएं।
                      </Typography>

                      {/* Feature Checklist */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mb: 2.5 }}>
                        <Typography variant="caption" sx={{ color: '#C7D2FE', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.78rem', fontWeight: 600 }}>
                          <span style={{ color: '#34D399', fontWeight: 800 }}>✓</span> 10 Exam-Level Multiple Choice Questions
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#C7D2FE', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.78rem', fontWeight: 600 }}>
                          <span style={{ color: '#34D399', fontWeight: 800 }}>✓</span> Instant Green/Red Answer Explanations
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#C7D2FE', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.78rem', fontWeight: 600 }}>
                          <span style={{ color: '#34D399', fontWeight: 800 }}>✓</span> 10-Minute Timed Mock Test Simulator
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      component={Link}
                      to={`/daily-quiz/${post.dateString}`}
                      variant="contained"
                      fullWidth
                      sx={{
                        bgcolor: '#10B981',
                        color: 'white',
                        fontWeight: 800,
                        textTransform: 'none',
                        py: 1.1,
                        borderRadius: 2,
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                        '&:hover': { bgcolor: '#059669' }
                      }}
                    >
                      🚀 Start {post.dateString} Quiz ➔
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Desktop & Mobile Chevron Floating Navigation Arrows */}
          {items.length > 1 && currentSlide > 0 && (
            <IconButton 
              onClick={handlePrev}
              aria-label="Previous Day Current Affairs"
              sx={{
                position: 'absolute',
                left: { xs: 6, md: 12 },
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                border: '1px solid #E5E7EB',
                color: '#111827',
                zIndex: 10,
                width: { xs: 34, md: 40 },
                height: { xs: 34, md: 40 },
                '&:hover': { bgcolor: 'white' }
              }}
            >
              <ChevronLeft />
            </IconButton>
          )}

          {items.length > 1 && currentSlide < items.length - 1 && (
            <IconButton 
              onClick={handleNext}
              aria-label="Next Day Current Affairs"
              sx={{
                position: 'absolute',
                right: { xs: 6, md: 12 },
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                border: '1px solid #E5E7EB',
                color: '#111827',
                zIndex: 10,
                width: { xs: 34, md: 40 },
                height: { xs: 34, md: 40 },
                '&:hover': { bgcolor: 'white' }
              }}
            >
              <ChevronRight />
            </IconButton>
          )}
        </Box>

        {/* Mobile Swipe Indicator Dots */}
        {items.length > 1 && (
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', alignItems: 'center', gap: 1, mt: 2 }}>
            {items.map((_, idx) => (
              <Box
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                sx={{
                  width: currentSlide === idx ? 20 : 6,
                  height: 6,
                  borderRadius: '3px',
                  bgcolor: currentSlide === idx ? '#4F46E5' : '#CBD5E1',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

const STATE_ALIASES = {
  'up': ['uttar pradesh', 'up', 'upsssc', 'uppsc', 'uppbpb', 'lucknow', 'allahabad'],
  'uttar pradesh': ['uttar pradesh', 'up', 'upsssc', 'uppsc', 'uppbpb', 'lucknow', 'allahabad'],
  'bihar': ['bihar', 'bpsc', 'csbc', 'bpssc', 'bssc', 'bcece', 'patna'],
  'mp': ['madhya pradesh', 'mp', 'mppsc', 'mpesb', 'mp peb', 'mpvyapam', 'bhopal', 'indore'],
  'madhya pradesh': ['madhya pradesh', 'mp', 'mppsc', 'mpesb', 'mp peb', 'mpvyapam', 'bhopal', 'indore'],
  'delhi': ['delhi', 'dsssb', 'dhc', 'delhi high court'],
  'rajasthan': ['rajasthan', 'rpsc', 'rsmssb', 'rssb', 'jaipur'],
  'haryana': ['haryana', 'hssc', 'hpsc'],
  'punjab': ['punjab', 'ppsc', 'psssb'],
  'jharkhand': ['jharkhand', 'jpsc', 'jssc', 'ranchi'],
  'uttarakhand': ['uttarakhand', 'ukpsc', 'uksssc', 'dehradun'],
  'chhattisgarh': ['chhattisgarh', 'cgpsc', 'cgvyapam', 'raipur'],
  'gujarat': ['gujarat', 'gpsc', 'gsssb'],
  'maharashtra': ['maharashtra', 'mpsc', 'mumbai', 'pune'],
  'west bengal': ['west bengal', 'wbpsc', 'kolkata'],
  'odisha': ['odisha', 'opsc', 'osssc'],
  'andhra pradesh': ['andhra pradesh', 'appsc'],
  'telangana': ['telangana', 'tspsc', 'hyderabad'],
  'tamil nadu': ['tamil nadu', 'tnpsc', 'chennai'],
  'himachal pradesh': ['himachal pradesh', 'hp', 'hppsc', 'hpsssb', 'shimla'],
  'hp': ['himachal pradesh', 'hp', 'hppsc', 'hpsssb', 'shimla']
};

function isAlertMatchingState(alert, stateQuery) {
  if (!alert || !stateQuery || stateQuery === 'all' || stateQuery === 'All States') return true;
  const q = stateQuery.toLowerCase().trim();
  const aliases = STATE_ALIASES[q] || [q];

  const alertState = (alert.state || '').toLowerCase();
  const alertTitle = (alert.title || '').toLowerCase();
  const alertBoard = (alert.boardName || '').toLowerCase();

  return aliases.some(alias => 
    alertState.includes(alias) || 
    alertTitle.includes(alias) || 
    alertBoard.includes(alias)
  );
}

function getStrictChronological(items = [], max = 8) {
  if (!items || items.length === 0) return [];
  return [...items].sort((a, b) => {
    const dateA = new Date(a.parsedPostDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.parsedPostDate || b.createdAt || 0).getTime();
    return dateB - dateA;
  }).slice(0, max);
}

export default function HomePage() {
  const { posts, loading, error } = usePosts({ category: 'Sarkari Jobs & Exams', limit: 6 });
  const featuredPost = posts.length > 0 ? posts[0] : null;
  const regularPosts = [];

  const [alerts, setAlerts] = useState(() => (typeof window !== 'undefined' && Array.isArray(window.__INITIAL_ALERTS__) && window.__INITIAL_ALERTS__.length > 0) ? window.__INITIAL_ALERTS__ : []);
  const [loadingAlerts, setLoadingAlerts] = useState(() => (typeof window !== 'undefined' && Array.isArray(window.__INITIAL_ALERTS__) && window.__INITIAL_ALERTS__.length > 0) ? false : true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedState, setSelectedState] = useState('all');
  const [categoryCounts, setCategoryCounts] = useState({});
  const mobileScrollRef = useRef(null);
  const mobileStoriesScrollRef = useRef(null);

  const [categoriesData, setCategoriesData] = useState(() => (typeof window !== 'undefined' && Array.isArray(window.__INITIAL_SARKARI_POSTS__) && window.__INITIAL_SARKARI_POSTS__.length > 0) ? { 'Sarkari Jobs & Exams': window.__INITIAL_SARKARI_POSTS__ } : {});
  const [loadingCategories, setLoadingCategories] = useState(() => (typeof window !== 'undefined' && Array.isArray(window.__INITIAL_SARKARI_POSTS__) && window.__INITIAL_SARKARI_POSTS__.length > 0) ? false : true);

  const [stories, setStories] = useState(() => (typeof window !== 'undefined' && Array.isArray(window.__INITIAL_STORIES__) && window.__INITIAL_STORIES__.length > 0) ? window.__INITIAL_STORIES__ : []);
  const [loadingStories, setLoadingStories] = useState(() => (typeof window !== 'undefined' && Array.isArray(window.__INITIAL_STORIES__) && window.__INITIAL_STORIES__.length > 0) ? false : true);

  const [alertsPage, setAlertsPage] = useState(1);
  const [hasMoreAlerts, setHasMoreAlerts] = useState(true);
  const [loadingMoreAlerts, setLoadingMoreAlerts] = useState(false);

  const [storiesPage, setStoriesPage] = useState(1);
  const [hasMoreStories, setHasMoreStories] = useState(true);
  const [loadingMoreStories, setLoadingMoreStories] = useState(false);

  const loadMoreAlerts = async () => {
    if (loadingMoreAlerts || !hasMoreAlerts) return 0;
    setLoadingMoreAlerts(true);
    try {
      const nextPage = alertsPage + 1;
      const res = await request(`/api/public/live-alerts?status=active&page=${nextPage}&limit=16`);
      const newAlerts = res.data || [];
      if (newAlerts.length > 0) {
        setAlerts(prev => {
          const existingIds = new Set(prev.map(a => a._id));
          const filtered = newAlerts.filter(a => !existingIds.has(a._id));
          return [...prev, ...filtered];
        });
        setAlertsPage(nextPage);
      }
      if (newAlerts.length < 16) {
        setHasMoreAlerts(false);
      }
      return newAlerts.length;
    } catch (err) {
      console.error(err);
      return 0;
    } finally {
      setLoadingMoreAlerts(false);
    }
  };

  const handleSelectState = async (stateCode) => {
    setSelectedState(stateCode);
    if (stateCode !== 'all') {
      try {
        const [stateRes, stateResultsRes, stateAdmitsRes] = await Promise.allSettled([
          request(`/api/public/live-alerts?state=${stateCode}&limit=40`),
          request(`/api/public/live-alerts?state=${stateCode}&category=Result&limit=10`),
          request(`/api/public/live-alerts?state=${stateCode}&category=Admit+Card&limit=10`)
        ]);

        if (stateRes.status === 'fulfilled' && stateRes.value?.data?.length > 0) {
          setAlerts(prev => {
            const existingIds = new Set(prev.map(a => a._id));
            const newItems = stateRes.value.data.filter(a => !existingIds.has(a._id));
            return [...newItems, ...prev];
          });
        }
        if (stateResultsRes.status === 'fulfilled' && stateResultsRes.value?.data?.length > 0) {
          setExtraResults(prev => {
            const existingIds = new Set(prev.map(a => a._id));
            const newItems = stateResultsRes.value.data.filter(a => !existingIds.has(a._id));
            return [...newItems, ...prev];
          });
        }
        if (stateAdmitsRes.status === 'fulfilled' && stateAdmitsRes.value?.data?.length > 0) {
          setExtraAdmits(prev => {
            const existingIds = new Set(prev.map(a => a._id));
            const newItems = stateAdmitsRes.value.data.filter(a => !existingIds.has(a._id));
            return [...newItems, ...prev];
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const displayAlerts = useMemo(() => {
    let list = alerts;
    if (selectedState !== 'all') {
      const filtered = alerts.filter(a => isAlertMatchingState(a, selectedState));
      list = filtered.length > 0 ? filtered : alerts;
    }
    return getStrictChronological(list, 100);
  }, [alerts, selectedState]);

  const [extraResults, setExtraResults] = useState(() => (typeof window !== 'undefined' && Array.isArray(window.__INITIAL_RESULTS__) && window.__INITIAL_RESULTS__.length > 0) ? window.__INITIAL_RESULTS__ : []);
  const [extraAdmits, setExtraAdmits] = useState(() => (typeof window !== 'undefined' && Array.isArray(window.__INITIAL_ADMITS__) && window.__INITIAL_ADMITS__.length > 0) ? window.__INITIAL_ADMITS__ : []);

  const resultsAlerts = useMemo(() => {
    let pool = displayAlerts;
    if (selectedState === 'all') {
      pool = [...displayAlerts, ...extraResults];
    } else {
      pool = [...alerts, ...extraResults].filter(a => isAlertMatchingState(a, selectedState));
    }
    const filtered = pool.filter(a => (a.category === 'Results' || a.category === 'Result' || /result|merit list|score card/i.test(a.title)));
    const unique = Array.from(new Map(filtered.map(item => [item._id, item])).values());
    return getStrictChronological(unique, 8);
  }, [alerts, displayAlerts, extraResults, selectedState]);

  const admitCardAlerts = useMemo(() => {
    let pool = displayAlerts;
    if (selectedState === 'all') {
      pool = [...displayAlerts, ...extraAdmits];
    } else {
      pool = [...alerts, ...extraAdmits].filter(a => isAlertMatchingState(a, selectedState));
    }
    const filtered = pool.filter(a => (a.category === 'Admit Card' || a.category === 'Admit Cards' || /admit card|hall ticket|call letter|exam city/i.test(a.title)));
    const unique = Array.from(new Map(filtered.map(item => [item._id, item])).values());
    return getStrictChronological(unique, 8);
  }, [alerts, displayAlerts, extraAdmits, selectedState]);

  const latestJobAlerts = useMemo(() => {
    let pool = displayAlerts;
    if (selectedState !== 'all') {
      pool = alerts.filter(a => isAlertMatchingState(a, selectedState));
    }
    const list = pool.filter(a => (a.category === 'Latest Job' || a.category === 'Latest Jobs' || a.category === 'Jobs' || a.category === 'Recruitment' || /recruitment|vacancy|apply online|officer|constable|teacher/i.test(a.title)));
    return getStrictChronological(list, 8);
  }, [alerts, displayAlerts, selectedState]);

  // Guarantee that Admit Cards and Results columns have full 8 items without polluting main stream
  useEffect(() => {
    const needResults = extraResults.length < 8;
    const needAdmitCards = extraAdmits.length < 8;

    if (needResults || needAdmitCards) {
      Promise.allSettled([
        needResults ? request('/api/public/live-alerts?category=Result&limit=10') : Promise.resolve(null),
        needAdmitCards ? request('/api/public/live-alerts?category=Admit+Card&limit=10') : Promise.resolve(null),
      ]).then(([resData, admitData]) => {
        if (resData.status === 'fulfilled' && resData.value?.data?.length > 0) {
          setExtraResults(resData.value.data);
        }
        if (admitData.status === 'fulfilled' && admitData.value?.data?.length > 0) {
          setExtraAdmits(admitData.value.data);
        }
      }).catch(err => console.error(err));
    }
  }, [extraResults.length, extraAdmits.length]);

  const loadMoreStories = async () => {
    if (loadingMoreStories || !hasMoreStories) return 0;
    setLoadingMoreStories(true);
    try {
      const nextPage = storiesPage + 1;
      const res = await request(`/api/public/web-stories?page=${nextPage}&limit=8`);
      const list = Array.isArray(res) ? res : (res?.data || []);
      if (list.length > 0) {
        setStories(prev => {
          const existingIds = new Set(prev.map(s => s._id));
          const filtered = list.filter(s => !existingIds.has(s._id));
          return [...prev, ...filtered];
        });
        setStoriesPage(nextPage);
      }
      if (list.length < 8) {
        setHasMoreStories(false);
      }
      return list.length;
    } catch (err) {
      console.error(err);
      return 0;
    } finally {
      setLoadingMoreStories(false);
    }
  };

  const [currentAffairsList, setCurrentAffairsList] = useState(() => (typeof window !== 'undefined' && Array.isArray(window.__INITIAL_CURRENT_AFFAIRS__)) ? window.__INITIAL_CURRENT_AFFAIRS__ : []);
  const [loadingCA, setLoadingCA] = useState(() => (typeof window !== 'undefined' && Array.isArray(window.__INITIAL_CURRENT_AFFAIRS__) && window.__INITIAL_CURRENT_AFFAIRS__.length > 0) ? false : true);

  useEffect(() => {
    if (alerts.length > 0) return;
    request('/api/public/live-alerts?status=active&limit=60')
      .then(res => {
        if (res.success) {
          setAlerts(res.data || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingAlerts(false));
  }, []);

  useEffect(() => {
    request('/api/public/live-alerts/categories')
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          const counts = {};
          res.data.forEach(item => {
            counts[item._id] = item.count;
          });
          setCategoryCounts(counts);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (stories.length > 0) return;
    request('/api/public/web-stories?limit=8')
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setStories(list);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingStories(false));
  }, []);

  useEffect(() => {
    if (currentAffairsList.length > 0) return;
    request('/api/current-affairs?limit=6')
      .then(res => {
        if (res.success && res.items?.length > 0) {
          setCurrentAffairsList(res.items);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingCA(false));
  }, []);

  useEffect(() => {
    if (categoriesData['Sarkari Jobs & Exams']?.length > 0) return;
    setLoadingCategories(true);
    request(`/api/posts?category=${encodeURIComponent('Sarkari Jobs & Exams')}&limit=6`)
      .then(res => {
        setCategoriesData({
          'Sarkari Jobs & Exams': res.posts || []
        });
      })
      .catch(() => {})
      .finally(() => setLoadingCategories(false));
  }, []);

  return (
    <Layout>
      <Seo title="Digital Home — Sarkari Result, Live Job Alerts & Daily Insights" description="Sarkari Result, Admit Card, Latest Jobs, Vacancies, Sarkari Result Tools, Kids Games (बचो का गेम), Health, Education, and Tech Insights from Digital Home Blog." keywords="sarkari result, admit card, latest jobs, vacancies, govt jobs, sarkari result tools, kids games, bacho ka game, health tips, education, tech tutorials, all insights blog, digital home" />

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
          pt: { xs: 2, md: 2.5 }, 
          pb: { xs: 3, md: 4 }, 
          borderBottom: '1px solid #ECECEC',
          bgcolor: '#FFFFFF'
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 6 } }}>
          {/* 1. Fast Exam & Board Filter Marquee */}
          <InteractivePillMarquee />

          {/* 2. Top 4 Quick-Action Pillar Cards */}
          <QuickActionPillars categoryCounts={categoryCounts} />

          {/* 3. Interactive State Filter Strip */}
          <StateFilterStrip activeState={selectedState} onSelectState={handleSelectState} />

          {/* 4. Adaptive Highlights Hub (3 Columns on Desktop / 3-Tab Selector on Mobile) */}
          <AdaptiveHighlightsHub
            results={resultsAlerts}
            admitCards={admitCardAlerts}
            latestJobs={latestJobAlerts}
          />

          {/* 5. Live Stream Marquee Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                  fontSize: { xs: '1.3rem', md: '1.6rem' }
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
                color: '#1E40AF',
                '&:hover': { bgcolor: 'rgba(30, 64, 175, 0.06)' }
              }}
            >
              View All Alerts →
            </Button>
          </Box>

          <Box sx={{ minHeight: { xs: '200px', sm: '190px' }, width: '100%' }}>
            {loadingAlerts ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, py: 1 }}>
                {[1, 2, 3, 4].map(i => (
                  <Box key={i} sx={{ height: 95, borderRadius: '12px', bgcolor: '#F1F5F9', border: '1px solid #E2E8F0', animation: 'pulse 1.5s infinite ease-in-out' }} />
                ))}
              </Box>
            ) : displayAlerts.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 4, fontStyle: 'italic', textAlign: 'center' }}>No active updates at the moment.</Typography>
            ) : (
              <InteractiveAlertsMarquee 
                alerts={displayAlerts} 
                onLoadMore={loadMoreAlerts} 
                hasMore={hasMoreAlerts} 
                loadingMore={loadingMoreAlerts} 
              />
            )}
          </Box>
        </Container>
      </Box>

      {/* Daily Current Affairs & GK Quiz Carousel Section */}
      <DailyCurrentAffairsSlider items={currentAffairsList} loading={loadingCA} />

      {/* Web Stories Section */}
      <Box 
        component="section" 
        sx={{ 
          py: { xs: 3, md: 4 }, 
          bgcolor: '#F9FAFB', 
          borderBottom: '1px solid #ECECEC',
          minHeight: { xs: '320px', md: '360px' }
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
                    '0%': { transform: 'scale(1)', opacity: 0.9 },
                    '50%': { transform: 'scale(1.05)', opacity: 1 },
                    '100%': { transform: 'scale(1)', opacity: 0.9 }
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

          {loadingStories ? (
            <Box sx={{ display: 'flex', gap: 2.5, overflowX: 'hidden', pb: 2 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <Box 
                  key={i} 
                  sx={{ 
                    flex: { xs: '0 0 160px', sm: '0 0 200px', md: '0 0 220px' }, 
                    aspectRatio: '9/16', 
                    borderRadius: '16px', 
                    bgcolor: '#E5E7EB', 
                    animation: 'pulse 1.5s infinite ease-in-out' 
                  }} 
                />
              ))}
            </Box>
          ) : (
            <InteractiveStoriesMarquee 
              stories={stories} 
              onLoadMore={loadMoreStories} 
              hasMore={hasMoreStories} 
              loadingMore={loadingMoreStories} 
            />
          )}
        </Container>
      </Box>

      {/* Hero Section Slider */}
      <HeroSectionSlider initialPosts={posts} loading={loading} />

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
            <LazyCategorySection 
              key={cat}
              categoryName={cat}
              initialPosts={categoriesData[cat] || []}
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
