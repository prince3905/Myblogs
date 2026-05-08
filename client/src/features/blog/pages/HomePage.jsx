import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box, Grid, Stack } from '@mui/material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import { usePosts } from '../../../hooks/usePosts';

export default function HomePage() {
  const { posts, loading, error } = usePosts({ limit: 6 });

  return (
    <Layout>
      <Seo title="Inkspire Blog | MERN Publishing Platform" description="Create, publish, edit and manage SEO-ready blog content with a modern MERN stack website." />
      
       {/* Modern Hero Section */}
       <Box
         sx={{
           background: '#ffffff',
           color: 'text.primary',
           py: { xs: 8, md: 12 },
           px: 2,
           textAlign: 'center',
           position: 'relative',
           overflow: 'hidden',
         }}
       >
         <Container maxWidth="md">
           <Typography
             variant="overline"
             sx={{
               letterSpacing: 3,
               color: 'primary.main',
               fontWeight: 600,
               fontSize: '0.95rem',
               mb: 2,
               display: 'block',
             }}
           >
             MERN Blogging Platform
           </Typography>
           
           <Typography
             variant="h1"
             sx={{
               fontWeight: 800,
               mb: 3,
               fontSize: { xs: '2.5rem', md: '3.5rem' },
               lineHeight: 1.1,
               color: 'text.primary',
             }}
           >
             Publish fast, rank smarter, and manage every article from one dashboard.
           </Typography>
           
           <Typography
             variant="h6"
             sx={{
               mb: 4,
               fontWeight: 400,
               color: 'text.secondary',
               maxWidth: 600,
               mx: 'auto',
               lineHeight: 1.7,
             }}
           >
             This starter gives you post CRUD, SEO fields, categories, search, drafts, and a clean admin workflow.
           </Typography>
           
           <Stack
             direction="row"
             spacing={2}
             justifyContent="center"
             flexWrap="wrap"
           >
             <Button
               component={Link}
               to="/blog"
               variant="contained"
               size="large"
               sx={{
                 bgcolor: 'primary.main',
                 color: 'white',
                 fontWeight: 700,
                 px: 4,
                 py: 1.5,
                 fontSize: '1.1rem',
                 '&:hover': {
                   bgcolor: 'primary.dark',
                   transform: 'translateY(-2px)',
                 }
               }}
             >
               Explore Blog
             </Button>
             <Button
               component={Link}
               to="/admin"
               variant="outlined"
               size="large"
               sx={{
                 color: 'primary.main',
                 borderColor: 'primary.main',
                 borderWidth: 2,
                 fontWeight: 600,
                 px: 4,
                 py: 1.5,
                 fontSize: '1.1rem',
                 '&:hover': {
                   borderColor: 'primary.dark',
                   bgcolor: 'rgba(99, 102, 241, 0.04)',
                   transform: 'translateY(-2px)',
                 }
               }}
             >
               Open Admin
             </Button>
           </Stack>
         </Container>
       </Box>

      {/* Recent Posts Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            Recent Posts
          </Typography>
          <Button
            component={Link}
            to="/blog"
            color="primary"
            sx={{ fontWeight: 600 }}
          >
            View all →
          </Button>
        </Box>

        {loading ? (
          <Typography sx={{ textAlign: 'center', py: 4 }}>Loading posts...</Typography>
        ) : error ? (
          <Typography color="error" sx={{ textAlign: 'center', py: 4 }}>
            Error loading posts: {error}
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 4,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
              },
            }}
          >
            {posts.map((post) => (
              <Box key={post._id} sx={{ minWidth: 0 }}>
                <PostCard post={post} />
              </Box>
            ))}

            {!posts.length ? (
              <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
                <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No published posts yet. Log in to admin and create your first article.
                </Typography>
              </Box>
            ) : null}
          </Box>
        )}
      </Container>
    </Layout>
  );
}
