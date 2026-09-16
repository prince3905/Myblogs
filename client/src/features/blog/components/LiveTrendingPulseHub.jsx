import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Chip, 
  IconButton, 
  Tooltip,
  Skeleton,
  Dialog,
  DialogContent,
  Button,
  Divider
} from '@mui/material';
import { 
  Refresh, 
  AccessTime, 
  ElectricBolt,
  Close,
  CheckCircle,
  Lightbulb,
  Explore,
  Work,
  Build,
  Article,
  Share,
  Help,
  VerifiedUser
} from '@mui/icons-material';
import { request } from '../../../shared/lib/api';

export default function LiveTrendingPulseHub() {
  const navigate = useNavigate();
  const [pulseData, setPulseData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [copied, setCopied] = useState(false);

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

  const handleShare = async () => {
    if (!selectedTrend) return;
    const shareText = `${selectedTrend.title} - Read full report on Digital Home Blog!`;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: selectedTrend.title, text: shareText, url: shareUrl });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const report = selectedTrend?.report;

  return (
    <Box 
      component="section" 
      id="trending-news-radar"
      sx={{ 
        py: { xs: 5, md: 7 }, 
        bgcolor: '#0F172A',
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
              किसी भी कार्ड पर क्लिक करके उसकी पूरी विस्तृत रिपोर्ट, आंकड़े और जरूरी बातें यहीं इसी पेज पर पढ़ें।
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
                  onClick={() => setSelectedTrend(item)}
                  sx={{
                    color: '#E2E8F0',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.8,
                    transition: 'all 0.2s ease',
                    '&:hover': { color: '#38BDF8', transform: 'translateX(2px)' }
                  }}
                >
                  <span style={{ color: item.color || '#38BDF8', fontWeight: 800 }}>{item.icon} {item.categoryName}:</span>
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
                onClick={() => setSelectedTrend(item)}
                sx={{
                  p: 2.2,
                  bgcolor: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  cursor: 'pointer',
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
                    '& .pulse-tag': {
                      transform: 'scale(1.02)'
                    }
                  }
                }}
              >
                {/* Top Card Meta: Badge + Relative Time */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                    <Chip
                      className="pulse-tag"
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
                        transition: 'transform 0.2s',
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

                {/* Bottom Action Prompt */}
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
                      gap: 0.5
                    }}
                  >
                    <VerifiedUser sx={{ fontSize: 13, color: item.color }} />
                    विस्तृत रिपोर्ट
                  </Typography>

                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: item.color || '#38BDF8', 
                      fontSize: '0.7rem', 
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.3
                    }}
                  >
                    पूरी जानकारी पढ़ें ➔
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}

      </Container>

      {/* ULTRA-PREMIUM IN-DEPTH EDITORIAL POPUP MODAL (100% On-Site, Zero Bounce) */}
      <Dialog
        open={Boolean(selectedTrend)}
        onClose={() => setSelectedTrend(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: '20px', sm: '28px' },
            bgcolor: '#0B1120',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderTop: `5px solid ${selectedTrend?.color || '#38BDF8'}`,
            boxShadow: `0 30px 80px -15px rgba(0, 0, 0, 0.9), 0 0 50px ${selectedTrend?.color || '#38BDF8'}30`,
            backdropFilter: 'blur(24px)',
            overflow: 'hidden',
            maxHeight: '92vh'
          }
        }}
      >
        {selectedTrend && report && (
          <DialogContent sx={{ p: { xs: 2.5, sm: 4 }, overflowY: 'auto' }}>
            
            {/* Top Meta Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip
                  label={`${selectedTrend.icon} ${selectedTrend.badge || selectedTrend.categoryName}`}
                  size="small"
                  sx={{
                    height: 26,
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    bgcolor: selectedTrend.color || '#38BDF8',
                    color: '#FFFFFF',
                    borderRadius: '8px'
                  }}
                />
                <Chip
                  icon={<VerifiedUser sx={{ fontSize: '14px !important', color: '#38BDF8' }} />}
                  label="Digital Home Verified Report"
                  size="small"
                  sx={{
                    height: 26,
                    fontSize: '0.7rem',
                    fontWeight: 750,
                    bgcolor: 'rgba(56, 189, 248, 0.12)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '8px'
                  }}
                />
                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  <AccessTime sx={{ fontSize: 13 }} />
                  {selectedTrend.timeAgo}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Tooltip title={copied ? "Copied!" : "Share Report"}>
                  <IconButton 
                    onClick={handleShare}
                    size="small"
                    sx={{ color: copied ? '#10B981' : '#94A3B8', bgcolor: 'rgba(255,255,255,0.06)', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.15)' } }}
                  >
                    <Share sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <IconButton 
                  onClick={() => setSelectedTrend(null)}
                  size="small"
                  sx={{ color: '#94A3B8', bgcolor: 'rgba(255,255,255,0.06)', '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.2)' } }}
                >
                  <Close sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
            </Box>

            {/* Main Title Headline */}
            <Typography 
              variant="h4" 
              component="h2"
              sx={{ 
                fontWeight: 900, 
                fontSize: { xs: '1.25rem', sm: '1.65rem' },
                lineHeight: 1.35,
                color: '#FFFFFF',
                letterSpacing: '-0.025em',
                mb: 1
              }}
            >
              {selectedTrend.title}
            </Typography>

            {/* Subtitle / Context Header */}
            {report.subtitle && (
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: selectedTrend.color || '#38BDF8', 
                  fontSize: { xs: '0.88rem', sm: '0.98rem' },
                  fontWeight: 750,
                  mb: 2.8,
                  lineHeight: 1.4
                }}
              >
                {report.subtitle}
              </Typography>
            )}

            {/* Statistics / Key Numbers Grid (If Available) */}
            {report.statGrid && report.statGrid.length > 0 && (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                gap: 1.5,
                mb: 3
              }}>
                {report.statGrid.map((stat, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1.6,
                      borderRadius: '14px',
                      bgcolor: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.4 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 900, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
                      {stat.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Section 1: In-Depth Overview & Ground Story */}
            <Box sx={{
              p: { xs: 2, sm: 2.8 },
              mb: 3,
              borderRadius: '18px',
              bgcolor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: selectedTrend.color || '#38BDF8', 
                  fontWeight: 850, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.8,
                  fontSize: '0.92rem',
                  letterSpacing: 0.3,
                  mb: 1.5
                }}
              >
                <Explore sx={{ fontSize: 18 }} />
                विस्तृत रिपोर्ट व संपूर्ण पृष्ठभूमि (In-Depth Analysis)
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#E2E8F0', 
                  fontSize: '0.92rem', 
                  lineHeight: 1.7,
                  mb: 1.8
                }}
              >
                {report.summaryLead}
              </Typography>

              {report.groundReality && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#CBD5E1', 
                    fontSize: '0.88rem', 
                    lineHeight: 1.65 
                  }}
                >
                  {report.groundReality}
                </Typography>
              )}
            </Box>

            {/* Section 2: Key Takeaways / Points */}
            {report.keyTakeaways && report.keyTakeaways.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: '#F59E0B', 
                    fontWeight: 850, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.8,
                    fontSize: '0.92rem',
                    mb: 1.5
                  }}
                >
                  <CheckCircle sx={{ fontSize: 18 }} />
                  मुख्य तथ्य व जरूरी बिंदु (Key Highlights)
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {report.keyTakeaways.map((pt, i) => (
                    <Box 
                      key={i} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.2,
                        p: 1.4,
                        borderRadius: '12px',
                        bgcolor: 'rgba(30, 41, 59, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: selectedTrend.color || '#38BDF8', 
                        mt: 0.7, 
                        flexShrink: 0,
                        boxShadow: `0 0 8px ${selectedTrend.color || '#38BDF8'}`
                      }} />
                      <Typography variant="body2" sx={{ color: '#F1F5F9', fontSize: '0.88rem', lineHeight: 1.55 }}>
                        {pt}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Section 3: Actionable Checklist / Advice */}
            {report.actionChecklist && report.actionChecklist.length > 0 && (
              <Box sx={{
                p: { xs: 2, sm: 2.5 },
                mb: 3,
                borderRadius: '16px',
                bgcolor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)'
              }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: '#F59E0B', 
                    fontWeight: 850, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.8,
                    fontSize: '0.88rem',
                    mb: 1.2
                  }}
                >
                  <Lightbulb sx={{ fontSize: 18 }} />
                  नागरिकों व विद्यार्थियों के लिए जरूरी सलाह (Action Checklist)
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {report.actionChecklist.map((tip, idx) => (
                    <Typography key={idx} variant="body2" sx={{ color: '#FEF3C7', fontSize: '0.84rem', lineHeight: 1.55, display: 'flex', alignItems: 'flex-start', gap: 0.8 }}>
                      <span style={{ color: '#F59E0B', fontWeight: 800 }}>✔</span> {tip}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

            {/* Section 4: FAQs (Common Questions) */}
            {report.faqs && report.faqs.length > 0 && (
              <Box sx={{ mb: 3.5 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: '#A855F7', 
                    fontWeight: 850, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.8,
                    fontSize: '0.92rem',
                    mb: 1.5
                  }}
                >
                  <Help sx={{ fontSize: 18 }} />
                  अक्सर पूछे जाने वाले सवाल (FAQs)
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {report.faqs.map((faq, i) => (
                    <Box
                      key={i}
                      sx={{
                        p: 1.8,
                        borderRadius: '14px',
                        bgcolor: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.88rem', mb: 0.5 }}>
                        Q: {faq.q}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.84rem', lineHeight: 1.55 }}>
                        {faq.a}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 3 }} />

            {/* Internal Next Steps (Keeps User on Site!) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 850, textTransform: 'uppercase', letterSpacing: 1 }}>
                डिजिटल होम पोर्टल की अन्य महत्वपूर्ण सेवाएं:
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.2 }}>
                <Button
                  onClick={() => { setSelectedTrend(null); navigate('/job-alerts'); }}
                  variant="outlined"
                  startIcon={<Work sx={{ fontSize: 18 }} />}
                  sx={{
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                    bgcolor: 'rgba(56, 189, 248, 0.08)',
                    color: '#38BDF8',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    py: 1.2,
                    borderRadius: '12px',
                    '&:hover': { borderColor: '#38BDF8', bgcolor: 'rgba(56, 189, 248, 0.2)' }
                  }}
                >
                  सरकारी जॉब वैकेंसी व रिजल्ट्स
                </Button>

                <Button
                  onClick={() => { setSelectedTrend(null); navigate('/tools'); }}
                  variant="outlined"
                  startIcon={<Build sx={{ fontSize: 18 }} />}
                  sx={{
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    bgcolor: 'rgba(16, 185, 129, 0.08)',
                    color: '#10B981',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    py: 1.2,
                    borderRadius: '12px',
                    '&:hover': { borderColor: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.2)' }
                  }}
                >
                  फ्री स्टूडेंट टूल्स (Photo/PDF)
                </Button>

                <Button
                  onClick={() => { setSelectedTrend(null); navigate('/blog'); }}
                  variant="outlined"
                  startIcon={<Article sx={{ fontSize: 18 }} />}
                  sx={{
                    borderColor: 'rgba(168, 85, 247, 0.3)',
                    bgcolor: 'rgba(168, 85, 247, 0.08)',
                    color: '#A855F7',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    py: 1.2,
                    borderRadius: '12px',
                    '&:hover': { borderColor: '#A855F7', bgcolor: 'rgba(168, 85, 247, 0.2)' }
                  }}
                >
                  कैरियर व टेक ब्लॉग्स
                </Button>
              </Box>

              {/* Verified Editorial Footer (100% Self-Contained) */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography 
                  variant="caption"
                  sx={{
                    color: '#64748B',
                    fontSize: '0.72rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <VerifiedUser sx={{ fontSize: 13, color: '#10B981' }} />
                  Digital Home Editorial Desk द्वारा सत्यापित व संकलित | 100% ऑन-साइट रिपोर्ट
                </Typography>
              </Box>
            </Box>

          </DialogContent>
        )}
      </Dialog>
    </Box>
  );
}
