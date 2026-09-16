import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Chip, 
  IconButton, 
  CircularProgress, 
  Tooltip,
  Skeleton
} from '@mui/material';
import { 
  Refresh, 
  OpenInNew, 
  TrendingUp, 
  AccessTime, 
  Language,
  ElectricBolt
} from '@mui/icons-material';
import { request } from '../../../shared/lib/api';

export default function LiveTrendingPulseHub() {
  const [pulseData, setPulseData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchPulse = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const url = isManualRefresh 
        ? '/api/public/trending-pulse?refresh=true' 
        : '/api/public/trending-pulse';
      const res = await request(url);
      if (res && res.success) {
        setPulseData(res.data || []);
        if (res.categories) setCategories(res.categories);
        if (res.lastUpdated) setLastUpdated(res.lastUpdated);
      }
    } catch (err) {
      console.warn('[TrendingPulseHub] Fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPulse();
    // Auto-refresh every 5 minutes in background
    const interval = setInterval(() => fetchPulse(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return pulseData;
    return pulseData.filter(item => item.categoryKey === activeCategory);
  }, [pulseData, activeCategory]);

  const breakingItems = useMemo(() => {
    return pulseData.slice(0, 5);
  }, [pulseData]);

  const countsByCategory = useMemo(() => {
    const counts = { all: pulseData.length };
    pulseData.forEach(item => {
      counts[item.categoryKey] = (counts[item.categoryKey] || 0) + 1;
    });
    return counts;
  }, [pulseData]);

  return (
    <Box 
      component="section" 
      id="trending-news-radar"
      sx={{ 
        py: { xs: 5, md: 7 }, 
        bgcolor: '#0F172A', // Sleek luxury dark slate background
        color: '#F8FAFC',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '20%',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0) 70%)',
          pointerEvents: 'none'
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          right: '10%',
          width: '500px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.07) 0%, rgba(15, 23, 42, 0) 70%)',
          pointerEvents: 'none'
        }
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6 }, position: 'relative', zIndex: 1 }}>
        
        {/* Header Bar */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'flex-end' },
          gap: 2,
          mb: 3.5
        }}>
          <Box>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.8,
                px: 1.4,
                py: 0.4,
                borderRadius: '20px',
                bgcolor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#F87171',
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: 1
              }}>
                <Box sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: '#EF4444',
                  boxShadow: '0 0 10px #EF4444',
                  animation: 'pulse 1.5s infinite ease-in-out',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(0.8)', opacity: 0.6 },
                    '50%': { transform: 'scale(1.3)', opacity: 1 },
                    '100%': { transform: 'scale(0.8)', opacity: 0.6 }
                  }
                }} />
                24x7 TRENDING RADAR
              </Box>

              <Chip 
                label="LIVE MULTI-CATEGORY" 
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  bgcolor: 'rgba(56, 189, 248, 0.12)',
                  color: '#38BDF8',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '6px'
                }}
              />
            </Box>

            <Typography 
              variant="h3" 
              component="h2"
              sx={{ 
                fontWeight: 850, 
                fontSize: { xs: '1.5rem', sm: '1.9rem', md: '2.2rem' },
                letterSpacing: '-0.03em',
                color: '#FFFFFF',
                lineHeight: 1.2
              }}
            >
              India & Global <span style={{ 
                background: 'linear-gradient(135deg, #38BDF8 0%, #A855F7 50%, #F59E0B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Live Trends Hub</span>
            </Typography>

            <Typography 
              variant="body2" 
              sx={{ 
                color: '#94A3B8', 
                mt: 0.8, 
                fontSize: { xs: '0.82rem', md: '0.9rem' },
                maxWidth: '680px'
              }}
            >
              Real-time verified updates across Finance & UPI, AI Tools, Tech Trends, Health & National Headlines. Continuous 24x7 live feed.
            </Typography>
          </Box>

          {/* Refresh & Status Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, alignSelf: { xs: 'flex-start', md: 'flex-end' } }}>
            {lastUpdated && (
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime sx={{ fontSize: 13 }} />
                Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            )}
            
            <Tooltip title="Refresh Live Trends">
              <IconButton 
                onClick={() => fetchPulse(true)}
                disabled={refreshing}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#38BDF8',
                  width: 38,
                  height: 38,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(56, 189, 248, 0.15)',
                    borderColor: '#38BDF8',
                    transform: 'rotate(90deg)'
                  }
                }}
              >
                <Refresh sx={{ fontSize: 20, animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Breaking News Ticker Strip */}
        {breakingItems.length > 0 && (
          <Box sx={{
            mb: 3,
            p: 1.2,
            bgcolor: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            overflow: 'hidden'
          }}>
            <Box sx={{
              px: 1.2,
              py: 0.4,
              bgcolor: '#EF4444',
              color: '#FFFFFF',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: 0.4,
              flexShrink: 0
            }}>
              <ElectricBolt sx={{ fontSize: 13 }} />
              PULSE
            </Box>

            <Box sx={{
              display: 'flex',
              gap: 3,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              py: 0.2
            }}>
              {breakingItems.map((item, idx) => (
                <Box 
                  key={item.id || idx}
                  component="a"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: '#E2E8F0',
                    textDecoration: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.8,
                    transition: 'color 0.2s',
                    '&:hover': { color: '#38BDF8' }
                  }}
                >
                  <span style={{ color: item.color || '#38BDF8', fontWeight: 800 }}>{item.icon} {item.source}:</span>
                  <span>{item.title}</span>
                  <span style={{ color: '#64748B', fontSize: '0.7rem' }}>({item.timeAgo})</span>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Category Pills Filter */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          overflowX: 'auto', 
          pb: 1.5, 
          mb: 3,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' }
        }}>
          <Chip
            label={`🔥 All Trends (${countsByCategory.all || 0})`}
            onClick={() => setActiveCategory('all')}
            sx={{
              px: 1.2,
              py: 2.2,
              fontWeight: 800,
              fontSize: '0.8rem',
              borderRadius: '30px',
              cursor: 'pointer',
              transition: 'all 0.22s ease',
              bgcolor: activeCategory === 'all' ? '#38BDF8' : 'rgba(30, 41, 59, 0.8)',
              color: activeCategory === 'all' ? '#0F172A' : '#94A3B8',
              border: `1px solid ${activeCategory === 'all' ? '#38BDF8' : 'rgba(255, 255, 255, 0.1)'}`,
              boxShadow: activeCategory === 'all' ? '0 0 16px rgba(56, 189, 248, 0.4)' : 'none',
              '&:hover': {
                bgcolor: activeCategory === 'all' ? '#38BDF8' : 'rgba(51, 65, 85, 0.9)',
                color: '#FFFFFF'
              }
            }}
          />

          {[
            { key: 'finance', label: 'Finance & UPI', icon: '📈', color: '#10B981' },
            { key: 'ai', label: 'AI & Web Tools', icon: '🤖', color: '#A855F7' },
            { key: 'tech', label: 'Tech & Gadgets', icon: '💻', color: '#3B82F6' },
            { key: 'health', label: 'Health & Care', icon: '🩺', color: '#14B8A6' },
            { key: 'news', label: 'Top Headlines', icon: '🔥', color: '#F97316' }
          ].map(tab => {
            const isSelected = activeCategory === tab.key;
            const count = countsByCategory[tab.key] || 0;
            return (
              <Chip
                key={tab.key}
                label={`${tab.icon} ${tab.label} (${count})`}
                onClick={() => setActiveCategory(tab.key)}
                sx={{
                  px: 1.2,
                  py: 2.2,
                  fontWeight: 750,
                  fontSize: '0.8rem',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  transition: 'all 0.22s ease',
                  bgcolor: isSelected ? tab.color : 'rgba(30, 41, 59, 0.8)',
                  color: isSelected ? '#FFFFFF' : '#94A3B8',
                  border: `1px solid ${isSelected ? tab.color : 'rgba(255, 255, 255, 0.1)'}`,
                  boxShadow: isSelected ? `0 0 16px ${tab.color}50` : 'none',
                  '&:hover': {
                    bgcolor: isSelected ? tab.color : 'rgba(51, 65, 85, 0.9)',
                    color: '#FFFFFF'
                  }
                }}
              />
            );
          })}
        </Box>

        {/* News Cards Grid */}
        {loading ? (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2.5
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton 
                key={i} 
                variant="rounded" 
                height={170} 
                sx={{ bgcolor: 'rgba(30, 41, 59, 0.6)', borderRadius: '16px' }} 
              />
            ))}
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: '#94A3B8' }}>
            <Typography variant="body1">No updates found for this category right now.</Typography>
          </Box>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: 'repeat(2, 1fr)', 
              md: 'repeat(3, 1fr)', 
              lg: 'repeat(4, 1fr)' 
            },
            gap: 2.5
          }}>
            {filteredItems.map((item, idx) => (
              <Box
                key={item.id || idx}
                component="a"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  p: 2.2,
                  bgcolor: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '170px',
                  position: 'relative',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    bgcolor: 'rgba(30, 41, 59, 0.95)',
                    borderColor: item.color || '#38BDF8',
                    boxShadow: `0 12px 28px -6px rgba(0,0,0,0.5), 0 0 16px ${item.color}25`,
                    '& .card-title': {
                      color: '#FFFFFF'
                    },
                    '& .open-icon': {
                      transform: 'translate(2px, -2px)',
                      color: item.color || '#38BDF8'
                    }
                  }
                }}
              >
                {/* Top Card Meta: Badge + Relative Time */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                    <Chip
                      label={`${item.icon} ${item.badge || item.categoryName}`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: `${item.color}20`,
                        color: item.color || '#38BDF8',
                        border: `1px solid ${item.color}40`,
                        borderRadius: '4px',
                        '& .MuiChip-label': { px: 0.8 }
                      }}
                    />

                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#64748B', 
                        fontSize: '0.68rem', 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.4
                      }}
                    >
                      <AccessTime sx={{ fontSize: 12 }} />
                      {item.timeAgo}
                    </Typography>
                  </Box>

                  {/* Headline Title */}
                  <Typography
                    className="card-title"
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      lineHeight: 1.45,
                      color: '#E2E8F0',
                      letterSpacing: '-0.01em',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    {item.title}
                  </Typography>
                </Box>

                {/* Bottom Source & Action */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  pt: 1.5,
                  mt: 1,
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#94A3B8', 
                      fontSize: '0.72rem', 
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.6
                    }}
                  >
                    <Language sx={{ fontSize: 13, color: item.color }} />
                    {item.source}
                  </Typography>

                  <OpenInNew 
                    className="open-icon"
                    sx={{ 
                      fontSize: 16, 
                      color: '#64748B',
                      transition: 'all 0.2s ease'
                    }} 
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}

      </Container>
    </Box>
  );
}
