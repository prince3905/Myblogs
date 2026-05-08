import { Link } from 'react-router-dom';
import { Card, CardContent, Typography, Chip, Box, useTheme } from '@mui/material';
import { CalendarToday, AccessTime, Visibility, Favorite } from '@mui/icons-material';

export default function PostCard({ post }) {
  const theme = useTheme();
  
  return (
    <Card 
      component={Link} 
      to={`/blog/${post.slug}`} 
      sx={{ 
        textDecoration: 'none',
        display: 'flex', 
        flexDirection: 'column',
        height: 480,
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 20px 40px rgba(0,0,0,0.4)' 
            : '0 20px 40px rgba(0,0,0,0.1)',
          borderColor: 'primary.main',
        }
      }}
    >
      {/* Fixed height image section */}
      <Box sx={{ position: 'relative', overflow: 'hidden', height: 200, flexShrink: 0 }}>
        {post.featuredImage ? (
          <Box
            component="img"
            src={post.featuredImage}
            alt={post.title}
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
              bgcolor: 'primary.main',
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
            bgcolor: 'rgba(255,255,255,0.95)',
            color: 'primary.main',
          }} 
        />
      </Box>
      
      {/* Content section with fixed spacing */}
      <CardContent sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        p: 3,
        '&:last-child': { pb: 3 }
      }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            lineHeight: 1.4,
            mb: 2,
            color: 'text.primary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.8em',
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
          color="text.secondary" 
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.7,
            flex: 1,
            minHeight: '4.2em',
          }}
        >
          {post.excerpt}
        </Typography>
        
        {/* Push stats to bottom */}
        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarToday sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.disabled">
                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.disabled">
                  {post.readingTime || 5}m
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <Visibility sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.disabled">
                  {post.views || 0}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
