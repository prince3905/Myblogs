import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Grid, Card, CardContent, Chip,
  TextField, Button, CircularProgress, Dialog, DialogTitle,
  DialogContent, IconButton, Divider
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import ShareIcon from '@mui/icons-material/Share';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Telegram';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Layout from '../components/Layout';
import Seo from '../components/Seo';

const NEWS_TOPIC_PILLS = [
  { id: 'all', label: '🌐 All World News' },
  { id: 'un', label: '🇺🇳 UN & Multilateral' },
  { id: 'economy', label: '📈 Global Economy & Trade' },
  { id: 'policy', label: '🏛️ International Policy' },
  { id: 'diplomacy', label: '🤝 World Diplomacy' }
];

export default function GlobalNewsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    fetchGlobalNews();
  }, []);

  const fetchGlobalNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/public/trending-pulse?category=global');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setItems(data.data);
      } else {
        // Fallback to all trending pulse items
        const fallbackRes = await fetch('/api/public/trending-pulse');
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success && Array.isArray(fallbackData.data)) {
          setItems(fallbackData.data);
        }
      }
    } catch (e) {
      console.error('Failed to load global news:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const text = `${item.title || ''} ${item.overview || ''} ${item.source || ''}`.toLowerCase();
    const matchesSearch = !searchQuery || text.includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedTopic === 'all') return true;
    if (selectedTopic === 'un') return text.includes('un') || text.includes('nations') || text.includes('who');
    if (selectedTopic === 'economy') return text.includes('economy') || text.includes('bank') || text.includes('trade') || text.includes('market');
    if (selectedTopic === 'policy') return text.includes('policy') || text.includes('government') || text.includes('gazette');
    if (selectedTopic === 'diplomacy') return text.includes('summit') || text.includes('talks') || text.includes('treaty') || text.includes('foreign');
    return true;
  });

  const handleShare = (platform, article) => {
    const shareUrl = window.location.href;
    const text = `${article.title} - Global News & World Affairs 2026`;
    if (platform === 'wa') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + shareUrl)}`, '_blank');
    } else if (platform === 'tg') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, '_blank');
    } else if (navigator.share) {
      navigator.share({ title: text, text, url: shareUrl }).catch(() => {});
    }
  };

  return (
    <Layout>
      <Seo
        title="ग्लोबल न्यूज़ व विश्व मामले 2026 | Global News, World Affairs & International Policy"
        description="संयुक्त राष्ट्र (UN), विश्व बैंक, WHO, अंतरराष्ट्रीय संधियों और 195 देशों की आधिकारिक नीतियों के सत्यापित विश्व समाचार। 100% Factual Global News Desk."
        keywords={['Global News 2026', 'World Affairs', 'International Policy', 'UN News', 'Global Careers News', 'World Bank updates']}
      />

      <Box sx={{ bgcolor: '#0B0F19', minHeight: '100vh', color: '#F8FAFC', py: { xs: 3, md: 5 } }}>
        <Container maxWidth="lg">
          {/* Hero Banner */}
          <Box sx={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0369A1 100%)',
            borderRadius: 4,
            p: { xs: 3, md: 4.5 },
            mb: 4,
            border: '1px solid #334155',
            boxShadow: '0 20px 40px -15px rgba(2, 132, 199, 0.25)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <PublicIcon sx={{ color: '#38BDF8', fontSize: 28 }} />
              <Chip
                label="🌐 195 Sovereign Countries Global News Desk"
                sx={{ bgcolor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.3)' }}
              />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', md: '2.4rem' }, mb: 1.5, letterSpacing: '-0.5px' }}>
              Global News & World Affairs 2026
            </Typography>
            <Typography variant="body1" sx={{ color: '#94A3B8', fontSize: { xs: '0.92rem', md: '1.05rem' }, maxWidth: 820, lineHeight: 1.6, mb: 3 }}>
              संयुक्त राष्ट्र (UN), विश्व बैंक, WHO और 195 संप्रभु देशों की आधिकारिक नीतियों, अंतरराष्ट्रीय कूटनीति और वैश्विक घटनाक्रमों का 100% सत्यापित समाचार बुलेटिन।
            </Typography>

            {/* Filter Pills */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {NEWS_TOPIC_PILLS.map(p => (
                <Chip
                  key={p.id}
                  label={p.label}
                  clickable
                  onClick={() => setSelectedTopic(p.id)}
                  sx={{
                    bgcolor: selectedTopic === p.id ? '#0284C7' : 'rgba(255,255,255,0.08)',
                    color: selectedTopic === p.id ? '#FFFFFF' : '#E2E8F0',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: selectedTopic === p.id ? '#38BDF8' : 'rgba(255,255,255,0.15)',
                    '&:hover': { bgcolor: selectedTopic === p.id ? '#0369A1' : 'rgba(255,255,255,0.15)' }
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Search Bar */}
          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search global affairs, UN directives, treaties, summits, or policy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#64748B', mr: 1 }} />,
                sx: {
                  bgcolor: '#1E293B',
                  color: '#F8FAFC',
                  borderRadius: 3,
                  '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#38BDF8' }
                }
              }}
            />
          </Box>

          {/* Loading Indicator */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#38BDF8' }} />
            </Box>
          ) : filteredItems.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#1E293B', borderRadius: 3, p: 4, border: '1px solid #334155' }}>
              <PublicIcon sx={{ fontSize: 48, color: '#64748B', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#F1F5F9' }}>
                No Global News Found Matching "{searchQuery}"
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>
                Try clearing your search query or switching to 'All World News'.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {filteredItems.map((item, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card
                    onClick={() => setSelectedArticle(item)}
                    sx={{
                      bgcolor: '#131D31',
                      color: '#F8FAFC',
                      borderRadius: 3,
                      border: '1px solid #1E293B',
                      cursor: 'pointer',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        borderColor: '#38BDF8',
                        boxShadow: '0 12px 28px -8px rgba(56, 189, 248, 0.2)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Chip
                          label={item.badge || 'WORLD AFFAIRS'}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(2, 132, 199, 0.15)',
                            color: '#38BDF8',
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            border: '1px solid rgba(56, 189, 248, 0.3)'
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94A3B8' }}>
                          <AccessTimeIcon sx={{ fontSize: 13 }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {item.timeAgo || 'Recent'}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#F8FAFC', lineHeight: 1.35, mb: 1.5 }}>
                        {item.title}
                      </Typography>

                      <Typography variant="body2" sx={{
                        color: '#94A3B8',
                        lineHeight: 1.5,
                        mb: 2,
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {item.overview || item.editorialOverview || 'Click to read verified intelligence, context, key takeaways and official policy background.'}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1.5, borderTop: '1px solid #1E293B' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <VerifiedIcon sx={{ color: '#10B981', fontSize: 16 }} />
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                            {item.source || 'Global Intelligence Desk'}
                          </Typography>
                        </Box>
                        <ArrowForwardIcon sx={{ color: '#38BDF8', fontSize: 18 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Article Detail Modal */}
          <Dialog
            open={Boolean(selectedArticle)}
            onClose={() => setSelectedArticle(null)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                bgcolor: '#0B0F19',
                color: '#F8FAFC',
                borderRadius: 4,
                border: '1px solid #1E293B',
                p: { xs: 1, md: 2 }
              }
            }}
          >
            {selectedArticle && (
              <>
                <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', pb: 1 }}>
                  <Box>
                    <Chip
                      label={selectedArticle.badge || 'WORLD AFFAIRS'}
                      size="small"
                      sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 800, mb: 1 }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#F8FAFC', lineHeight: 1.3 }}>
                      {selectedArticle.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', mt: 0.5, display: 'block' }}>
                      Verified by: {selectedArticle.source || 'Global Intelligence Desk'} • {selectedArticle.timeAgo || 'Recent'}
                    </Typography>
                  </Box>
                  <IconButton onClick={() => setSelectedArticle(null)} sx={{ color: '#94A3B8' }}>
                    <CloseIcon />
                  </IconButton>
                </DialogTitle>

                <DialogContent sx={{ py: 2 }}>
                  <Box sx={{ bgcolor: '#131D31', p: 2.5, borderRadius: 3, mb: 3, border: '1px solid #1E293B' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#38BDF8', mb: 1 }}>
                      📋 Editorial Overview & Policy Summary
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#E2E8F0', lineHeight: 1.7 }}>
                      {selectedArticle.overview || selectedArticle.editorialOverview || selectedArticle.title}
                    </Typography>
                  </Box>

                  {Array.isArray(selectedArticle.keyPoints) && selectedArticle.keyPoints.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#10B981', mb: 1.5 }}>
                        ✨ Key Highlights & Strategic Takeaways
                      </Typography>
                      <Box component="ul" sx={{ pl: 2.5, color: '#CBD5E1', m: 0 }}>
                        {selectedArticle.keyPoints.map((kp, i) => (
                          <li key={i} style={{ marginBottom: '8px', lineHeight: 1.5 }}>{kp}</li>
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ borderColor: '#1E293B', my: 2.5 }} />

                  {/* Share actions */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                      Share Verified Intelligence:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        onClick={() => handleShare('wa', selectedArticle)}
                        startIcon={<WhatsAppIcon />}
                        sx={{ bgcolor: '#16A34A', color: 'white', textTransform: 'none', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#15803D' } }}
                      >
                        WhatsApp
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleShare('tg', selectedArticle)}
                        startIcon={<TelegramIcon />}
                        sx={{ bgcolor: '#0284C7', color: 'white', textTransform: 'none', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#0369A1' } }}
                      >
                        Telegram
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleShare('native', selectedArticle)}
                        startIcon={<ShareIcon />}
                        sx={{ bgcolor: '#334155', color: '#F8FAFC', textTransform: 'none', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#475569' } }}
                      >
                        Share
                      </Button>
                    </Box>
                  </Box>
                </DialogContent>
              </>
            )}
          </Dialog>
        </Container>
      </Box>
    </Layout>
  );
}
