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
      <Box sx={{ position: 'relative', overflow: 'hidden', aspectRatio: '16/9', flexShrink: 0, bgcolor: '#0f172a' }}>
        {post.featuredImage ? (
          <Box
            component="img"
            src={optimizeImage(post.featuredImage, 400)}
            alt={post.title}
            width="700"
            height="394"
            loading={isFirst ? "eager" : "lazy"}
            {...(isFirst ? { fetchpriority: "high" } : {})}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
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
        <Chip 
          label={post.category} 
          size="small" 
          sx={{ 
            position: 'absolute',
            top: 12,
            left: 12,
            fontWeight: 600,
            fontSize: '0.7rem',
            bgcolor: 'rgba(255,255,255,0.95)',
            color: categoryColor,
            borderRadius: '9999px',
            px: 1,
          }} 
        />
      </Box>
      
      <CardContent sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        p: { xs: 1.5, md: 2 },
        '&:last-child': { pb: { xs: 1.5, md: 2 } }
      }}>
        <Typography 
          variant={headingLevel}
          component={headingLevel}
          sx={{ 
            fontWeight: 700,
            fontSize: { xs: '0.95rem', md: '1.1rem' },
            lineHeight: 1.3,
            mb: 0.5,
            color: 'text.primary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: { xs: '2.2em', md: '2.2em' },
            transition: 'color 0.2s',
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
            mb: 1.5,
            fontSize: { xs: '0.8rem', md: '0.875rem' },
            lineHeight: 1.5,
            color: 'text.secondary',
            display: '-webkit-box',
            WebkitLineClamp: { xs: 1, md: 2 },
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {post.excerpt}
        </Typography>
        
        <Box sx={{ mt: 'auto', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', gap: { xs: 0.5, md: 1 }, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <CalendarToday sx={{ fontSize: { xs: 10, md: 12 }, color: 'text.secondary' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <AccessTime sx={{ fontSize: { xs: 10, md: 12 }, color: 'text.secondary' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                  {post.readingTime || 5}m
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <Visibility sx={{ fontSize: { xs: 10, md: 12 }, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                {post.views || 0}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
