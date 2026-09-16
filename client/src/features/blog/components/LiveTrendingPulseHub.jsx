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
  Button
} from '@mui/material';
import { 
  Refresh, 
  OpenInNew, 
  AccessTime, 
  Language,
  ElectricBolt,
  Close,
  CheckCircle,
  Lightbulb,
  Explore,
  Work,
  Build,
  Article,
  Share
} from '@mui/icons-material';
import { request } from '../../../shared/lib/api';

/**
 * Generates structured, high-value contextual insights for the popup dialog.
 * Keeps users engaged on-site without kicking them out to third-party portals!
 */
function getTrendDetails(item) {
  if (!item) return null;
  const title = (item.title || '').toLowerCase();
  const cat = item.categoryKey || 'news';

  let overview = '';
  let keyPoints = [];
  let recommendation = '';

  if (cat === 'finance') {
    if (title.includes('upi') || title.includes('payment') || title.includes('npc') || title.includes('wallet')) {
      overview = `डिजिटल पेमेंट्स और UPI से जुड़ा यह एक महत्वपूर्ण अपडेट है। भारतीय राष्ट्रीय भुगतान निगम (NPCI) और RBI द्वारा डिजिटल लेन-देन को सुरक्षित, तेज और पारदर्शी बनाए रखने के लिए लगातार नए कदम उठाए जा रहे हैं। सामान्य यूज़र्स के पर्सनल (P2P) पेमेंट्स सुरक्षित और पूरी तरह फ्री बने हुए हैं।`;
      keyPoints = [
        'व्यक्तिगत लेन-देन (Person-to-Person UPI) पर कोई अतिरिक्त चार्ज नहीं है।',
        'व्यापारियों (Merchants) और वॉलेट पेमेंट्स के नियमों में अधिक पारदर्शिता लाई गई है।',
        'बैंक और NPCI द्वारा दैनिक ट्रांजेक्शन लिमिट्स व सुरक्षा मानकों का सख्ती से पालन किया जा रहा है।'
      ];
      recommendation = `अपने बैंकिंग ऐप या UPI ऐप (PhonePe, Google Pay, Paytm) में समय-समय पर डेली लिमिट और सुरक्षा सेटिंग्स को जरूर चेक करते रहें।`;
    } else if (title.includes('tax') || title.includes('budget') || title.includes('income') || title.includes('gst')) {
      overview = `आयकर (Income Tax) और सरकारी वित्तीय नियमों से जुड़ी यह नई रिपोर्ट है। टैक्सपेयर्स को नए और पुराने टैक्स रिजीम के नियमों, डिडक्शन और समयसीमा को ध्यान में रखकर ही अपनी टैक्स प्लानिंग करनी चाहिए।`;
      keyPoints = [
        'टैक्स फाइलिंग और डिडक्शन क्लेम करने की समयसीमा व नियमों का पालन अनिवार्य है।',
        'नए टैक्स स्लैब में मिलने वाली छूट का सही आंकलन करें।',
        'समय पर ई-वेरिफिकेशन पूरा करना जरूरी है।'
      ];
      recommendation = `सालाना टैक्स लायबिलिटी की गणना पहले से करें ताकि पेनल्टी और नोटिस से बचा जा सके।`;
    } else {
      overview = `बैंकिंग, शेयर मार्केट और अर्थव्यवस्था से जुड़ा यह अहम अपडेट है। वित्तीय संस्थानों और मार्केट एनालिस्ट्स के अनुसार यह बदलाव आम नागरिकों और निवेशकों के निर्णयों को प्रभावित कर सकता है।`;
      keyPoints = [
        'मार्केट के उतार-चढ़ाव और ब्याज दरों पर नजदीकी नजर रखें।',
        'सुरक्षित सेविंग्स स्कीम्स (जैसे FD या पोस्ट ऑफिस) और अन्य साधनों में संतुलन बनाएं।',
        'आरबीआई के निर्देशों के अनुसार बैंकों के नियमों में बदलाव लागू होते हैं।'
      ];
      recommendation = `किसी भी वित्तीय निवेश से पहले अपने बजट और जोखिम क्षमता (Risk Profile) का आंकलन जरूर करें।`;
    }
  } else if (cat === 'ai') {
    overview = `आर्टिफिशियल इंटेलिजेंस (AI) और वेब टूल्स की दुनिया में यह नया डेवलपमेंट हुआ है। आज के समय में AI टूल्स विद्यार्थियों, प्रोफेशनल्स और क्रिएटर्स के काम को कई गुना तेज और आसान बना रहे हैं।`;
    keyPoints = [
      'नए AI मॉडल्स की समझ और प्रॉम्प्टिंग क्षमता पहले से कहीं अधिक सटीक हो गई है।',
      'फ्री टूल्स के जरिए रिसर्च, कोडिंग, डिजाइन और डेटा एनालिसिस मिनटों में संभव है।',
      'स्मार्ट प्रॉम्प्ट्स का इस्तेमाल करके बेहतर व उपयोगी आउटपुट प्राप्त किया जा सकता है।'
    ];
    recommendation = `नए AI टूल्स को अपने दैनिक काम में शामिल करें और अपनी डिजिटल प्रोडक्टिविटी को 10x बूस्ट करें।`;
  } else if (cat === 'tech') {
    overview = `टेक्नोलॉजी, सॉफ्टवेयर और गैजेट्स से जुड़ी यह उपयोगी जानकारी है। स्मार्टफोन, ऑपरेटिंग सिस्टम और ऐप्स के नए अपडेट्स से यूज़र एक्सपीरियंस और डेटा सिक्योरिटी दोनों बेहतर होते हैं।`;
    keyPoints = [
      'डिवाइस की परफॉर्मेंस बढ़ाने के लिए गैर-जरूरी बैकग्राउंड प्रोसेस बंद रखें।',
      'ऐप परमिशन और प्राइवेसी सेटिंग्स को समय-समय पर रिव्यू करें।',
      'ऑपरेटिंग सिस्टम और जरूरी ऐप्स को हमेशा लेटेस्ट वर्जन पर अपडेट रखें।'
    ];
    recommendation = `अपने डेटा का क्लाउड या लोकल बैकअप नियमित रूप से लेते रहें ताकि डेटा लॉस का खतरा न रहे।`;
  } else if (cat === 'health') {
    overview = `स्वास्थ्य और जीवनशैली (Wellness) से जुड़ी यह महत्वपूर्ण रिपोर्ट है। व्यस्त दिनचर्या में सही खान-पान, पर्याप्त नींद और शारीरिक सक्रियता बनाए रखना सबसे जरूरी प्राथमिकता है।`;
    keyPoints = [
      'शरीर में दिखने वाले किसी भी असामान्य लक्षण या लगातार थकान को नजरअंदाज न करें।',
      'संतुलित आहार, पर्याप्त पानी और रोजाना कम से कम 20-30 मिनट का व्यायाम जरूरी है।',
      'लंबे समय तक स्क्रीन देखने से बचें और आंखों को नियमित आराम दें।'
    ];
    recommendation = `गंभीर स्वास्थ्य समस्याओं के लिए हमेशा प्रमाणित डॉक्टर या विशेषज्ञ से परामर्श लें।`;
  } else {
    overview = `देश-दुनिया और राष्ट्रीय महत्व के घटनाक्रम से जुड़ा यह अहम अपडेट है। प्रशासनिक और सरकारी नीतियों में होने वाले ये बदलाव नागरिकों और विद्यार्थियों के दैनिक जीवन व सामान्य ज्ञान के लिए उपयोगी हैं।`;
    keyPoints = [
      'सरकारी योजनाओं और आधिकारिक दिशानिर्देशों की पुष्टि केवल विश्वसनीय स्रोतों से करें।',
      'प्रतियोगी परीक्षाओं के करंट अफेयर्स के लिए यह अपडेट अत्यंत उपयोगी है।',
      'डिजिटल सुरक्षा और ऑनलाइन फ्रॉड से सतर्क रहना अनिवार्य है।'
    ];
    recommendation = `सटीक और प्रामाणिक सूचनाओं के लिए नियमित रूप से हमारे लाइव अलर्ट्स और अपडेट्स पोर्टल को फॉलो करते रहें।`;
  }

  return { overview, keyPoints, recommendation };
}

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
    const shareText = `${selectedTrend.title} - Read more on Digital Home Blog!`;
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

  const trendDetails = useMemo(() => {
    return getTrendDetails(selectedTrend);
  }, [selectedTrend]);

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
              Click any update card below to view detailed breakdown & insights right here on our portal.
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

                {/* Bottom Source & Tap to Read Prompt */}
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

                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: item.color || '#38BDF8', 
                      fontSize: '0.68rem', 
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.3
                    }}
                  >
                    विवरण देखें ➔
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}

      </Container>

      {/* POPUP MODAL DIALOG — Displays details on-site so user NEVER leaves the portal! */}
      <Dialog
        open={Boolean(selectedTrend)}
        onClose={() => setSelectedTrend(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: '#1E293B',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderTop: `4.5px solid ${selectedTrend?.color || '#38BDF8'}`,
            boxShadow: `0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 40px ${selectedTrend?.color || '#38BDF8'}30`,
            backdropFilter: 'blur(20px)',
            overflow: 'hidden'
          }
        }}
      >
        {selectedTrend && trendDetails && (
          <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            {/* Top Bar: Badges + Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip
                  label={`${selectedTrend.icon} ${selectedTrend.badge || selectedTrend.categoryName}`}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    bgcolor: selectedTrend.color || '#38BDF8',
                    color: '#FFFFFF',
                    borderRadius: '6px'
                  }}
                />
                <Chip
                  icon={<Language sx={{ fontSize: '13px !important', color: '#94A3B8' }} />}
                  label={selectedTrend.source}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    color: '#E2E8F0',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px'
                  }}
                />
                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  <AccessTime sx={{ fontSize: 13 }} />
                  {selectedTrend.timeAgo}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Tooltip title={copied ? "Copied!" : "Share Update"}>
                  <IconButton 
                    onClick={handleShare}
                    size="small"
                    sx={{ color: copied ? '#10B981' : '#94A3B8', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.08)' } }}
                  >
                    <Share sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <IconButton 
                  onClick={() => setSelectedTrend(null)}
                  size="small"
                  sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.1)' } }}
                >
                  <Close sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
            </Box>

            {/* Main Title Headline */}
            <Typography 
              variant="h5" 
              component="h3"
              sx={{ 
                fontWeight: 850, 
                fontSize: { xs: '1.15rem', sm: '1.35rem' },
                lineHeight: 1.4,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                mb: 2.5
              }}
            >
              {selectedTrend.title}
            </Typography>

            {/* Section 1: Overview Card */}
            <Box sx={{
              p: 2,
              mb: 2.5,
              borderRadius: '14px',
              bgcolor: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: selectedTrend.color || '#38BDF8', 
                  fontWeight: 800, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.8,
                  fontSize: '0.82rem',
                  mb: 1
                }}
              >
                <Explore sx={{ fontSize: 16 }} />
                त्वरित सारांश & मुख्य अपडेट
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#CBD5E1', 
                  fontSize: '0.88rem', 
                  lineHeight: 1.6 
                }}
              >
                {trendDetails.overview}
              </Typography>
            </Box>

            {/* Section 2: Key Takeaways Bullets */}
            <Box sx={{ mb: 2.5 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: '#F59E0B', 
                  fontWeight: 800, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.8,
                  fontSize: '0.82rem',
                  mb: 1.2
                }}
              >
                <CheckCircle sx={{ fontSize: 16 }} />
                खास बातें & मुख्य बिंदु (Highlights)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {trendDetails.keyPoints.map((pt, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: selectedTrend.color || '#38BDF8', 
                      mt: 0.9, 
                      flexShrink: 0 
                    }} />
                    <Typography variant="body2" sx={{ color: '#E2E8F0', fontSize: '0.84rem', lineHeight: 1.5 }}>
                      {pt}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Section 3: User Advice / Actionable Tip */}
            <Box sx={{
              p: 1.8,
              mb: 3,
              borderRadius: '12px',
              bgcolor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.2
            }}>
              <Lightbulb sx={{ color: '#F59E0B', fontSize: 20, mt: 0.2, flexShrink: 0 }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 850, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  आपके लिए जरूरी सलाह
                </Typography>
                <Typography variant="body2" sx={{ color: '#FEF3C7', fontSize: '0.82rem', mt: 0.2, lineHeight: 1.5 }}>
                  {trendDetails.recommendation}
                </Typography>
              </Box>
            </Box>

            {/* Internal Explore Links (Keeps user on site!) */}
            <Box sx={{
              pt: 2.2,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.2
            }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 750, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                हमारे पोर्टल पर अन्य महत्वपूर्ण सेवाएं:
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
                <Button
                  onClick={() => { setSelectedTrend(null); navigate('/job-alerts'); }}
                  variant="outlined"
                  size="small"
                  startIcon={<Work sx={{ fontSize: 16 }} />}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 0.8,
                    borderRadius: '8px',
                    '&:hover': { borderColor: '#38BDF8', bgcolor: 'rgba(56, 189, 248, 0.1)' }
                  }}
                >
                  Jobs & Vacancies
                </Button>

                <Button
                  onClick={() => { setSelectedTrend(null); navigate('/tools'); }}
                  variant="outlined"
                  size="small"
                  startIcon={<Build sx={{ fontSize: 16 }} />}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 0.8,
                    borderRadius: '8px',
                    '&:hover': { borderColor: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.1)' }
                  }}
                >
                  Free Tools
                </Button>

                <Button
                  onClick={() => { setSelectedTrend(null); navigate('/blog'); }}
                  variant="outlined"
                  size="small"
                  startIcon={<Article sx={{ fontSize: 16 }} />}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 0.8,
                    borderRadius: '8px',
                    '&:hover': { borderColor: '#A855F7', bgcolor: 'rgba(168, 85, 247, 0.1)' }
                  }}
                >
                  Blog Insights
                </Button>
              </Box>

              {/* Optional external source reference */}
              {selectedTrend.url && selectedTrend.url !== '#' && (
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <Typography 
                    component="a"
                    href={selectedTrend.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#64748B',
                      fontSize: '0.7rem',
                      textDecoration: 'underline',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.4,
                      '&:hover': { color: '#94A3B8' }
                    }}
                  >
                    मूल स्रोत संदर्भ देखें ({selectedTrend.source}) <OpenInNew sx={{ fontSize: 11 }} />
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </Box>
  );
}
