import { Link } from 'react-router-dom';
import { Card, CardContent, Typography, Chip, Box, useTheme } from '@mui/material';
import CalendarToday from '@mui/icons-material/CalendarToday';
import AccessTime from '@mui/icons-material/AccessTime';
import Visibility from '@mui/icons-material/Visibility';
import { postUrl } from '../../../shared/lib/category';
import { optimizeImage } from '../../../shared/lib/images';

// Category color mapping
const categoryColors = {
  'Sarkari Jobs & Exams': '#F59E0B',
  'Health & Wellness': '#EF4444',
  'Tech & Tutorials': '#60A5FA',
  'AI & Web Tools': '#A78BFA',
  'News & Trends': '#34D399',
  'Finance & Business': '#10B981',
  'default': '#60A5FA'
};

export default function PostCard({ post, headingLevel = 'h6', index }) {
  const theme = useTheme();
  const categoryColor = categoryColors[post.category] || categoryColors.default;
  const isFirst = index === 0;
  
  return (
    <Card 
      component={Link} 
      to={postUrl(post)} 
      sx={{ 
        textDecoration: 'none',
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        borderRadius: { xs: '16px', md: '28px' },
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'all 0.3s ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02), 0 10px 40px rgba(0,0,0,0.04)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 10px 50px rgba(0,0,0,0.08)',
          borderColor: 'primary.light',
        }
      }}
    >
      <Box sx={{ position: 'relative', overflow: 'hidden', aspectRatio: '16/9', minHeight: { xs: '220px', sm: '260px' }, width: '100%', flexShrink: 0, bgcolor: '#0f172a' }}>
        {post.featuredImage ? (
          <Box
            component="img"
            src={optimizeImage(post.featuredImage, 400)}
            srcSet={`${optimizeImage(post.featuredImage, 360)} 360w, ${optimizeImage(post.featuredImage, 500)} 500w`}
            sizes="(max-width: 600px) 100vw, 400px"
            alt={post.title}
            width="400"
            height="225"
            loading={isFirst ? "eager" : "lazy"}
            {...(isFirst ? { fetchpriority: "high" } : {})}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.5s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              }
            }}
          />
        ) : (
          <Box 
            sx={{ 
              height: '100%', 
              bgcolor: categoryColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              {post.category}
            </Typography>
          </Box>
        )}
      </Box>
      
      <CardContent sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        p: { xs: 1.5, md: 2 },
        '&:last-child': { pb: { xs: 1.5, md: 2 } }
      }}>
        <Box sx={{ mb: 1.2, display: 'flex', alignItems: 'center' }}>
          <Chip 
            label={post.category} 
            size="small" 
            sx={{ 
              fontWeight: 850,
              fontSize: '0.78rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              bgcolor: `${categoryColor}18`,
              color: categoryColor,
              border: `1.5px solid ${categoryColor}50`,
              borderRadius: '8px',
              height: 26,
              px: 1,
            }} 
          />
        </Box>

        <Typography 
          variant={headingLevel}
          component={headingLevel}
          sx={{ 
            fontWeight: 850,
            fontSize: { xs: '1.12rem', sm: '1.2rem', md: '1.28rem' },
            lineHeight: 1.35,
            letterSpacing: '-0.025em',
            mb: 1,
            color: '#0f172a',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: { xs: '2.5em', md: '2.5em' },
            transition: 'color 0.2s ease-in-out',
            '&:hover': {
              color: 'primary.main',
            }
          }}
        >
          {post.title}
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 2,
            fontSize: { xs: '0.88rem', md: '0.94rem' },
            lineHeight: 1.6,
            color: '#475569',
            display: '-webkit-box',
            WebkitLineClamp: { xs: 2, md: 2 },
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {post.excerpt}
        </Typography>
        
        <Box sx={{ mt: 'auto', pt: 1.2, borderTop: '1px solid', borderColor: 'divider', minHeight: '24px' }}>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', gap: { xs: 1, md: 1.5 }, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <CalendarToday sx={{ fontSize: { xs: 12, md: 14 }, color: 'text.secondary' }} />
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: { xs: '0.72rem', md: '0.8rem' }, fontWeight: 600 }}>
                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <AccessTime sx={{ fontSize: { xs: 12, md: 14 }, color: 'text.secondary' }} />
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: { xs: '0.72rem', md: '0.8rem' }, fontWeight: 600 }}>
                  {post.readingTime || 5}m
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <Visibility sx={{ fontSize: { xs: 12, md: 14 }, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: { xs: '0.72rem', md: '0.8rem' }, fontWeight: 700 }}>
                {post.views || 0}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
