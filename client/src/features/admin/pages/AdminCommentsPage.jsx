import { useEffect, useState } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Box, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Avatar } from '@mui/material';
import { CheckCircle, Delete, Refresh, Reply, Forum } from '@mui/icons-material';
import { request } from '../../../shared/lib/api';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  function loadComments() {
    request('/api/admin/comments')
      .then(data => setComments(data.comments || []))
      .catch(err => setError(err.message));
  }

  useEffect(() => { loadComments(); }, []);

  async function handleApprove(id) {
    try {
      await request(`/api/admin/comments/${id}/approve`, { method: 'PUT' });
      loadComments();
    } catch (err) { setError(err.message); }
  }

  async function handleDelete() {
    try {
      await request(`/api/admin/comments/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      loadComments();
    } catch (err) { setError(err.message); }
  }

  async function handleReply() {
    if (!replyText.trim()) return;
    try {
      await request(`/api/admin/comments/${replyTo}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content: replyText }),
      });
      setReplyTo(null);
      setReplyText('');
      loadComments();
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      <Box sx={{
        px: { xs: 2, md: 4 }, py: 2.5, bgcolor: 'white',
        borderBottom: '1px solid', borderColor: '#ECECEC',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>Comments</Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.3 }}>Approve, reply, and manage reader comments</Typography>
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={loadComments} sx={{ fontWeight: 600, borderRadius: 2, px: { xs: 1.5, md: 3 }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Refresh</Button>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 4 } }}>
        {error ? <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}

        {comments.map((c) => (
          <Paper key={c._id} elevation={0} sx={{ mb: 2, borderRadius: 3, border: '1px solid #ECECEC', overflow: 'hidden' }}>
            {/* Parent comment */}
            <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: { xs: 28, md: 36 }, height: { xs: 28, md: 36 }, fontSize: '0.85rem', flexShrink: 0 }}>
                {c.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 0.5, gap: 0.5 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827', display: 'inline', fontSize: { xs: '0.8rem', md: '0.875rem' } }}>{c.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280', ml: 1 }}>{c.email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
                    <Chip label={c.approved ? 'Approved' : 'Pending'} size="small"
                      sx={{ fontWeight: 600, fontSize: '0.65rem', height: 22, borderRadius: 1.5, bgcolor: c.approved ? '#D1FAE5' : '#FEF3C7', color: c.approved ? '#065F46' : '#92400E' }}
                    />
                    <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{new Date(c.createdAt).toLocaleDateString()}</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.6, mb: 1.5, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>{c.content}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {!c.approved && (
                    <Button size="small" onClick={() => handleApprove(c._id)}
                      sx={{ minWidth: 0, px: 1.5, py: 0.3, fontSize: '0.75rem', fontWeight: 600, color: '#059669', borderRadius: 1.5, '&:hover': { bgcolor: '#ECFDF5' } }}
                    >
                      <CheckCircle sx={{ fontSize: '0.85rem', mr: 0.3 }} /> Approve
                    </Button>
                  )}
                  <Button size="small" onClick={() => setReplyTo(c._id)}
                    sx={{ minWidth: 0, px: 1.5, py: 0.3, fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', borderRadius: 1.5, '&:hover': { bgcolor: '#EEF2FF' } }}
                  >
                    <Reply sx={{ fontSize: '0.85rem', mr: 0.3 }} /> {c.replies?.length ? `Reply (${c.replies.length})` : 'Reply'}
                  </Button>
                  <Button size="small" onClick={() => setDeleteId(c._id)}
                    sx={{ minWidth: 0, px: 1.5, py: 0.3, fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderRadius: 1.5, '&:hover': { bgcolor: '#FEF2F2' } }}
                  >
                    <Delete sx={{ fontSize: '0.85rem', mr: 0.3 }} /> Delete
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Replies */}
            {c.replies?.length > 0 && (
              <Box sx={{ bgcolor: '#FAFAFA', borderTop: '1px solid #ECECEC', px: 3, py: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>
                  <Forum sx={{ fontSize: '0.8rem', mr: 0.5, verticalAlign: 'middle' }} />
                  Admin Replies ({c.replies.length})
                </Typography>
                {c.replies.map(r => (
                  <Box key={r._id} sx={{ display: 'flex', gap: 1.5, mb: 1.5, '&:last-child': { mb: 0 }, pl: 2, borderLeft: '2px solid #4F46E5' }}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: '0.7rem' }}>
                      {r.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#111827' }}>{r.name} <Typography component="span" variant="caption" sx={{ color: '#6B7280', fontWeight: 400 }}>— Admin</Typography></Typography>
                        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{new Date(r.createdAt).toLocaleDateString()}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#374151', mt: 0.2, lineHeight: 1.5 }}>{r.content}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        ))}

        {!comments.length ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #ECECEC' }}>
            <Typography sx={{ color: '#6B7280', fontWeight: 600 }}>No comments yet</Typography>
            <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem', mt: 0.5 }}>Comments from readers will appear here for moderation</Typography>
          </Paper>
        ) : null}
      </Box>

      {/* Reply Dialog */}
      <Dialog open={Boolean(replyTo)} onClose={() => { setReplyTo(null); setReplyText(''); }}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Reply to Comment</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth multiline rows={4} placeholder="Write your reply..."
            value={replyText} onChange={e => setReplyText(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setReplyTo(null); setReplyText(''); }} sx={{ color: '#6B7280', fontWeight: 600, borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleReply} disabled={!replyText.trim()} variant="contained" sx={{ fontWeight: 600, borderRadius: 2, px: 3 }}>
            <Reply sx={{ fontSize: '1rem', mr: 0.5 }} /> Post Reply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Delete Comment</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#6B7280' }}>Are you sure you want to delete this comment? All replies will also be deleted.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ color: '#6B7280', fontWeight: 600, borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ fontWeight: 600, borderRadius: 2, px: 3 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
