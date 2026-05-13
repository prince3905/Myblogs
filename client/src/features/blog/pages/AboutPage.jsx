import { Container, Typography, Box, Paper, Grid } from '@mui/material';
import Layout from '../components/Layout';
import Seo from '../components/Seo';

const stats = [
  { label: 'Posts Published', value: '19+' },
  { label: 'Subscribers', value: '500+' },
  { label: 'Topics Covered', value: '4+' },
];

const categories = [
  { title: 'Technology', desc: 'AI, quantum computing, smart devices, and the latest tech trends that are shaping our future.' },
  { title: 'Tutorials', desc: 'Step-by-step guides on web development, software tools, and practical digital skills.' },
  { title: 'Career & Finance', desc: 'Remote work tips, freelancing strategies, investment advice, and career growth insights.' },
  { title: 'News & Trends', desc: 'Analysis of Google updates, industry shifts, and what they mean for you.' },
];

export default function AboutPage() {
  return (
    <Layout>
      <Seo title="About Us | Digital Home" description="Digital Home is your universal information hub — Technology, Finance, Career, Tutorials, and Trends in simple language." />

      <Box sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 8, md: 12 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
            About Us
          </Typography>
          <Typography variant="h2" sx={{ mt: 2, mb: 3, maxWidth: 700, mx: 'auto' }}>
            Digital Home: Aapka Universal Information Partner
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto', lineHeight: 1.8 }}>
            Digital Home ki shuruaat ek simple soch se hui: Internet par jankari bahut hai, 
            par sahi aur asaan bhasha mein gyan kam hai. Hum ek aisa platform hain jahan 
            sirf coding nahi, balki Tech, Personal Finance, Future Trends aur Daily Life 
            Hacks ke baare mein deep research-based content milta hai.
          </Typography>
        </Box>

        {/* Story */}
        <Paper elevation={0} sx={{
          borderRadius: 4, overflow: 'hidden', mb: 8,
          background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
          p: { xs: 4, md: 8 },
          textAlign: 'center',
        }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
            Hum Kya Karte Hain?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', maxWidth: 600, mx: 'auto', lineHeight: 1.8 }}>
            Hum internet ki bheed se sabse kaam ki baatein nikaalte hain, unhe test karte hain, 
            aur phir aapke liye asaan articles mein pesh karte hain. Chahe wo naya Google Update 
            ho ya paise bachane ke tarike — aapko sab yahan milega.
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
          {categories.map(item => (
            <Grid item xs={12} sm={6} key={item.title}>
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
            Humari mission hai ki har koi — chahe wo student ho, professional ho, ya business owner — 
            ko easily samajh aane wali, research-based information mile. Hum complicated topics ko 
            simple language mein todte hain taake aap bina time waste kiye actionable insights le 
            sakein. Koi bhi topic ho, Digital Home par aapko woh milega jo aapko aage badhne mein madad kare.
          </Typography>
        </Paper>
      </Box>
    </Layout>
  );
}
