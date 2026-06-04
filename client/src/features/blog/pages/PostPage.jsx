import { Link, useParams } from 'react-router-dom';
import { Container, Typography, Box, Button, Chip, CircularProgress, Alert, Divider, Paper, Avatar } from '@mui/material';
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
import { optimizeImage } from '../../../shared/lib/images';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-jsx';
import { usePost } from '../../../hooks/usePost';
import { postUrl } from '../../../shared/lib/category';

const HERO_PHOTOS = [
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=700&q=80',
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=700&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=700&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=700&q=80',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=700&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=700&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=700&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=700&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=700&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=700&q=80',
  'https://images.unsplash.com/photo-1559526324-593bc073d938?w=700&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=700&q=80',
  'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=700&q=80',
];

function pickHero(title) {
  if (!title) return HERO_PHOTOS[0];
  const hash = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return HERO_PHOTOS[Math.abs(hash) % HERO_PHOTOS.length];
}

export default function PostPage() {
  const { slug, category } = useParams();
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

  const heroImage = optimizeImage(post.featuredImage || pickHero(post.title), 1000, 600);

  return (
    <Layout>
       <ReadingProgress />
       <Seo 
          title={post.seoTitle || post.title} 
          description={post.seoDescription || post.excerpt}
          image={post.featuredImage}
          url={`${window.location.origin}${postUrl(post)}`}
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
            author: { '@type': 'Person', name: 'Harry Prince' },
            publisher: { '@type': 'Organization', name: 'Digital Home' },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${window.location.origin}${postUrl(post)}`,
            },
          }}
        />
      
       {/* Hero Image Section */}
        <Box sx={{ 
          width: '100%', 
          height: { xs: '40vh', md: '60vh' },
          minHeight: { xs: 280, md: 400 },
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          mb: 4,
          borderRadius: '32px',
          overflow: 'hidden',
        }}>
          <Box
            component="img"
            src={heroImage}
            alt={post.title}
            loading="eager"
            fetchpriority="high"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              zIndex: 0,
            }}
          />
          <Box sx={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1,
          }} />
          <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, pb: 4 }}>
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

          {/* Rating */}
          {post.rating && (
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>Rating:</Typography>
              {'★'.repeat(Math.floor(post.rating))}{post.rating % 1 ? '½' : ''}
              <Typography variant="body2" color="text.secondary">({post.rating}/5)</Typography>
            </Box>
          )}

          {/* YouTube Video */}
          {post.videoUrl && (
            <Box sx={{ mb: 4, borderRadius: 3, overflow: 'hidden', aspectRatio: '16/9' }}>
              <iframe
                src={post.videoUrl.replace('watch?v=', 'embed/').split('&')[0]}
                title="YouTube video"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                allowFullScreen
              />
            </Box>
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
        <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <LikeButton slug={slug} initialLikes={post.likes || 0} />
          <SocialShare title={post.title} slug={slug} category={post.category} />
        </Box>

        <Divider sx={{ my: 4 }} />
        
        {/* Comments */}
        <CommentSection slug={slug} />

        {/* Author Bio */}
        <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, mt: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: { xs: 2, md: 3 }, alignItems: 'flex-start' }}>
          <Avatar sx={{ width: { xs: 44, md: 56 }, height: { xs: 44, md: 56 }, bgcolor: 'primary.main', fontSize: '1.25rem', fontWeight: 700, flexShrink: 0 }}>
            {post.author?.charAt(0) || 'H'}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{post.author || 'Harry Prince'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
              Curious mind and lifelong learner sharing insights on technology, personal finance, career growth, 
              and the trends shaping our world. Every article is researched and written for smart readers like you.
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Related Posts */}
      {post.relatedPosts?.length > 0 && (
        <Box sx={{ bgcolor: 'grey.50', py: 6 }}>
          <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>Related Posts</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: '20px' }}>
              {post.relatedPosts.map((item) => (
                <Box key={item._id} sx={{ display: 'flex' }}>
                  <PostCard post={item} />
                </Box>
              ))}
            </Box>
          </Container>
        </Box>
      )}
    </Layout>
  );
}
