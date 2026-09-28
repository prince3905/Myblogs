import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, IconButton, Button, Dialog } from '@mui/material';
import Close from '@mui/icons-material/Close';
import OpenInNew from '@mui/icons-material/OpenInNew';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import Handyman from '@mui/icons-material/Handyman';
import WhatsApp from '@mui/icons-material/WhatsApp';
import { optimizeImage } from '../../../shared/lib/images';

export default function ReelsModalPlayer({ open, onClose, stories = [], initialIndex = 0 }) {
  const [currentReelIndex, setCurrentReelIndex] = useState(initialIndex);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reelAnimation, setReelAnimation] = useState('fade'); // 'slide-up', 'slide-down', 'fade'

  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const holdTimerRef = useRef(null);
  const isHolding = useRef(false);
  const wheelThrottled = useRef(false);

  // Sync initial index
  useEffect(() => {
    if (open) {
      const validIndex = Math.max(0, Math.min(initialIndex, stories.length - 1));
      setCurrentReelIndex(validIndex);
      setCurrentSlideIndex(0);
      setProgress(0);
      setIsPaused(false);
      setReelAnimation('fade');
    }
  }, [open, initialIndex, stories.length]);

  const activeStory = stories[currentReelIndex] || null;
  const slides = activeStory?.slides || [];
  const activeSlide = slides[currentSlideIndex] || slides[0] || null;

  // View Counter / Internal Traffic Analytics
  useEffect(() => {
    if (open && activeStory?.slug) {
      try {
        fetch(`/api/public/web-stories/${activeStory.slug}/amp-ping?source=website-reels`, {
          method: 'GET',
          keepalive: true
        }).catch(() => {});
      } catch (_) {}
    }
  }, [open, currentReelIndex, activeStory?.slug]);

  // Preload next slide and next reel images in background (butter-smooth 0ms latency)
  useEffect(() => {
    if (!open) return;
    
    // 1. Preload next slide of current reel
    if (currentSlideIndex < slides.length - 1) {
      const nextSlideImg = slides[currentSlideIndex + 1]?.image;
      if (nextSlideImg) {
        const img = new Image();
        img.src = optimizeImage(nextSlideImg, 480, 854);
      }
    }

    // 2. Preload first slide of next reel
    if (currentReelIndex < stories.length - 1) {
      const nextReelCover = stories[currentReelIndex + 1]?.slides?.[0]?.image;
      if (nextReelCover) {
        const img = new Image();
        img.src = optimizeImage(nextReelCover, 480, 854);
      }
    }
  }, [open, currentReelIndex, currentSlideIndex, slides, stories]);

  // Slide navigation
  const nextSlide = useCallback(() => {
    setProgress(0);
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      // Finished all 5 slides -> Advance to next reel
      if (currentReelIndex < stories.length - 1) {
        setReelAnimation('slide-up');
        setCurrentReelIndex(prev => prev + 1);
        setCurrentSlideIndex(0);
      } else {
        // Loop back to first reel
        setReelAnimation('fade');
        setCurrentReelIndex(0);
        setCurrentSlideIndex(0);
      }
    }
  }, [currentSlideIndex, slides.length, currentReelIndex, stories.length]);

  const prevSlide = useCallback(() => {
    setProgress(0);
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    } else if (currentReelIndex > 0) {
      // Go back to previous reel
      setReelAnimation('slide-down');
      setCurrentReelIndex(prev => prev - 1);
      setCurrentSlideIndex(0);
    }
  }, [currentSlideIndex, currentReelIndex]);

  // Reel navigation (Vertical Swipe Up / Down)
  const nextReel = useCallback(() => {
    if (currentReelIndex < stories.length - 1) {
      setReelAnimation('slide-up');
      setCurrentReelIndex(prev => prev + 1);
      setCurrentSlideIndex(0);
      setProgress(0);
    }
  }, [currentReelIndex, stories.length]);

  const prevReel = useCallback(() => {
    if (currentReelIndex > 0) {
      setReelAnimation('slide-down');
      setCurrentReelIndex(prev => prev - 1);
      setCurrentSlideIndex(0);
      setProgress(0);
    }
  }, [currentReelIndex]);

  // Auto-advance progress timer (WhatsApp / Instagram style)
  useEffect(() => {
    if (!open || !activeStory || isPaused) return;

    // Slide 5 stays longer (8 seconds) for candidate to click Apply
    const durationMs = currentSlideIndex === slides.length - 1 ? 8000 : 5000;
    const intervalMs = 50;
    const step = (intervalMs / durationMs) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [open, activeStory, isPaused, currentSlideIndex, slides.length, nextSlide]);

  // Touch and Long-Press handlers
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    holdTimerRef.current = setTimeout(() => {
      isHolding.current = true;
      setIsPaused(true);
    }, 220);
  };

  const handleTouchEnd = (e) => {
    clearTimeout(holdTimerRef.current);
    if (isHolding.current) {
      isHolding.current = false;
      setIsPaused(false);
      return;
    }

    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - touchEndY;
    const deltaX = Math.abs(touchStartX.current - touchEndX);

    // Vertical swipe threshold 45px (with low horizontal drift)
    if (deltaY > 45 && deltaX < 80) {
      // Swiped UP -> Next Reel
      nextReel();
    } else if (deltaY < -45 && deltaX < 80) {
      // Swiped DOWN -> Prev Reel
      prevReel();
    } else if (Math.abs(deltaY) < 25 && deltaX < 25) {
      // Clean tap on left/right half
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const rect = containerRef.current?.getBoundingClientRect();
      const relativeX = rect ? touchEndX - rect.left : touchEndX;
      
      if (relativeX < containerWidth * 0.35) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
  };

  // Desktop Mouse Wheel support (Trackpad / Mouse wheel scroll up & down)
  const handleWheel = (e) => {
    if (wheelThrottled.current) return;
    if (Math.abs(e.deltaY) > 30) {
      wheelThrottled.current = true;
      if (e.deltaY > 0) {
        nextReel();
      } else {
        prevReel();
      }
      setTimeout(() => {
        wheelThrottled.current = false;
      }, 400);
    }
  };

  // Keyboard controls
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        nextReel();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        prevReel();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, nextReel, prevReel, nextSlide, prevSlide, onClose]);

  // 1-Click WhatsApp Share
  const handleShareWhatsApp = () => {
    if (!activeStory) return;
    const url = `https://www.digitalhomeblog.in/web-stories/${activeStory.slug}`;
    const text = `🔥 *${activeStory.title}*\n\n📋 कुल पद, योग्यता व अंतिम तिथि की पूरी रील यहाँ देखें:\n👉 ${url}\n\n100% सत्यापित सरकारी नौकरी अपडेट।`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!open || !activeStory) return null;

  // Smart URL destination: direct official link or verified blog post
  const applyUrl = activeSlide?.link || (
    activeStory.post?.category && activeStory.post?.slug
      ? `/blog/${activeStory.post.category}/${activeStory.post.slug}`
      : `/web-stories/${activeStory.slug}`
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: 'rgba(0,0,0,0.94)',
          color: '#fff',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none'
        }
      }}
    >
      {/* Container simulating vertical phone screen */}
      <Box
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: { xs: '100%', sm: '420px', md: '440px' },
          height: '100%',
          maxHeight: { xs: '100%', sm: '880px' },
          bgcolor: '#090D16',
          borderRadius: { xs: 0, sm: '24px' },
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.95)',
          display: 'flex',
          flexDirection: 'column',
          touchAction: 'none',
          willChange: 'transform',
          animation: reelAnimation === 'slide-up' 
            ? 'reelSlideUp 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)' 
            : reelAnimation === 'slide-down'
            ? 'reelSlideDown 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)'
            : 'reelFade 0.25s ease-out',
          '@keyframes reelSlideUp': {
            '0%': { transform: 'translateY(40px)', opacity: 0.7 },
            '100%': { transform: 'translateY(0)', opacity: 1 }
          },
          '@keyframes reelSlideDown': {
            '0%': { transform: 'translateY(-40px)', opacity: 0.7 },
            '100%': { transform: 'translateY(0)', opacity: 1 }
          },
          '@keyframes reelFade': {
            '0%': { opacity: 0.6 },
            '100%': { opacity: 1 }
          }
        }}
      >
        {/* Background Image of Active Slide */}
        <Box
          component="img"
          key={`${activeStory._id}-${currentSlideIndex}`}
          src={optimizeImage(activeSlide?.image || activeStory.slides?.[0]?.image, 480, 854)}
          alt={activeSlide?.heading || activeStory.title}
          loading="eager"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.25s ease',
            zIndex: 1
          }}
        />

        {/* Cinematic Gradient Vignette */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.96) 100%)',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />

        {/* Top Header: Progress Lines (WhatsApp Style) & Close Button */}
        <Box sx={{ position: 'relative', zIndex: 10, p: 2, pt: { xs: 2, sm: 2.5 } }}>
          {/* Progress Bars */}
          <Box sx={{ display: 'flex', gap: 0.8, mb: 1.5 }}>
            {slides.map((_, idx) => (
              <Box
                key={idx}
                sx={{
                  flex: 1,
                  height: '3px',
                  bgcolor: 'rgba(255,255,255,0.35)',
                  borderRadius: '99px',
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    bgcolor: '#fff',
                    borderRadius: '99px',
                    width: idx < currentSlideIndex ? '100%' : idx === currentSlideIndex ? `${progress}%` : '0%',
                    transition: idx === currentSlideIndex ? 'width 0.05s linear' : 'none'
                  }}
                />
              </Box>
            ))}
          </Box>

          {/* Top Info Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                component="img"
                src="https://www.digitalhomeblog.in/logo.png"
                alt="Digital Home"
                sx={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #fff' }}
              />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff', lineHeight: 1.1 }}>
                  Digital Home Sarkari
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem' }}>
                  Reel {currentReelIndex + 1} of {stories.length}
                </Typography>
              </Box>
            </Box>

            <IconButton
              onClick={onClose}
              sx={{ color: '#fff', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
              size="small"
              aria-label="Close Reels Player"
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Right Floating Action Bar (Instagram Reels Style) */}
        <Box
          sx={{
            position: 'absolute',
            right: 14,
            bottom: 120,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2.2
          }}
        >
          {/* WhatsApp Share */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IconButton
              onClick={handleShareWhatsApp}
              aria-label="Share on WhatsApp"
              sx={{
                bgcolor: '#25D366',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(37,211,102,0.4)',
                '&:hover': { bgcolor: '#20BA5C' },
                width: 44,
                height: 44
              }}
            >
              <WhatsApp fontSize="small" />
            </IconButton>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, mt: 0.5, color: '#fff' }}>
              शेयर
            </Typography>
          </Box>

          {/* Tools Shortcut */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IconButton
              component="a"
              href="/tools"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Student Tools"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
                width: 44,
                height: 44
              }}
            >
              <Handyman fontSize="small" />
            </IconButton>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, mt: 0.5, color: '#fff' }}>
              टूल्स
            </Typography>
          </Box>

          {/* Next Reel Indicator */}
          {currentReelIndex < stories.length - 1 ? (
            <Box
              onClick={nextReel}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                animation: 'pulse 1.5s infinite'
              }}
            >
              <KeyboardArrowUp sx={{ fontSize: 32, color: '#fde047' }} />
              <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#fde047', textTransform: 'uppercase' }}>
                Next Reel
              </Typography>
            </Box>
          ) : (
            <Box
              onClick={prevReel}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <KeyboardArrowDown sx={{ fontSize: 32, color: '#94a3b8' }} />
              <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8' }}>
                Prev Reel
              </Typography>
            </Box>
          )}
        </Box>

        {/* Center / Bottom Content Area */}
        <Box sx={{ position: 'relative', zIndex: 9, mt: 'auto', p: 3, pb: 4, pr: 8 }}>
          {/* Slide Category Badge */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1.5,
              py: 0.4,
              borderRadius: '99px',
              bgcolor: currentSlideIndex === slides.length - 1 ? '#DC2626' : '#2563EB',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              mb: 1.2,
              boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
            }}
          >
            {currentSlideIndex === 0 && '🔥 Vacancy Alert'}
            {currentSlideIndex === 1 && '📋 Qualification'}
            {currentSlideIndex === 2 && '📅 Dates & Fees'}
            {currentSlideIndex === 3 && '🛠️ Free Student Tools'}
            {currentSlideIndex === 4 && '⚡ 100% Verified Apply Link'}
          </Box>

          {/* Heading */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.25,
              fontSize: { xs: '1.25rem', sm: '1.4rem' },
              textShadow: '0 2px 8px rgba(0,0,0,0.9)',
              mb: 1
            }}
          >
            {activeSlide?.heading || activeStory.title}
          </Typography>

          {/* Text Description */}
          <Typography
            variant="body2"
            sx={{
              color: '#E2E8F0',
              fontSize: { xs: '0.875rem', sm: '0.925rem' },
              lineHeight: 1.45,
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              mb: 2.5
            }}
          >
            {activeSlide?.text || activeStory.title}
          </Typography>

          {/* Main Call to Action Button */}
          <Button
            component="a"
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            fullWidth
            endIcon={<OpenInNew fontSize="small" />}
            sx={{
              py: 1.3,
              borderRadius: '99px',
              fontWeight: 800,
              fontSize: '0.925rem',
              bgcolor: currentSlideIndex === slides.length - 1 ? '#059669' : '#2563EB',
              boxShadow: currentSlideIndex === slides.length - 1 
                ? '0 6px 20px rgba(5,150,105,0.6)' 
                : '0 6px 20px rgba(37,99,235,0.6)',
              textTransform: 'none',
              letterSpacing: '0.02em',
              '&:hover': { 
                bgcolor: currentSlideIndex === slides.length - 1 ? '#047857' : '#1D4ED8' 
              }
            }}
          >
            {activeSlide?.linkText || (
              currentSlideIndex === slides.length - 1
                ? '👉 आधिकारिक नोटिफिकेशन PDF व ऑनलाइन फॉर्म'
                : '📢 पूरी भर्ती विवरण व योग्यता देखें'
            )}
          </Button>

          {/* Swipe Up Hint Footer */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1.5, opacity: 0.85 }}>
            <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#F1F5F9', fontWeight: 600 }}>
              अगली भर्ती देखने के लिए ऊपर स्वाइप करें (Swipe Up) 👆
            </Typography>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
