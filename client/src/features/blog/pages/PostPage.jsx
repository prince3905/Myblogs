import { Link, useParams } from 'react-router-dom';
import { Container, Typography, Box, Button, Chip, Grid, CircularProgress, Alert, Divider, Paper } from '@mui/material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import ReadingProgress from '../../../components/ReadingProgress';
import LikeButton from '../../../components/LikeButton';
import CommentSection from '../components/CommentSection';
import SocialShare from '../../../components/SocialShare';
import { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-jsx';
import { usePost } from '../../../hooks/usePost';

export default function PostPage() {
  const { slug } = useParams();
  const { post, loading, error } = usePost(slug);

  useEffect(() => {
    if (post && post.content) {
      setTimeout(() => {
        Prism.highlightAll();
      }, 100);
    }
  }, [post]);

  if (loading) {
    return <Layout><Container sx={{ py: 8, textAlign: 'center' }}><CircularProgress size={60} /></Container></Layout>;
  }

  if (error) {
    return <Layout><Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container></Layout>;
  }

  if (!post) {
    return <Layout><Container sx={{ py: 4 }}><Alert severity="warning">Post not found</Alert></Container></Layout>;
  }

  return (
    <Layout>
       <ReadingProgress />
       <Seo 
         title={post.seoTitle || post.title} 
         description={post.seoDescription || post.excerpt}
         image={post.featuredImage}
         url={`${window.location.origin}/blog/${post.slug}`}
       />
      
      {/* Hero Image Section */}
      {post.featuredImage ? (
        <Box sx={{ 
          width: '100%', 
          height: { xs: '40vh', md: '60vh' },
          backgroundImage: `url(${post.featuredImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          mb: 4,
        }}>
          <Box sx={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          }} />
          <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, pb: 4 }}>
            <Chip label={post.category} sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'primary.main', fontWeight: 600, mb: 2 }} />
            <Typography variant="h2" sx={{ color: 'white', fontWeight: 700, mb: 2, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              {post.title}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2 }}>
              {new Date(post.publishedAt || post.createdAt).toLocaleDateString()} • {post.readingTime} min read • {post.views || 0} views
            </Typography>
          </Container>
        </Box>
      ) : null}

       {/* Content Section */}
       <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
         {/* Back button */}
         <Button 
           component={Link} 
           to="/blog" 
           color="primary" 
           sx={{ mb: 3, fontWeight: 600 }}
         >
           ← Back to blog
         </Button>

        {/* Title (if no featured image) */}
        {!post.featuredImage && (
          <>
            <Chip label={post.category} sx={{ mb: 2 }} />
            <Typography variant="h2" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              {post.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {new Date(post.publishedAt || post.createdAt).toLocaleDateString()} • {post.readingTime} min read • {post.views || 0} views
            </Typography>
          </>
        )}

        {/* Excerpt */}
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontStyle: 'italic', lineHeight: 1.7 }}>
          {post.excerpt}
        </Typography>

        {/* Content */}
        <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, mb: 4, bgcolor: 'background.paper' }}>
          <div 
            dangerouslySetInnerHTML={{ __html: post.content }} 
            style={{ lineHeight: 1.8, fontSize: '1.1rem' }}
          />
        </Paper>

        {/* Tags */}
        {post.tags?.length ? (
          <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {post.tags.map((tag) => <Chip key={tag} label={`#${tag}`} size="small" />)}
          </Box>
        ) : null}

        {/* Actions: Like + Share */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center' }}>
          <LikeButton slug={slug} initialLikes={post.likes || 0} />
          <SocialShare title={post.title} slug={slug} />
        </Box>

        <Divider sx={{ my: 4 }} />
        
        {/* Comments */}
        <CommentSection slug={slug} />
      </Container>

      {/* Related Posts */}
      {post.relatedPosts?.length > 0 && (
        <Box sx={{ bgcolor: 'grey.50', py: 6 }}>
          <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>Related Posts</Typography>
            <Grid container spacing={3}>
              {post.relatedPosts.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item._id}>
                  <PostCard post={item} />
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}
    </Layout>
  );
}
