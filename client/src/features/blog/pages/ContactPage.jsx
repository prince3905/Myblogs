import { useState } from 'react';
import { Container, Typography, Box, Paper, TextField, Button, Alert, Grid } from '@mui/material';
import { Email, LocationOn, Send } from '@mui/icons-material';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { request } from '../../../shared/lib/api';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await request('/api/contact', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSuccess('Message sent successfully! We will get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <Seo title="Contact Us | Digital Home" description="Get in touch with the Digital Home team." />

      <Box sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
            Contact
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 700, mt: 2, mb: 3, maxWidth: 600, mx: 'auto' }}>
            Get in Touch
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Have a question, suggestion, or want to collaborate? We'd love to hear from you.
          </Typography>
        </Box>

        <Grid container spacing={6} alignItems="flex-start">
          {/* Form */}
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Subject" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Message" multiline rows={5} required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                  </Grid>
                </Grid>

                {error ? <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert> : null}
                {success ? <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>{success}</Alert> : null}

                <Button type="submit" variant="contained" size="large" disabled={submitting} endIcon={<Send />} sx={{ mt: 3, fontWeight: 600, px: 4, borderRadius: 2 }}>
                  {submitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </Paper>
          </Grid>

          {/* Info */}
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                { icon: <Email />, title: 'Email', desc: 'coolfire.prince0+blogs@gmail.com' },
                { icon: <LocationOn />, title: 'Location', desc: 'Remote — Available Worldwide' },
              ].map(item => (
                <Paper key={item.title} elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2.5 }}>
                  <Box sx={{ color: 'primary.main', mt: 0.3 }}>{item.icon}</Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                  </Box>
                </Paper>
              ))}

              <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Response Time</Typography>
                <Typography variant="body2" color="text.secondary">
                  We typically respond within 24-48 hours during business days.
                </Typography>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
}
