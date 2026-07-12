import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Box, Paper, List, ListItem, ListItemText, CircularProgress, Divider } from '@mui/material';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { request } from '../../../shared/lib/api';
import { postUrl } from '../../../shared/lib/category';

export default function ArchivePage() {
  const [archive, setArchive] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request('/api/posts?limit=1000').then(data => {
      const grouped = {};
      (data.posts || []).forEach(post => {
        const date = new Date(post.publishedAt || post.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!grouped[key]) {
          grouped[key] = {
            year: date.getFullYear(),
            month: date.toLocaleString('default', { month: 'long' }),
            posts: []
          };
        }
        grouped[key].posts.push(post);
      });
      setArchive(grouped);
      setLoading(false);
    });
  }, []);

  return (
    <Layout>
      <Seo title="Archive | Inkspire Blog" description="Browse all posts by month and year." noindex={true} />
      
      {/* Header Section */}
      <Box 
        sx={{ 
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          py: 6,
          mb: 4
        }}
      >
        <Container maxWidth="md">
          <Typography 
            variant="overline" 
            sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2, mb: 1, display: 'block' }}
          >
            Archive
          </Typography>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
            All Posts by Date
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse through all our articles organized by month and year
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          Object.keys(archive).sort().reverse().map((key, index) => (
            <Paper 
              key={key} 
              elevation={0}
              sx={{ 
                p: { xs: 3, md: 4 }, 
                mb: 4, 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 3,
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                {archive[key].month} {archive[key].year}
                <Typography 
                  component="span" 
                  variant="caption" 
                  sx={{ 
                    ml: 1, 
                    bgcolor: 'primary.light', 
                    color: 'primary.contrastText', 
                    px: 1.5, 
                    py: 0.5, 
                    borderRadius: 5,
                    fontWeight: 600
                  }}
                >
                  {archive[key].posts.length} posts
                </Typography>
              </Typography>
              
              <List disablePadding>
                {archive[key].posts.map((post, idx) => (
                  <Box key={post._id}>
                    <ListItem 
                      component={Link} 
                      to={postUrl(post)} 
                      sx={{ 
                        px: 0, 
                        py: 2,
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'action.hover',
                          px: 2,
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 600,
                              color: 'text.primary',
                              transition: 'color 0.2s',
                              '&:hover': { color: 'primary.main' }
                            }}
                          >
                            {post.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} • {post.readingTime || 5} min read
                          </Typography>
                        }
                      />
                    </ListItem>
                    {idx < archive[key].posts.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </Paper>
          ))
        )}
      </Container>
    </Layout>
  );
}
