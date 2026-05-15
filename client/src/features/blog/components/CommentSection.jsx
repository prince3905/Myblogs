import { useState, useEffect, forwardRef } from 'react';
import { 
  Box, Typography, TextField, Button, Alert, CircularProgress, 
  Paper, Divider, Avatar, Fade, IconButton 
} from '@mui/material';
import { request } from '../../../shared/lib/api';
import SendIcon from '@mui/icons-material/Send';
import CommentIcon from '@mui/icons-material/Comment';
import ReplyIcon from '@mui/icons-material/Reply';

const CommentCard = forwardRef(({ c, onReply, replyOpen, replyText, onReplyText, onReplySubmit, replying }, ref) => {
  return (
    <Paper elevation={0} ref={ref} sx={{ 
      p: 3, mb: 2, borderRadius: 3,
      border: '1px solid', borderColor: 'divider',
      transition: 'all 0.2s',
      '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)' }
    }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.9rem' }}>
          {c.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{c.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{c.content}</Typography>
          <Button size="small" onClick={() => onReply(c._id)}
            sx={{ mt: 1, fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', minWidth: 0, '&:hover': { color: 'primary.main' } }}
            startIcon={<ReplyIcon sx={{ fontSize: '0.9rem' }} />}
          >
            Reply
          </Button>
        </Box>
      </Box>

      {/* Replies */}
      {c.replies?.length > 0 && (
        <Box sx={{ ml: { xs: 1, sm: 5 }, mt: 2, pl: 2.5, borderLeft: '2px solid', borderColor: 'divider' }}>
          {c.replies.map(r => (
            <Box key={r._id} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: '0.75rem' }}>
                {r.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{r.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 0.3, lineHeight: 1.6 }}>{r.content}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Reply form */}
      {replyOpen === c._id && (
        <Box sx={{ ml: { xs: 0, sm: 5 }, mt: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField size="small" placeholder="Write a reply..." fullWidth multiline rows={2}
              value={replyText} onChange={e => onReplyText(e.target.value)} />
            <Button variant="contained" size="small" disabled={replying || !replyText.trim()}
              onClick={() => onReplySubmit(c._id)}
              sx={{ fontWeight: 600, borderRadius: 2, minWidth: 70, alignSelf: 'flex-end' }}>
              {replying ? '...' : 'Reply'}
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
});

export default function CommentSection({ slug }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

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
      setName(''); setEmail(''); setContent('');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(commentId) {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await request(`/api/admin/comments/${commentId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content: replyText }),
      });
      setReplyOpen(null);
      setReplyText('');
      const data = await request(`/api/posts/${slug}/comments`);
      setComments(data.comments || []);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setReplying(false);
    }
  }

  const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CommentIcon color="primary" />
        Comments ({totalComments})
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          {comments.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 3 }}>
              <Typography color="text.secondary">No comments yet. Be the first to comment!</Typography>
            </Paper>
          ) : (
            comments.map(c => (
              <Fade in={true} key={c._id}>
                <CommentCard c={c}
                  onReply={setReplyOpen}
                  replyOpen={replyOpen}
                  replyText={replyText}
                  onReplyText={setReplyText}
                  onReplySubmit={handleReply}
                  replying={replying}
                />
              </Fade>
            ))
          )}
        </Box>
      )}

      <Divider sx={{ my: 4 }} />

      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Leave a Comment</Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField fullWidth size="small" label="Name" value={name}
              onChange={e => setName(e.target.value)} required sx={{ flex: 1 }} />
            <TextField fullWidth size="small" type="email" label="Email" value={email}
              onChange={e => setEmail(e.target.value)} required sx={{ flex: 1 }}
              helperText="Your email won't be published" />
          </Box>
          <TextField fullWidth multiline rows={4} label="Your comment" value={content}
            onChange={e => setContent(e.target.value)} required sx={{ mb: 3 }} />
          <Button type="submit" variant="contained" disabled={submitting}
            endIcon={<SendIcon />} sx={{ fontWeight: 600, borderRadius: 2, px: 4 }}>
            {submitting ? 'Submitting...' : 'Post Comment'}
          </Button>
          {message && (
            <Fade in={!!message}>
              <Alert severity={message.includes('success') || message.includes('awaiting') ? 'success' : 'error'} sx={{ mt: 3, borderRadius: 2 }}>
                {message}
              </Alert>
            </Fade>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
