import { useState, useEffect } from 'react';
import { 
  Box, Typography, TextField, Button, Alert, CircularProgress, 
  Paper, Divider, Avatar, Fade 
} from '@mui/material';
import { request } from '../../../shared/lib/api';
import SendIcon from '@mui/icons-material/Send';
import CommentIcon from '@mui/icons-material/Comment';

export default function CommentSection({ slug }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    request(`/api/posts/${slug}/comments`)
      .then(data => setComments(data.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await request(`/api/posts/${slug}/comments`, {
        method: 'POST',
        body: JSON.stringify({ name, email, content })
      });
      setMessage('Comment submitted and awaiting approval.');
      setName('');
      setEmail('');
      setContent('');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700, 
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <CommentIcon color="primary" />
        Comments ({comments.length})
      </Typography>

      {/* Comments List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          {comments.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 3 }}>
              <Typography color="text.secondary">No comments yet. Be the first to comment!</Typography>
            </Paper>
          ) : (
            comments.map((c, idx) => (
              <Fade in={true} key={c._id}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    mb: 2, 
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {c.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {c.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(c.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                        {c.content}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Fade>
            ))
          )}
        </Box>
      )}

      <Divider sx={{ my: 4 }} />

      {/* Comment Form */}
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Leave a Comment
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              fullWidth
              size="small"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              sx={{ flex: 1 }}
            />
            <TextField
              fullWidth
              size="small"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ flex: 1 }}
              helperText="Your email won't be published"
            />
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your comment"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            endIcon={<SendIcon />}
            sx={{ 
              fontWeight: 600,
              borderRadius: 2,
              px: 4,
            }}
          >
            {submitting ? 'Submitting...' : 'Post Comment'}
          </Button>
          
          {message && (
            <Fade in={!!message}>
              <Alert 
                severity={message.includes('success') || message.includes('awaiting') ? 'success' : 'error'} 
                sx={{ mt: 3, borderRadius: 2 }}
              >
                {message}
              </Alert>
            </Fade>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
