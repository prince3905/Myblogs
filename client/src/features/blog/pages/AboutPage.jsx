import { Container, Typography, Box, Paper, Avatar, Grid } from '@mui/material';
import Layout from '../components/Layout';
import Seo from '../components/Seo';

const stats = [
  { label: 'Posts Published', value: '10+' },
  { label: 'Subscribers', value: '500+' },
  { label: 'Years Experience', value: '3+' },
];

export default function AboutPage() {
  return (
    <Layout>
      <Seo title="About Us | Digital Home" description="Learn more about Digital Home — AI consulting insights and modern web solutions." />

      <Box sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 8, md: 12 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
            About Us
          </Typography>
          <Typography variant="h2" sx={{ mt: 2, mb: 3, maxWidth: 700, mx: 'auto' }}>
            We write about what we build
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', lineHeight: 1.8 }}>
            Digital Home is a blog about AI consulting, modern web development, and the 
            intersection of technology and business. We share practical insights from real projects.
          </Typography>
        </Box>

        {/* Banner image area */}
        <Paper elevation={0} sx={{
          borderRadius: 4, overflow: 'hidden', mb: 8,
          background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
          p: { xs: 4, md: 8 },
          textAlign: 'center',
        }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
            Building in public. Sharing what works.
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 500, mx: 'auto' }}>
            Every article is born from real experience — no fluff, just practical knowledge.
          </Typography>
        </Paper>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3, mb: 8 }}>
          {stats.map(stat => (
            <Paper key={stat.label} elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 800 }}>{stat.value}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{stat.label}</Typography>
            </Paper>
          ))}
        </Box>

        {/* What we cover */}
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 4 }}>What We Cover</Typography>
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {[
            { title: 'AI & Machine Learning', desc: 'Practical guides on integrating AI into business workflows, from chatbots to predictive analytics.' },
            { title: 'Web Development', desc: 'Modern MERN stack development, architecture patterns, and performance optimization.' },
            { title: 'Tech Strategy', desc: 'How to evaluate, adopt, and scale technology solutions for growing businesses.' },
          ].map(item => (
            <Grid item xs={12} md={4} key={item.title}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{item.desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Mission */}
        <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: 4, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Our Mission</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, maxWidth: 700 }}>
            We believe the best way to learn is by building and sharing. Every article on Digital Home 
            comes from real projects, real challenges, and real solutions. No recycled content — just 
            authentic insights from the trenches of modern software development and AI implementation.
          </Typography>
        </Paper>
      </Box>
    </Layout>
  );
}
