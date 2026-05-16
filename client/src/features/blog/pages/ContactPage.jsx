import { useState } from 'react';
import { Container, Typography, Box, Paper, TextField, Button, Alert, Avatar } from '@mui/material';
import { Email, LocationOn, Send, Schedule } from '@mui/icons-material';
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

      <Box sx={{ pt: { xs: 6, md: 12 }, pb: { xs: 8, md: 12 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
          <Typography
            variant="overline"
            sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 3, fontSize: '0.75rem' }}
          >
            Contact
          </Typography>
          <Typography
            variant="h3"
            sx={{ fontWeight: 800, mt: 1.5, mb: 2, fontSize: { xs: '1.75rem', md: '2.5rem' } }}
          >
            Get in Touch
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mx: 'auto', lineHeight: 1.7 }}>
            Have a question, suggestion, or want to collaborate? We'd love to hear from you.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: { xs: 4, md: 8 }, alignItems: 'flex-start' }}>
          {/* Form Column */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                <TextField fullWidth label="Your Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <TextField fullWidth label="Email Address" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField fullWidth label="Subject" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField fullWidth label="Your Message" multiline rows={5} required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                </Box>
              </Box>

              {error ? <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert> : null}
              {success ? <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>{success}</Alert> : null}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                endIcon={<Send />}
                sx={{ mt: 3, fontWeight: 600, px: 5, py: 1.4, borderRadius: 2, fontSize: '0.95rem' }}
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </Paper>

          {/* Info Column */}
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Contact Information</Typography>
              <Typography variant="body2" color="text.secondary">
                Choose the most convenient way to reach us.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2.5, alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
                  <Email />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Email</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>coolfire.prince0+blogs@gmail.com</Typography>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2.5, alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#059669', width: 44, height: 44 }}>
                  <LocationOn />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Location</Typography>
                  <Typography variant="body2" color="text.secondary">Remote — Available Worldwide</Typography>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2.5, alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#D97706', width: 44, height: 44 }}>
                  <Schedule />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Response Time</Typography>
                  <Typography variant="body2" color="text.secondary">Within 24-48 hours on business days</Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
}
