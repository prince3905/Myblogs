import { Link, useParams } from 'react-router-dom';
import { Container, Typography, Box, Button, Chip, Grid, CircularProgress, Alert, Divider, Paper, Avatar } from '@mui/material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import ReadingProgress from '../../../components/ReadingProgress';
import LikeButton from '../../../components/LikeButton';
import CommentSection from '../components/CommentSection';
import SocialShare from '../../../components/SocialShare';
import TableOfContents from '../../../components/TableOfContents';
import AdSlot from '../../../components/AdSlot';
import { MonetizationOn, Info } from '@mui/icons-material';
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

  const fallbackImages = {
    Technology: 'https://picsum.photos/seed/tech/1200/600',
    Career: 'https://picsum.photos/seed/career/1200/600',
    Tutorial: 'https://picsum.photos/seed/tutorial/1200/600',
    News: 'https://picsum.photos/seed/news/1200/600',
  };
  const unsplashUrl = post.imageKeywords
    ? `https://source.unsplash.com/featured/?${post.imageKeywords}`
    : null;
  const heroImage = unsplashUrl || post.featuredImage || fallbackImages[post.category] || 'https://picsum.photos/seed/blog/1200/600';

  return (
    <Layout>
       <ReadingProgress />
       <Seo 
          title={post.seoTitle || post.title} 
          description={post.seoDescription || post.excerpt}
          image={post.featuredImage}
          url={`${window.location.origin}/blog/${post.slug}`}
          canonical={post.canonicalUrl}
          keywords={(post.seoKeywords || []).join(', ')}
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.seoTitle || post.title,
            description: post.seoDescription || post.excerpt,
            image: post.featuredImage,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            author: { '@type': 'Person', name: 'Admin' },
            publisher: { '@type': 'Organization', name: 'Digital Home' },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${window.location.origin}/blog/${post.slug}`,
            },
          }}
        />
      
       {/* Hero Image Section */}
        <Box sx={{ 
          width: '100%', 
          height: { xs: '40vh', md: '60vh' },
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          mb: 4,
          borderRadius: '32px',
          overflow: 'hidden',
        }}>
          <Box sx={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
          }} />
          <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, pb: 4 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={post.category} component={Link} to={`/category/${post.category}`} clickable sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'primary.main', fontWeight: 600 }} />
              {post.sponsored && (
                <Chip icon={<MonetizationOn />} label="Sponsored" size="small" color="warning" sx={{ bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 600 }} />
              )}
            </Box>
            <Typography variant="h2" sx={{ color: 'white', fontWeight: 700, mb: 2, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              {post.title}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2 }}>
              {new Date(post.publishedAt || post.createdAt).toLocaleDateString()} • {post.readingTime} min read • {post.views || 0} views
            </Typography>
           </Container>
        </Box>

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



         {/* Excerpt */}
         <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontStyle: 'italic', lineHeight: 1.7, color: 'text.primary' }}>
           {post.excerpt}
         </Typography>

          {/* Table of Contents */}
          {post.content && post.content.includes('<h') && (
            <TableOfContents content={post.content} />
          )}

          {/* Content */}
          <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, mb: 4, bgcolor: 'background.paper' }}>
            <div 
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.content }} 
              style={{ lineHeight: 1.8, fontSize: '1.1rem', color: 'inherit' }}
            />
            <AdSlot format="incontent" style={{ mt: 4 }} />
          </Paper>

        {/* Tags */}
        {post.tags?.length ? (
          <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {post.tags.map((tag) => (
              <Chip key={tag} label={`#${tag}`} size="small" component={Link} to={`/tags/${tag}`} clickable />
            ))}
          </Box>
        ) : null}

        {/* Affiliate Disclosure */}
        {post.affiliateDisclosure && (
          <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: 'warning.light', border: '1px solid', borderColor: 'warning.main', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <Info color="warning" sx={{ mt: 0.2, flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              This post may contain affiliate links. If you make a purchase through these links, we may earn a small commission at no extra cost to you.
            </Typography>
          </Paper>
        )}

        {/* After-post Ad */}
        <AdSlot format="afterpost" style={{ mb: 3 }} />

        {/* Actions: Like + Share */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center' }}>
          <LikeButton slug={slug} initialLikes={post.likes || 0} />
          <SocialShare title={post.title} slug={slug} />
        </Box>

        <Divider sx={{ my: 4 }} />
        
        {/* Comments */}
        <CommentSection slug={slug} />

        {/* Author Bio */}
        <Paper elevation={0} sx={{ p: 4, mt: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.25rem', fontWeight: 700 }}>
            {post.author?.charAt(0) || 'A'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{post.author || 'Admin'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
              Tech enthusiast and full-stack developer sharing insights on AI, modern web development, 
              and building products that matter. Writing about real projects and real solutions.
            </Typography>
          </Box>
        </Paper>
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
