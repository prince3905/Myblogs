import { Container, Typography, Box, Paper, Grid, Card, CardContent, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import BuildIcon from '@mui/icons-material/Build';
import CampaignIcon from '@mui/icons-material/Campaign';
import ArticleIcon from '@mui/icons-material/Article';

const stats = [
  { label: 'Verified Job Updates', value: '5,000+' },
  { label: 'Active Monthly Readers', value: '100K+' },
  { label: 'Free Student Tools', value: '4+' },
  { label: 'Interactive Games', value: '100% Free' },
];

const offerings = [
  {
    title: 'Government Job Vacancy & Result 2026',
    desc: 'Lakhon students ke liye sabse fast aur 100% verified notification alerts, admit cards, key exam dates, aur results official government sources se sync kiye jate hain.',
    icon: <CampaignIcon color="primary" sx={{ fontSize: 40 }} />
  },
  {
    title: 'Kids Brain Booster Games',
    desc: 'Bacho ki concentration, memory, logic aur math skills badhane ke liye interactive, ad-free educational games (/games) banaye gaye hain, jo learning ko fun banate hain.',
    icon: <SportsEsportsIcon color="secondary" sx={{ fontSize: 40 }} />
  },
  {
    title: 'Student Form Resizer Tools',
    desc: 'Government exam forms bharte samay photo aur signature size limitations ko solve karne ke liye hamare high-speed custom Resizer Tools (/tools) help karte hain.',
    icon: <BuildIcon color="success" sx={{ fontSize: 40 }} />
  },
  {
    title: 'All Insights Blog & Public Information',
    desc: 'We publish highly useful, research-backed public information articles in English & Hinglish across diverse categories like Technology, AI updates, Personal Finance, Careers, and Health & Wellness to help readers make smart decisions.',
    icon: <ArticleIcon color="warning" sx={{ fontSize: 40 }} />
  }
];

const categories = [
  { title: 'Technology & AI', desc: 'Artificial Intelligence, quantum computing, smart gadgets aur digital age ki future technologies ke bare me detailed articles.' },
  { title: 'Tech Tutorials', desc: 'Programming, web development, coding guide, software, aur dynamic digital tools ke usage tutorials step-by-step.' },
  { title: 'Career & Growth', desc: 'Remote jobs, online money-making methods, freelancing strategies aur corporate career growth hacks.' },
  { title: 'Personal Finance', desc: 'Investment plans, safe budgeting ideas, financial calculations aur future security tips simple Hinglish me.' },
  { title: 'Health & Wellness', desc: 'Medical insights, balanced diets, workouts, aur digital life me health maintain karne ke verified guidelines.' },
  { title: 'Reviews & Analysis', desc: 'Modern electronic products, web applications, softwares aur online courses ke realistic aur neutral reviews.' }
];

export default function AboutPage() {
  const isBrowser = typeof window !== 'undefined';
  const origin = isBrowser ? window.location.origin : 'https://www.digitalhomeblog.in';

  // Structured Data for E-E-A-T validation (AboutPage & Organization Schema)
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      '@id': `${origin}/about#webpage`,
      'url': `${origin}/about`,
      'name': 'About Us - Digital Home Blog',
      'description': 'Digital Home is your trusted universal information partner. Learn about our verified government job vacancies, online tools, tech guides, and educational kids games.',
      'mainEntity': {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        'name': 'Digital Home',
        'url': origin,
        'logo': {
          '@type': 'ImageObject',
          'url': `${origin}/logo.webp`
        }
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'Digital Home kya hai aur ye kiski madad karta hai?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Digital Home ek universal resource portal hai jo students, job seekers aur tech enthusiasts ke liye asaan bhasha me verified government job notifications, admit cards, free photo/sign resizer tools aur ad-free kids brain booster games pradan karta hai.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Kya is portal ke government jobs updates authentic hote hain?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Haan, hamari editorial desk har recruitment notification ko seedhe official government gazettes, MP online, SSC, UPSC, aur railways ke official websites se cross-verify karne ke baad hi publish karti hai.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Kya Digital Home par games aur tools bilkul free hain?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Haan, hamare custom tools (Photo & Signature Resizer) aur Kids Brain Booster educational games 100% Free aur completely Ad-Free hain jo smooth user experience dete hain.'
          }
        }
      ]
    }
  ];

  return (
    <Layout>
      <Seo 
        title="About Us - Government Job Vacancies, Tech Guides & Kids Games" 
        description="Learn about Digital Home, your trusted universal information partner. We offer verified Government Job Alerts, free resizer tools, and interactive kids games." 
        jsonLd={jsonLd}
        keywords="About Digital Home, Government Job Vacancy & Result 2026, Free Photo Resizer, Kids Brain Booster Games, All Insights Blog, Technology Guides"
      />

      <Box sx={{ pt: { xs: 4, md: 8 }, pb: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
              Digital Home Portal
            </Typography>
            <Typography variant="h3" component="h1" sx={{ mt: 1, mb: 3, fontWeight: 800, fontSize: { xs: '2rem', md: '3rem' } }}>
              Digital Home: Aapka Universal Information Partner
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 750, mx: 'auto', lineHeight: 1.8, fontSize: { xs: '1rem', md: '1.15rem' }, fontWeight: 400 }}>
              Digital Home ki shuruaat ek mission ke sath hui: Internet par resources bahut hain, par sahi aur asaan bhasha me trustable gyan kam hai. Hum ek aisi authority space hain jahan deep-research based content, helpful student tools aur learning tools ek hi chat ke niche milte hain.
            </Typography>
          </Box>

          {/* Stats Bar */}
          <Grid container spacing={3} sx={{ mb: 8 }}>
            {stats.map(stat => (
              <Grid item xs={6} md={3} key={stat.label}>
                <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 4, border: '1px solid', borderColor: 'divider', transition: '0.3s', '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.05)' } }}>
                  <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 800 }}>{stat.value}</Typography>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, fontWeight: 600 }}>{stat.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Our Key Products / Services Section */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 800, mb: 4, textAlign: 'center' }}>
              Hamari Unique Features & Services
            </Typography>
            <Grid container spacing={4}>
              {offerings.map(item => (
                <Grid item xs={12} sm={6} md={3} key={item.title}>
                  <Card elevation={0} sx={{ height: '100%', borderRadius: 4, border: '1px solid', borderColor: 'divider', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.06)' } }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: 3, bgcolor: 'grey.50', mb: 2 }}>
                        {item.icon}
                      </Box>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 750, mb: 1.5 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {item.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Fact-Checking & Trust Shield (E-E-A-T Core Section) */}
          <Paper elevation={0} sx={{
            borderRadius: 5, overflow: 'hidden', mb: 8,
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            p: { xs: 4, md: 6 },
            color: 'white',
            position: 'relative'
          }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <VerifiedUserIcon sx={{ color: '#fbbf24', fontSize: 36 }} />
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    100% Accuracy & Trust (सटीकता नीति)
                  </Typography>
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}>
                  Hum aam blogging sites ki tarah rumours ya unverified sources se copy-paste nahi karte. Digital Home par publish hone wali har ek Government Job updates ya post official gazettes, press notes aur authorised portals ke rules se match ki jati hai. Humare internal algorithms har notification details ko clean karke simple bullet points me layout karte hain taaki aapka time waste na ho.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'center' } }}>
                <Paper elevation={0} sx={{ display: 'inline-block', p: 3, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#fbbf24' }}>E-E-A-T</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>Verified & Expert Authored</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          {/* Topics We Cover */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 800, mb: 4 }}>
              Main Content Categories (मुख्य श्रेणियाँ)
            </Typography>
            <Grid container spacing={3}>
              {categories.map(item => (
                <Grid item xs={12} sm={6} md={4} key={item.title}>
                  <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%', transition: '0.3s', '&:hover': { borderColor: 'primary.light' } }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 700, mb: 1.5, fontSize: '1.1rem' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {item.desc}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* FAQ Accordion Section (Highly SEO-Effective) */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 800, mb: 4, textAlign: 'center' }}>
              Frequently Asked Questions (FAQ)
            </Typography>
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 700 }}>1. Digital Home kya hai aur ye kiski madad karta hai?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    Digital Home ek universal resource portal hai jo students, job seekers aur tech enthusiasts ke liye asaan bhasha me verified government job notifications, admit cards, free photo/sign resizer tools aur ad-free kids brain booster games pradan karta hai.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 700 }}>2. Kya is portal ke government jobs updates authentic hote hain?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    Haan, hamari editorial desk har recruitment notification ko seedhe official government gazettes, MP online, SSC, UPSC, aur railways ke official websites se cross-verify karne ke baad hi publish karti hai.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 700 }}>3. Kya Digital Home par games aur tools bilkul free hain?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    Haan, hamare custom tools (Photo & Signature Resizer) aur Kids Brain Booster educational games 100% Free aur completely Ad-Free hain jo smooth user experience dete hain.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>
          </Box>

          {/* Mission & Future Focus */}
          <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: 5, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 800, mb: 3 }}>Our Core Mission</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, maxWidth: 850 }}>
              Humara lakshya hai ki har koi — chahe wo student ho, job aspirant ho, professional ho, ya parent — ko easily samajh aane wali aur research-backed digital information mile. Hum complicated government notification structures aur difficult technical concepts ko simple, straightforward language me layout karte hain taaki aap bina time gawaye right directions me process kar sakein.
            </Typography>
          </Paper>

        </Container>
      </Box>
    </Layout>
  );
}
